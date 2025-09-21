import type { ChainInfoArgs, ProviderError } from "@aurowallet/mina-provider"
import { Mina, PublicKey, TokenId } from "o1js"
import pLimit from "p-limit"
import type { Client } from "urql"
import { assertEvent, assign, emit, enqueueActions, fromPromise, setup } from "xstate"
import { type ChainNetwork, type NetworkLayer, urls } from "../../constants"
import { FetchAccountBalanceQuery } from "../../graphql/mina"
import { prefixedLogger } from "../../helpers/debug"
import { fromCallback } from "../../helpers/xstate"
import type { AllTokenBalances, Balance, FetchBalanceInput, TokenBalances, WalletEmit, WalletEvent } from "./types"

const logger = prefixedLogger("[WALLET]")

export type Networks = keyof typeof urls
export type Urls = (typeof urls)[Networks]

const emptyNetworkBalance = (): Balance => ({
	"mina:mainnet": { MINA: { symbol: "MINA", balance: 0 } },
	"mina:devnet": { MINA: { symbol: "MINA", balance: 0 } },
	"zeko:testnet": { MINA: { symbol: "MINA", balance: 0 } },
	"zeko:mainnet": { MINA: { symbol: "MINA", balance: 0 } }
})

const toNumber = (n: unknown) => {
	if (typeof n === "string") {
		const t = Number.parseFloat(n)
		return Number.isNaN(t) ? 0 : t
	}
	if (typeof n === "number") return n
	return 0
}

const toNetwork = (networkId: ChainInfoArgs["networkID"]): Networks => {
	if (Object.keys(urls).includes(networkId)) return networkId as Networks
	logger.info("Unknown network, falling back to mina:devnet", networkId)
	return "mina:devnet" // Fallback to devnet
}

export const createWalletMachine = ({ createMinaClient }: { createMinaClient: (url: string) => Client }) =>
	setup({
		types: {
			context: {} as {
				account: string
				currentNetwork: Networks
				balances: Balance
			},
			emitted: {} as WalletEmit,
			events: {} as WalletEvent
		},
		actors: {
			/**
			 * Invoked on initialization to listen to Mina wallet changes.
			 */
			listenToWalletChange: fromCallback<WalletEvent, WalletEvent>(({ sendBack }) => {
				if (!window.mina) {
					sendBack({ type: "WalletExtensionNotDetected" })
					return () => {
						logger.error("listenToWalletChange : No Mina wallet detected")
					}
				}
				window.mina.on("chainChanged", ({ networkID }: ChainInfoArgs) => {
					logger.info("User manually changed network", networkID)
					sendBack({ type: "WalletExtensionChangedNetwork", network: toNetwork(networkID) })
				})
				window.mina.on("accountsChanged", (accounts: string[]) => {
					logger.info("User manually changed account", accounts)
					if (accounts.length === 0) {
						logger.info("User disconnected account")
						sendBack({ type: "Disconnect" })
					}
					if (accounts.length > 0) {
						sendBack({ type: "SetAccount", account: accounts[0] })
					}
				})
				return () => {
					logger.info("Removing listeners...")
					window.mina.removeAllListeners()
				}
			}),
			/**
			 * Invoked from Connect events to attempt to connect a Mina wallet.
			 */
			connectWallet: fromPromise<{
				currentNetwork: Networks
				accounts: string[]
			}>(async () => {
				try {
					logger.info("Connecting wallet ...")
					// Accounts is an array of string Mina addresses.
					const accounts = await window.mina.requestAccounts()
					if (accounts instanceof Error) throw accounts
					logger.success("Connected wallet", accounts)
					const { networkID } = await window.mina.requestNetwork()
					return { currentNetwork: toNetwork(networkID), accounts }
				} catch (e: unknown) {
					if (e instanceof Error) {
						logger.error(e.message)
					}
					if ((e as ProviderError).code === 4001) {
						logger.error("User rejected request")
					}
					logger.error(e)
					throw e
				}
			}),
			/**
			 * Fetches the balance of the Mina wallet on given networks.
			 */
			fetchBalance: fromPromise<TokenBalances, FetchBalanceInput>(async ({ input }) => {
				// Concurrency
				const limit = pLimit(10)
				const publicKey = input.address
				const mina = { symbol: "MINA", decimal: 1e9, tokenId: null, publicKey }
				const tokens = input.tokens
					.filter((token) => token.symbol !== "MINA")
					.map((token) => {
						return {
							symbol: token.symbol,
							decimal: token.decimal,
							tokenId:
								"poolAddress" in token
									? TokenId.toBase58(TokenId.derive(PublicKey.fromBase58(token.poolAddress)))
									: token.tokenId,
							publicKey
						}
					})
				const allTokens = [mina, ...tokens]
				const queries = Object.fromEntries(
					allTokens.map((token) => [
						token.tokenId ?? "MINA",
						limit(() =>
							createMinaClient(urls[input.network])
								.query(FetchAccountBalanceQuery, {
									tokenId: token.tokenId,
									publicKey
								})
								.toPromise()
						)
					])
				)
				const results = await Promise.all(Object.values(queries))
				return Object.keys(queries).reduce(
					(acc, tokenId, index) => {
						const result = results[index]
						const token = allTokens[index]
						const balance = toNumber(result.data?.account?.balance?.total) / token.decimal
						const [layer, netType] = (input.network as Networks).split(":") as [NetworkLayer, ChainNetwork]
						acc[layer][netType][tokenId] = { balance, symbol: token.symbol }
						return acc
					},
					{
						mina: { mainnet: {}, devnet: {} },
						zeko: { mainnet: {}, testnet: {} }
					} as AllTokenBalances
				)
			}),
			/**
			 * Changes the network of the Mina wallet.
			 */
			changeNetwork: fromPromise<{ currentNetwork: Networks }, { switchTo: Networks }>(
				async ({ input: { switchTo } }) => {
					logger.info(`Attempt to change network to ${switchTo}`)
					if (switchTo === "zeko:mainnet") logger.error("Zeko mainnet is not supported")
					const switchChain = async () => {
						const result = await window.mina.switchChain({ networkID: switchTo })
						if (result instanceof Error) throw result
						return result
					}
					const { networkID } = await switchChain()
					if (networkID !== switchTo) {
						await window.mina.addChain({ url: urls[switchTo], name: switchTo })
						await switchChain()
					}
					return { currentNetwork: switchTo }
				}
			)
		},
		actions: {
			setWalletNetwork: enqueueActions(({ enqueue }, { network }: { network: Networks }) => {
				const url = urls[network] ?? urls["mina:devnet"]
				Mina.setActiveInstance(Mina.Network(url))
				logger.success("Network set to", { network, url })
				enqueue.assign({ currentNetwork: network })
				enqueue.emit({ type: "NetworkChanged", network })
			})
		}
	}).createMachine({
		id: "wallet",
		context: {
			account: "",
			currentNetwork: "mina:devnet",
			balances: emptyNetworkBalance()
		},
		initial: "INIT",
		invoke: { src: "listenToWalletChange" },
		on: {
			WalletExtensionNotDetected: {
				target: ".UNSUPPORTED",
				actions: emit({ type: "NoMinaWalletDetected" })
			},
			WalletExtensionChangedNetwork: {
				target: ".FETCHING_BALANCE",
				description:
					"If the network is changed from the wallet extension. The NetworkChanged event will be sent by the setWalletNetwork action.",
				guard: ({ context, event }) => context.currentNetwork !== event.network,
				actions: {
					type: "setWalletNetwork",
					params: ({ event }) => ({ network: event.network })
				}
			},
			SetAccount: {
				target: ".FETCHING_BALANCE",
				description: "If the accounts are set from the wallet extension.",
				actions: enqueueActions(({ enqueue, event }) => {
					enqueue.assign({ account: event.account })
					enqueue.emit({ type: "AccountChanged", account: event.account })
				})
			},
			Disconnect: { target: ".INIT", actions: assign({ account: "" }) }
		},
		states: {
			INIT: {
				on: { Connect: { target: "CONNECTING" } }
			},
			CONNECTING: {
				invoke: {
					src: "connectWallet",
					onDone: {
						actions: enqueueActions(({ enqueue, event }) => {
							enqueue({
								type: "setWalletNetwork",
								params: { network: event.output.currentNetwork }
							})
							// This will target the FETCHING_BALANCE state
							enqueue.raise({ type: "SetAccount", account: event.output.accounts[0] })
						})
					},
					onError: {
						target: "INIT",
						actions: () => {
							logger.error("`connectWallet` actor failed, transitioning to `INIT`.")
						}
					}
				}
			},
			FETCHING_BALANCE: {
				invoke: {
					src: "fetchBalance",
					input: ({ context, event }) => {
						if (event.type === "FetchBalance") {
							return { address: context.account, tokens: event.tokens, network: event.network }
						}
						return { address: context.account, tokens: [], network: context.currentNetwork }
					},
					onDone: {
						target: "READY",
						actions: assign({
							balances: ({ context, event }) => ({
								"mina:mainnet": {
									...context.balances["mina:mainnet"],
									...event.output.mina.mainnet
								},
								"mina:devnet": {
									...context.balances["mina:devnet"],
									...event.output.mina.devnet
								},
								"zeko:mainnet": {
									...context.balances["zeko:mainnet"],
									...event.output.zeko.mainnet
								},
								"zeko:testnet": {
									...context.balances["zeko:testnet"],
									...event.output.zeko.testnet
								}
							})
						})
					},
					onError: {
						target: "FETCHING_BALANCE",
						reenter: true,
						actions: () => {
							logger.error("`fetchBalance` actor failed, re-entering `FETCHING_BALANCE`.")
						}
					}
				}
			},
			READY: {
				on: {
					RequestNetworkChange: [
						{
							target: "SWITCHING_NETWORK",
							guard: ({ context, event }) => context.currentNetwork !== event.network
						},
						{
							guard: ({ context, event }) => context.currentNetwork === event.network,
							description: "If the network is already the same, emit directly.",
							actions: emit(({ event }) => ({ type: "NetworkChanged", network: event.network }))
						}
					],
					FetchBalance: { target: "FETCHING_BALANCE" }
				}
			},
			SWITCHING_NETWORK: {
				invoke: {
					src: "changeNetwork",
					input: ({ event }) => {
						assertEvent(event, "RequestNetworkChange")
						return { switchTo: event.network }
					},
					onDone: {
						target: "FETCHING_BALANCE",
						actions: {
							type: "setWalletNetwork",
							params: ({ event }) => ({ network: event.output.currentNetwork })
						}
					},
					onError: {
						target: "READY",
						actions: () => {
							logger.error("`changeNetwork` actor failed, transitioning to `READY`.")
						}
					}
				}
			},
			UNSUPPORTED: { type: "final" }
		}
	})
