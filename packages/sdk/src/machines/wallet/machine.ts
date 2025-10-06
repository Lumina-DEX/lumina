import type { ChainInfoArgs, ProviderError } from "@aurowallet/mina-provider"
import { enableMapSet, produce } from "immer"
import { Mina } from "o1js"
import type { Client } from "urql"
import { assertEvent, assign, emit, enqueueActions, fromPromise, setup } from "xstate"
import { urls } from "../../constants"
import { minaNetwork } from "../../helpers/blockchain"
import { prefixedLogger } from "../../helpers/debug"
import { fromCallback } from "../../helpers/xstate"
import { fetchBalance } from "./actors"
import type { Balance, CustomToken, WalletEmit, WalletEvent } from "./types"

enableMapSet()

const logger = prefixedLogger("[WALLET]")

export type Networks = keyof typeof urls
export type Urls = (typeof urls)[Networks]

const emptyNetworkBalance = (): Balance => ({
	"mina:mainnet": { MINA: { symbol: "MINA", balance: 0 } },
	"mina:devnet": { MINA: { symbol: "MINA", balance: 0 } },
	"zeko:testnet": { MINA: { symbol: "MINA", balance: 0 } },
	"zeko:mainnet": { MINA: { symbol: "MINA", balance: 0 } }
})

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
				lastUpdated: Map<string, number>
			},
			emitted: {} as WalletEmit,
			events: {} as WalletEvent
		},
		actors: {
			fetchBalance,
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
				const currentNetwork = network ?? "mina:devnet"
				Mina.setActiveInstance(minaNetwork(currentNetwork))
				logger.success("Network set to", network)
				enqueue.assign({ currentNetwork: network })
				enqueue.emit({ type: "NetworkChanged", network })
			}),
			spawnBalanceUpdate: enqueueActions(
				({ enqueue, context }, { tokens, network }: { tokens: CustomToken[]; network: Networks }) => {
					const lastUpdated = context.lastUpdated.get(JSON.stringify({ network, tokens })) ?? 0
					//If the balance was fetched less than 1 second ago, skip.
					if (Date.now() - lastUpdated < 1_000) return
					const id = crypto.randomUUID()
					const input = { id, createMinaClient, address: context.account, tokens, network }
					enqueue.spawnChild("fetchBalance", { id, input })
					enqueue.assign(
						produce(context, (draft) => {
							draft.lastUpdated.set(JSON.stringify({ network, tokens }), Date.now())
						})
					)
				}
			)
		}
	}).createMachine({
		id: "wallet",
		context: {
			account: "",
			currentNetwork: "mina:devnet",
			balances: emptyNetworkBalance(),
			lastUpdated: new Map()
		},
		initial: "INIT",
		invoke: { src: "listenToWalletChange" },
		on: {
			WalletExtensionNotDetected: {
				target: ".UNSUPPORTED",
				actions: emit({ type: "NoMinaWalletDetected" })
			},
			WalletExtensionChangedNetwork: {
				description:
					"If the network is changed from the wallet extension. The NetworkChanged event will be sent by the setWalletNetwork action.",
				guard: ({ context, event }) => context.currentNetwork !== event.network,
				actions: enqueueActions(({ enqueue, event }) => {
					enqueue({ type: "setWalletNetwork", params: { network: event.network } })
					enqueue({ type: "spawnBalanceUpdate", params: { network: event.network, tokens: [] } })
				})
			},
			SetAccount: {
				description: "If the accounts are set from the wallet extension.",
				actions: enqueueActions(({ context, enqueue, event }) => {
					enqueue.assign({ account: event.account })
					enqueue.emit({ type: "AccountChanged", account: event.account })
					enqueue({ type: "spawnBalanceUpdate", params: { network: context.currentNetwork, tokens: [] } })
				})
			},
			Disconnect: { target: ".INIT", actions: assign({ account: "" }) },
			FetchBalance: {
				actions: enqueueActions(({ enqueue, event: { network, tokens } }) => {
					enqueue({ type: "spawnBalanceUpdate", params: { network, tokens } })
				})
			},
			FetchBalanceSuccess: {
				actions: enqueueActions(({ enqueue, context, event }) => {
					enqueue.assign(
						produce(context, (draft) => {
							Object.assign(draft.balances["mina:mainnet"], event.balances.mina.mainnet)
							Object.assign(draft.balances["mina:devnet"], event.balances.mina.devnet)
							Object.assign(draft.balances["zeko:mainnet"], event.balances.zeko.mainnet)
							Object.assign(draft.balances["zeko:testnet"], event.balances.zeko.testnet)
						})
					)
					enqueue.stopChild(event.id)
				})
			},
			FetchBalanceFailure: {
				actions: enqueueActions(({ enqueue, event }) => {
					//TODO: We could retry more here.
					enqueue.stopChild(event.id)
				})
			}
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
							enqueue({ type: "setWalletNetwork", params: { network: event.output.currentNetwork } })
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
					]
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
						target: "READY",
						actions: enqueueActions(({ enqueue, event }) => {
							enqueue({ type: "setWalletNetwork", params: { network: event.output.currentNetwork } })
							enqueue({ type: "spawnBalanceUpdate", params: { network: event.output.currentNetwork, tokens: [] } })
						})
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
