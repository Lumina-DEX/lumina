import type { ChainInfoArgs, ProviderError } from "@aurowallet/mina-provider"
import { Mina } from "o1js"
import type { Client } from "urql"
import { assign, emit, enqueueActions, fromPromise, setup } from "xstate"
import { urls } from "../../constants"
import { FetchAccountBalanceQuery } from "../../graphql/mina"
import { fromCallback } from "../../helpers/xstate"
import type { Balance, FetchBalanceInput, TokenBalances, WalletEmit, WalletEvent } from "./types"

export type Networks = keyof typeof urls
export type Urls = (typeof urls)[Networks]

const emptyNetworkBalance = (): Balance => ({
	"mina:testnet": { MINA: 0 },
	"mina:mainnet": { MINA: 0 },
	"mina:berkeley": { MINA: 0 },
	"zeko:mainnet": { MINA: 0 },
	"zeko:testnet": { MINA: 0 }
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
	if (networkId === "mina:devnet") return "mina:testnet"
	console.log("Unknown network, falling back to mina:testnet", networkId)
	return "mina:testnet"
}

export const createWalletMachine = (
	{ createMinaClient }: { createMinaClient: (url: string) => Client }
) =>
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
				window.mina.on("chainChanged", ({ networkID }: ChainInfoArgs) => {
					console.log("User manually changed network", networkID)
					sendBack({ type: "WalletExtensionChangedNetwork", network: toNetwork(networkID) })
				})
				window.mina.on("accountsChanged", (accounts: string[]) => {
					console.log("User manually changed account", accounts)
					if (accounts.length === 0) {
						console.log("User disconnected account")
						sendBack({ type: "Disconnect" })
					}
					if (accounts.length > 0) {
						sendBack({ type: "SetAccount", account: accounts[0] })
					}
				})
				return () => {
					console.log("Removing listeners...")
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
					console.log("Connecting wallet ...")
					// Accounts is an array of string Mina addresses.
					const accounts = await window.mina.requestAccounts()
					if (accounts instanceof Error) throw accounts
					console.log("Connected wallet", accounts)
					const { networkID } = await window.mina.requestNetwork()
					return { currentNetwork: toNetwork(networkID), accounts }
				} catch (e: unknown) {
					if (e instanceof Error) {
						console.log(e.message)
					}
					if ((e as ProviderError).code === 4001) {
						console.log("User rejected request")
					}
					console.log(e)
					throw e
				}
			}),
			/**
			 * Fetches the balance of the Mina wallet on given networks.
			 */
			fetchBalance: fromPromise<TokenBalances, FetchBalanceInput>(async ({ input }) => {
				const publicKey = input.address
				const name = input.token?.symbol.toLocaleUpperCase() ?? "MINA"
				const decimal = input.token?.decimal ?? 1e9
				const settings = { tokenId: input.token ? input.token.tokenId : null, publicKey }

				const queries = Object.fromEntries(
					input.networks.map((network) => [
						network,
						createMinaClient(urls[network]).query(FetchAccountBalanceQuery, settings)
					])
				)
				const results = await Promise.all(Object.values(queries))

				return Object.keys(queries).reduce(
					(acc, network, index) => {
						const result = results[index]
						const balance = toNumber(result.data?.account?.balance?.total) / decimal
						const [layer, netType] = (network as Networks).split(":") as [
							"mina" | "zeko",
							"testnet" | "mainnet" | "berkeley"
						]
						acc[layer][netType][name] = balance
						return acc
					},
					{
						mina: { mainnet: {}, testnet: {}, berkeley: {} },
						zeko: { mainnet: {}, testnet: {} }
					} as TokenBalances
				)
			}),
			/**
			 * Changes the network of the Mina wallet.
			 */
			changeNetwork: fromPromise<{ currentNetwork: Networks }, { switchTo: Networks }>(
				async ({ input: { switchTo } }) => {
					console.log("Change Network ...")
					// //TODO: Testnet is hardcoded for now
					if (switchTo.includes("mainnet")) console.error("Mainnet is not supported")
					if (!switchTo.startsWith("mina")) {
						// TODO: this might not be necessary
						await window.mina.addChain({ url: urls[switchTo], name: switchTo })
					}
					const result = await window.mina.switchChain({ networkID: switchTo })
					if (result instanceof Error) throw result
					return { currentNetwork: switchTo }
				}
			)
		},
		actions: {
			setWalletNetwork: enqueueActions(({ enqueue }, { network }: { network: Networks }) => {
				const url = urls[network] ?? urls["mina:testnet"]
				console.log("Setting network to", { network, url })
				Mina.setActiveInstance(Mina.Network(url))
				enqueue.assign({ currentNetwork: network })
				enqueue.emit({ type: "NetworkChanged", network })
			})
		}
	}).createMachine({
		id: "wallet",
		context: {
			account: "",
			currentNetwork: "mina:testnet",
			balances: emptyNetworkBalance()
		},
		initial: "INIT",
		invoke: { src: "listenToWalletChange" },
		on: {
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
					}
				}
			},
			FETCHING_BALANCE: {
				invoke: {
					src: "fetchBalance",
					input: ({ context, event }) => {
						if (event.type === "FetchBalance") {
							return { address: context.account, token: event.token, networks: event.networks }
						}
						// TODO: Hardcoded testnet
						return { address: context.account, networks: ["mina:testnet"] }
					},
					onDone: {
						target: "READY",
						actions: assign({
							balances: ({ context, event }) => ({
								"mina:mainnet": {
									...context.balances["mina:mainnet"],
									...event.output.mina.mainnet
								},
								"mina:testnet": {
									...context.balances["mina:testnet"],
									...event.output.mina.testnet
								},
								"mina:berkeley": {
									...context.balances["mina:berkeley"],
									...event.output.mina.berkeley
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
					}
				}
			},
			READY: {
				on: {
					RequestNetworkChange: [
						{
							target: "SWITCHING_NETWORK",
							guard: ({ context, event }) => context.currentNetwork !== event.network,
							actions: assign({ currentNetwork: ({ event }) => event.network })
						},
						{
							guard: ({ context, event }) => context.currentNetwork === event.network,
							description: "If the network is already the same, emit directly.",
							actions: emit(({ event }) => ({
								type: "NetworkChanged",
								network: event.network
							}))
						}
					],
					FetchBalance: { target: "FETCHING_BALANCE" }
				}
			},
			SWITCHING_NETWORK: {
				invoke: {
					src: "changeNetwork",
					input: ({ context }) => ({ switchTo: context.currentNetwork }),
					onDone: [
						{
							target: "FETCHING_BALANCE",
							actions: [
								{
									type: "setWalletNetwork",
									params: ({ event }) => ({
										network: event.output.currentNetwork
									})
								}
							]
						}
					]
				}
			}
		}
	})
