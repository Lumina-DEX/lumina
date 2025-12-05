import * as Comlink from "comlink"
import { produce } from "immer"
import { and, assertEvent, assign, enqueueActions, setup, spawnChild, stopChild } from "xstate"
import { chainFaucets, poolInstance } from "../../constants/index"
import type { LuminaDexWorker } from "../../dex/luminadex-worker"
import { isBetween } from "../../helpers/validation"
import { transactionMachine } from "../transaction"
import { detectWalletChange } from "../wallet/actors"
import { type CreatePoolInput, createPoolMachine } from "./actors/createPool"
import {
	calculateAddLiquidityAmount,
	calculateRemoveLiquidityAmount,
	calculateSwapAmount,
	compileContract,
	initContracts
} from "./actors/operations"
import { addLiquidity, claim, deployPool, deployToken, mintToken, removeLiquidity, swap } from "./actors/transactions"
import {
	canDoDexAction,
	canStartDexAction,
	createTransactionInput,
	inputCompile,
	inputWorker,
	loaded,
	logger,
	luminaDexFactory,
	resetSettings,
	setContractError,
	setDexError,
	setToLoadFromFeatures,
	unloadedContracts,
	walletNetwork,
	walletUser
} from "./helpers"
import type { ContractName, LuminaDexMachineContext, LuminaDexMachineEvent, LuminaDexMachineInput } from "./types"

export const createLuminaDexMachine = () =>
	setup({
		types: {
			context: {} as LuminaDexMachineContext,
			events: {} as LuminaDexMachineEvent,
			input: {} as LuminaDexMachineInput
		},
		guards: {
			isTestnet: ({ context }) => !walletNetwork(context).includes("mainnet"),
			compileFungibleToken: ({ context }) => context.contract.currentlyLoading === "FungibleToken",
			compilePool: ({ context }) => context.contract.currentlyLoading === "Pool",
			compilePoolTokenHolder: ({ context }) => context.contract.currentlyLoading === "PoolTokenHolder",
			compilePoolFactory: ({ context }) => context.contract.currentlyLoading === "PoolFactory",
			compileFaucet: ({ context }) => context.contract.currentlyLoading === "Faucet",
			compileFungibleTokenAdmin: ({ context }) => context.contract.currentlyLoading === "FungibleTokenAdmin"
		},
		actors: {
			detectWalletChange,
			createPoolMachine: createPoolMachine as any, // TODO: TS7056 :/
			transactionMachine: transactionMachine as any, // TODO: TS7056 :/
			initContracts,
			compileContract,
			claim,
			swap,
			addLiquidity,
			removeLiquidity,
			mintToken,
			deployPool,
			deployToken,
			calculateSwapAmount,
			calculateAddLiquidityAmount,
			calculateRemoveLiquidityAmount
		},
		actions: {
			setNetworkInstance: enqueueActions(({ context, event }) => {
				assertEvent(event, "NetworkChanged")
				context.contract.worker.minaInstance(event.network)
			}),
			createPool: enqueueActions(({ context, enqueue, event }) => {
				assertEvent(event, "DeployPool")
				const tokenA = event.settings.tokenA
				const tokenB = event.settings.tokenB
				const network = walletNetwork(context)
				const user = walletUser(context)
				const id = `createPool-${network}-${user}-${tokenA}-${tokenB}`
				const input = {
					wallet: context.wallet,
					tokenA,
					tokenB,
					user,
					network,
					worker: context.contract.worker
				} satisfies CreatePoolInput
				enqueue.assign(({ spawn }) => {
					const machine = context.dex.createPool.pools[id]
					if (machine) stopChild(id)
					const created = spawn("createPoolMachine", { id, input })
					return produce(context, (draft) => {
						draft.dex.createPool.pools[id] = created
					})
				})
			})
		}
	}).createMachine({
		id: "luminaDex",
		context: ({
			input: {
				wallet,
				features,
				frontendFee: { destination, amount }
			}
		}) => {
			if (!isBetween(0, 10)(amount)) throw new Error("The Frontend Fee must be between 0 and 10.")
			const nsWorker = new Worker(new URL("../../dex/luminadex-worker.ts", import.meta.url), {
				type: "module"
			})
			const worker = Comlink.wrap<LuminaDexWorker>(nsWorker)
			logger.info("Dex Features loaded:", features)
			return {
				transactions: {},
				features: features ?? ["Swap"], // Default to Swap feature if none provided
				can: {
					changeSwapSettings: false,
					swap: false,
					changeAddLiquiditySettings: false,
					addLiquidity: false,
					changeRemoveLiquiditySettings: false,
					removeLiquidity: false,
					deployPool: false,
					deployToken: false,
					mintToken: false,
					claim: false
				},
				wallet,
				frontendFee: { destination, amount },
				contract: {
					worker,
					toLoad: new Set<ContractName>([]),
					currentlyLoading: null,
					loadedNetwork: null,
					loaded: unloadedContracts(),
					error: null
				},
				dex: {
					error: null,
					swap: {
						pool: "",
						from: { address: "", amount: "" },
						to: "",
						slippagePercent: 0,
						...resetSettings
					},
					addLiquidity: {
						pool: "",
						tokenA: { address: "", amount: "" },
						tokenB: { address: "", amount: "" },
						slippagePercent: 0,
						...resetSettings
					},
					removeLiquidity: {
						pool: "",
						lpAmount: "0",
						slippagePercent: 0,
						...resetSettings
					},
					claim: { transactionLid: null },
					mint: { to: "", token: "", amount: 0, transactionLid: null },
					deployPool: { tokenA: "", tokenB: "", transactionLid: null },
					createPool: { tokenA: "", tokenB: "", pools: {} },
					deployToken: {
						symbol: "",
						transactionLid: null,
						result: {
							tokenKey: "",
							tokenAdminKey: "",
							tokenKeyPublic: "",
							tokenAdminKeyPublic: ""
						}
					}
				}
			}
		},
		entry: spawnChild("detectWalletChange", {
			input: ({ context }) => ({ wallet: context.wallet })
		}),
		on: {
			NoMinaWalletDetected: { target: ".dexSystem.UNSUPPORTED" },
			//TODO: Should we reload all-contracts on network change ?
			NetworkChanged: {
				actions: "setNetworkInstance"
				// target: "RELOAD_CONTRACTS"
			},
			AccountChanged: {}
		},
		type: "parallel",
		states: {
			contractSystem: {
				initial: "INIT_CONTRACTS",
				states: {
					INIT_CONTRACTS: {
						invoke: {
							src: "initContracts",
							input: ({ context }) => ({ ...inputWorker(context), features: context.features }),
							onDone: {
								target: "LOADING",
								actions: assign(({ context, event }) => ({
									...context,
									contract: {
										...context.contract,
										loadedNetwork: context.wallet.getSnapshot().context.currentNetwork,
										toLoad: event.output
									}
								}))
							},
							onError: {
								target: "FAILED",
								actions: assign(setContractError("Loading Contracts"))
							}
						}
					},
					RELOAD_CONTRACTS: {
						description: "Reload all contracts.",
						entry: enqueueActions(({ context, enqueue }) => {
							logger.info("Network changed, reloading all contracts...")
							const loaded = unloadedContracts()
							const toLoad = setToLoadFromFeatures(context.features)
							enqueue.assign({
								contract: {
									...context.contract,
									currentlyLoading: toLoad.values().next().value ?? null,
									loaded,
									toLoad
								}
							})
							enqueue.raise({ type: "LoadNextContract" })
						})
					},
					LOADING: {
						description: "The compiled contracts are loading.",
						entry: enqueueActions(({ context, enqueue }) => {
							if (context.contract.toLoad.size > 0) {
								const [next, ...remaining] = Array.from(context.contract.toLoad)
								logger.info(`Preparing to load '${next}' contract next, remaining:`, remaining)
								enqueue.assign({
									contract: {
										...context.contract,
										currentlyLoading: next ?? null,
										toLoad: new Set(remaining)
									}
								})
								if (next) enqueue.raise({ type: "LoadNextContract" })
							} else {
								logger.success("All features have been loaded", context.features)
								enqueue.raise({ type: "ContractsReady" })
							}
						}),
						on: {
							ContractsReady: { target: "READY" },
							LoadNextContract: [
								{ target: "COMPILE_FUNGIBLE_TOKEN", guard: "compileFungibleToken" },
								{ target: "COMPILE_FUNGIBLE_TOKEN_ADMIN", guard: "compileFungibleTokenAdmin" },
								{ target: "COMPILE_POOL", guard: "compilePool" },
								{ target: "COMPILE_POOL_TOKEN_HOLDER", guard: "compilePoolTokenHolder" },
								{ target: "COMPILE_POOL_FACTORY", guard: "compilePoolFactory" },
								{ target: "COMPILE_FAUCET", guard: "compileFaucet" }
							]
						}
					},
					COMPILE_FUNGIBLE_TOKEN: {
						invoke: {
							src: "compileContract",
							input: ({ context }) => inputCompile({ context, contract: "FungibleToken" }),
							onDone: {
								target: "LOADING",
								actions: assign(({ context }) => loaded({ context, contract: "FungibleToken" }))
							},
							onError: {
								target: "FAILED",
								actions: assign(setContractError("Compile Fungible Token Contracts"))
							}
						}
					},
					COMPILE_FUNGIBLE_TOKEN_ADMIN: {
						invoke: {
							src: "compileContract",
							input: ({ context }) => inputCompile({ context, contract: "FungibleTokenAdmin" }),
							onDone: {
								target: "LOADING",
								actions: assign(({ context }) => loaded({ context, contract: "FungibleTokenAdmin" }))
							},
							onError: {
								target: "FAILED",
								actions: assign(setContractError("Compile Fungible Token Admin Contracts"))
							}
						}
					},
					COMPILE_POOL: {
						invoke: {
							src: "compileContract",
							input: ({ context }) => inputCompile({ context, contract: "Pool" }),
							onDone: {
								target: "LOADING",
								actions: assign(({ context }) => loaded({ context, contract: "Pool" }))
							},
							onError: {
								target: "FAILED",
								actions: assign(setContractError("Compile Pool Contracts"))
							}
						}
					},
					COMPILE_POOL_TOKEN_HOLDER: {
						invoke: {
							src: "compileContract",
							input: ({ context }) => inputCompile({ context, contract: "PoolTokenHolder" }),
							onDone: {
								target: "LOADING",
								actions: assign(({ context }) => loaded({ context, contract: "PoolTokenHolder" }))
							},
							onError: {
								target: "FAILED",
								actions: assign(setContractError("Compile Pool Token Holder Contracts"))
							}
						}
					},
					COMPILE_POOL_FACTORY: {
						invoke: {
							src: "compileContract",
							input: ({ context }) => inputCompile({ context, contract: "PoolFactory" }),
							onDone: {
								target: "LOADING",
								actions: assign(({ context }) => loaded({ context, contract: "PoolFactory" }))
							},
							onError: {
								target: "FAILED",
								actions: assign(setContractError("Compile Pool Factory Contracts"))
							}
						}
					},
					COMPILE_FAUCET: {
						invoke: {
							src: "compileContract",
							input: ({ context }) => inputCompile({ context, contract: "Faucet" }),
							onDone: {
								target: "LOADING",
								actions: assign(({ context }) => loaded({ context, contract: "Faucet" }))
							},
							onError: {
								target: "FAILED",
								actions: assign(setContractError("Compile Faucet Contracts"))
							}
						}
					},
					READY: {
						description: "The contracts are compiled and ready to be used.",
						on: {
							LoadFeatures: {
								target: "LOADING",
								description: "Load additional features on the fly.",
								reenter: true,
								actions: enqueueActions(({ context, event, enqueue }) => {
									const features = new Set(event.features)
									const currentFeatures = new Set(context.features)
									const missingFeatures = features.difference(currentFeatures)
									if (missingFeatures.size === 0) return
									const additionalToLoad = setToLoadFromFeatures([...missingFeatures])
									const alreadyLoaded = new Set<ContractName>([])
									for (const [name, loaded] of Object.entries(context.contract.loaded)) {
										if (loaded) alreadyLoaded.add(name as ContractName)
									}
									const toLoad = context.contract.toLoad
										.union(additionalToLoad)
										.difference(alreadyLoaded) as Set<ContractName>
									enqueue.assign({
										features: [...currentFeatures, ...missingFeatures],
										contract: { ...context.contract, toLoad }
									})
									logger.info("Dex Features to load", missingFeatures)
								})
							}
						}
					},
					FAILED: {
						on: { InitContracts: "INIT_CONTRACTS" },
						exit: assign(({ context }) => ({ contract: { ...context.contract, error: null } }))
					}
				}
			},
			dexSystem: {
				initial: "DEX",
				states: {
					DEX: {
						initial: "READY",
						states: {
							READY: {},
							ERROR: {
								exit: assign(({ context }) => ({ dex: { ...context.dex, error: null } }))
							}
						},
						on: {
							DeployPool: [
								{
									target: "DEX.READY",
									description: "Create a pool using the API",
									guard: ({ event }) => event.settings.manual !== true,
									actions: {
										type: "createPool",
										params: ({ context, event }) => ({
											wallet: context.wallet,
											tokenA: event.settings.tokenA,
											tokenB: event.settings.tokenB,
											user: walletUser(context),
											network: walletNetwork(context)
										})
									}
								},
								{
									target: "DEPLOYING_POOL",
									description: "Deploy a pool manually for a given token.",
									guard: ({ event, context }) =>
										event.settings.manual === true && canStartDexAction(context).deployPool,
									actions: assign(({ context, event }) => ({
										dex: {
											...context.dex,
											deployPool: {
												...context.dex.deployPool,
												...event.settings,
												transactionLid: null
											}
										}
									}))
								}
							],
							DeployToken: {
								target: "DEPLOYING_TOKEN",
								description: "Deploy a token.",
								guard: ({ context }) => canStartDexAction(context).deployToken,
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										deployToken: {
											symbol: event.settings.symbol,
											transactionLid: null,
											result: null
										}
									}
								}))
							},
							ClaimTokensFromFaucet: {
								target: "CLAIMING_FROM_FAUCET",
								description: "Claim tokens from the faucet. Testnet Only.",
								guard: and(["isTestnet", ({ context }) => canStartDexAction(context).claim]),
								actions: assign(({ context }) => ({
									dex: { ...context.dex, claim: { transactionLid: null } }
								}))
							},
							MintToken: {
								target: "MINTING",
								description: "Mint a token to a given destination address.",
								guard: ({ context }) => canStartDexAction(context).mintToken,
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										mint: { ...context.dex.mint, ...event.settings, transactionLid: null }
									}
								}))
							},
							ChangeRemoveLiquiditySettings: {
								target: "CALCULATING_REMOVE_LIQUIDITY_AMOUNT",
								description: "Change the settings for adding liquidity.",
								guard: ({ context }) => canStartDexAction(context).removeLiquidity,
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										removeLiquidity: { ...event.settings, ...resetSettings }
									}
								}))
							},
							RemoveLiquidity: {
								target: "REMOVING_LIQUIDITY",
								description: "Create and send a transaction to remove liquidity from a pool.",
								guard: ({ context }) => canDoDexAction(context).removeLiquidity
							},
							ChangeAddLiquiditySettings: {
								target: "CALCULATING_ADD_LIQUIDITY_AMOUNT",
								description: "Change the settings for adding liquidity.",
								guard: ({ context }) => canStartDexAction(context).addLiquidity,
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										addLiquidity: { ...event.settings, ...resetSettings }
									}
								}))
							},
							AddLiquidity: {
								target: "ADDING_LIQUIDITY",
								description: "Create and send a transaction to add liquidity to a pool.",
								guard: ({ context }) => canDoDexAction(context).addLiquidity
							},
							ChangeSwapSettings: {
								target: "CALCULATING_SWAP_AMOUNT",
								description: "Change the settings for a token swap.",
								guard: ({ context }) => canStartDexAction(context).changeSwapSettings,
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										swap: { ...event.settings, ...resetSettings }
									}
								}))
							},
							Swap: {
								target: "SWAPPING",
								guard: ({ context }) => canDoDexAction(context).swap,
								description: "Create and send a transaction to swap tokens. To be called after ChangeSwapSettings."
							}
						}
					},
					DEPLOYING_TOKEN: {
						invoke: {
							src: "deployToken",
							input: ({ context, event }) => {
								assertEvent(event, "DeployToken")
								return {
									...inputWorker(context),
									symbol: context.dex.deployToken.symbol,
									user: walletUser(context)
								}
							},
							onDone: {
								target: "DEX.READY",
								actions: assign(({ context, event, spawn }) => {
									const input = createTransactionInput({
										context,
										transaction: event.output.transactionOutput
									})
									return produce(context, (draft) => {
										draft.transactions[input.id] = spawn("transactionMachine", { input })
										const { symbol, ...result } = event.output.token
										draft.dex.deployToken.symbol = symbol
										draft.dex.deployToken.transactionLid = input.id
										draft.dex.deployToken.result = result
									})
								})
							},
							onError: {
								target: "DEX.ERROR",
								actions: assign(setDexError("Deploying Token"))
							}
						}
					},
					DEPLOYING_POOL: {
						invoke: {
							src: "deployPool",
							input: ({ context, event }) => {
								assertEvent(event, "DeployPool")
								const { signer, user0 } = poolInstance[walletNetwork(context)]
								return {
									...inputWorker(context),
									tokenA: context.dex.deployPool.tokenA,
									tokenB: context.dex.deployPool.tokenB,
									user: walletUser(context),
									factory: luminaDexFactory(context),
									signer,
									user0
								}
							},
							onDone: {
								target: "DEX.READY",
								actions: [
									assign(({ context, event, spawn }) => {
										const input = createTransactionInput({
											context,
											transaction: event.output
										})
										return produce(context, (draft) => {
											draft.transactions[input.id] = spawn("transactionMachine", { input })
											draft.dex.deployPool.transactionLid = input.id
										})
									})
								]
							},
							onError: {
								target: "DEX.ERROR",
								actions: assign(setDexError("Deploying Pool"))
							}
						}
					},
					CLAIMING_FROM_FAUCET: {
						invoke: {
							src: "claim",
							input: ({ context, event }) => {
								assertEvent(event, "ClaimTokensFromFaucet")
								const faucet = chainFaucets[walletNetwork(context)]
								return { ...inputWorker(context), user: walletUser(context), faucet }
							},
							onDone: {
								target: "DEX.READY",
								actions: assign(({ context, event, spawn }) => {
									const input = createTransactionInput({
										context,
										transaction: event.output
									})
									return produce(context, (draft) => {
										draft.transactions[input.id] = spawn("transactionMachine", { input })
										draft.dex.claim.transactionLid = input.id
									})
								})
							},
							onError: {
								target: "DEX.ERROR",
								actions: assign(setDexError("Claiming from Faucet"))
							}
						}
					},
					MINTING: {
						invoke: {
							src: "mintToken",
							input: ({ context, event }) => {
								assertEvent(event, "MintToken")
								const mint = context.dex.mint
								return {
									...inputWorker(context),
									user: walletUser(context),
									to: mint.to,
									token: mint.token,
									amount: mint.amount
								}
							},
							onDone: {
								target: "DEX.READY",
								actions: assign(({ context, event, spawn }) => {
									const input = createTransactionInput({
										context,
										transaction: event.output
									})
									return produce(context, (draft) => {
										draft.transactions[input.id] = spawn("transactionMachine", { input })
										draft.dex.mint.transactionLid = input.id
									})
								})
							},
							onError: {
								target: "DEX.ERROR",
								actions: assign(setDexError("Minting Token"))
							}
						}
					},
					SWAPPING: {
						invoke: {
							src: "swap",
							input: ({ context, event }) => {
								assertEvent(event, "Swap")
								const swap = context.dex.swap
								if (!swap.calculated) throw new Error("Swap amount not calculated.")
								return {
									...inputWorker(context),
									frontendFee: context.frontendFee.amount,
									frontendFeeDestination: context.frontendFee.destination,
									user: walletUser(context),
									pool: swap.pool,
									from: swap.from.address,
									to: swap.to,
									amount: swap.calculated.amountIn,
									minOut: swap.calculated.amountOut,
									balanceOutMin: swap.calculated.balanceOutMin,
									balanceInMax: swap.calculated.balanceInMax,
									factory: luminaDexFactory(context)
								}
							},
							onDone: {
								target: "DEX.READY",
								actions: assign(({ context, event, spawn }) => {
									const input = createTransactionInput({
										context,
										transaction: event.output
									})
									return produce(context, (draft) => {
										draft.transactions[input.id] = spawn("transactionMachine", { input })
										draft.dex.swap.transactionLid = input.id
										draft.dex.swap.calculated = null
									})
								})
							},
							onError: {
								target: "DEX.ERROR",
								actions: assign(setDexError("Swapping Token"))
							}
						}
					},
					ADDING_LIQUIDITY: {
						invoke: {
							src: "addLiquidity",
							input: ({ context, event }) => {
								assertEvent(event, "AddLiquidity")
								const liquidity = context.dex.addLiquidity
								if (!liquidity.calculated) throw new Error("Liquidity amount not calculated.")
								return {
									...inputWorker(context),
									user: walletUser(context),
									pool: liquidity.pool,
									supplyMin: liquidity.calculated.supplyMin,
									tokenA: {
										address: liquidity.calculated.tokenA.address,
										amount: liquidity.calculated.tokenA.amountIn,
										reserve: liquidity.calculated.tokenA.balanceMax
									},
									tokenB: {
										address: liquidity.calculated.tokenB.address,
										amount: liquidity.calculated.tokenB.amountIn,
										reserve: liquidity.calculated.tokenB.balanceMax
									}
								}
							},
							onDone: {
								target: "DEX.READY",
								actions: assign(({ context, event, spawn }) => {
									const input = createTransactionInput({
										context,
										transaction: event.output
									})
									return produce(context, (draft) => {
										draft.transactions[input.id] = spawn("transactionMachine", { input })
										draft.dex.addLiquidity.transactionLid = input.id
										draft.dex.addLiquidity.calculated = null
									})
								})
							},
							onError: {
								target: "DEX.ERROR",
								actions: assign(setDexError("Adding Liquidity"))
							}
						}
					},
					REMOVING_LIQUIDITY: {
						invoke: {
							src: "removeLiquidity",
							input: ({ context, event }) => {
								assertEvent(event, "RemoveLiquidity")
								const liquidity = context.dex.removeLiquidity
								if (!liquidity.calculated) throw new Error("Liquidity amount not calculated.")
								return {
									...inputWorker(context),
									user: walletUser(context),
									pool: liquidity.pool,
									supplyMax: liquidity.calculated.supplyMax,
									liquidityAmount: liquidity.calculated.liquidity,
									tokenA: {
										address: liquidity.calculated.tokenA.address,
										amount: liquidity.calculated.tokenA.amountOut,
										reserve: liquidity.calculated.tokenA.balanceMin
									},
									tokenB: {
										address: liquidity.calculated.tokenB.address,
										amount: liquidity.calculated.tokenB.amountOut,
										reserve: liquidity.calculated.tokenB.balanceMin
									}
								}
							},
							onDone: {
								target: "DEX.READY",
								actions: assign(({ context, event, spawn }) => {
									const input = createTransactionInput({
										context,
										transaction: event.output
									})
									return produce(context, (draft) => {
										draft.transactions[input.id] = spawn("transactionMachine", { input })
										draft.dex.removeLiquidity.transactionLid = input.id
										draft.dex.removeLiquidity.calculated = null
									})
								})
							},
							onError: {
								target: "DEX.ERROR",
								actions: assign(setDexError("Removing Liquidity"))
							}
						}
					},
					CALCULATING_SWAP_AMOUNT: {
						invoke: {
							src: "calculateSwapAmount",
							input: ({ context }) => {
								const swap = context.dex.swap
								return {
									...inputWorker(context),
									pool: swap.pool,
									from: swap.from,
									to: swap.to,
									slippagePercent: swap.slippagePercent,
									frontendFee: context.frontendFee.amount
								}
							},
							onDone: {
								target: "DEX.READY",
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										swap: {
											...context.dex.swap,
											calculated: {
												...event.output.swapAmount
											}
										}
									}
								}))
							},
							onError: {
								target: "DEX.ERROR",
								actions: assign(setDexError("Calculating Swap Amount"))
							}
						}
					},
					CALCULATING_ADD_LIQUIDITY_AMOUNT: {
						invoke: {
							src: "calculateAddLiquidityAmount",
							input: ({ context }) => {
								const liquidity = context.dex.addLiquidity
								return {
									...inputWorker(context),
									pool: liquidity.pool,
									tokenA: liquidity.tokenA,
									tokenB: liquidity.tokenB,
									slippagePercent: liquidity.slippagePercent
								}
							},
							onDone: {
								target: "DEX.READY",
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										addLiquidity: {
											...context.dex.addLiquidity,
											calculated: {
												...event.output
											}
										}
									}
								}))
							},
							onError: {
								target: "DEX.ERROR",
								actions: assign(setDexError("Calculating Add Liquidity Amount"))
							}
						}
					},
					CALCULATING_REMOVE_LIQUIDITY_AMOUNT: {
						invoke: {
							src: "calculateRemoveLiquidityAmount",
							input: ({ context }) => {
								const liquidity = context.dex.removeLiquidity
								return {
									...inputWorker(context),
									pool: liquidity.pool,
									lpAmount: liquidity.lpAmount,
									slippagePercent: liquidity.slippagePercent
								}
							},
							onDone: {
								target: "DEX.READY",
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										removeLiquidity: {
											...context.dex.removeLiquidity,
											calculated: {
												...event.output
											}
										}
									}
								}))
							},
							onError: {
								target: "DEX.ERROR",
								actions: assign(setDexError("Calculating Remove Liquidity Amount"))
							}
						}
					},
					UNSUPPORTED: { type: "final" }
				}
			}
		}
	})
