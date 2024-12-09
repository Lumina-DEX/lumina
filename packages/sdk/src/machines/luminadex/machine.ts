import * as Comlink from "comlink"
import { PrivateKey } from "o1js"
import {
	type ActionArgs,
	and,
	assertEvent,
	assign,
	enqueueActions,
	type ErrorActorEvent,
	fromPromise,
	setup,
	stateIn
} from "xstate"
import { chainFaucets, luminadexFactories } from "../../constants/index"
import type {
	AddLiquidity,
	FaucetSettings,
	InitZkappInstance,
	LuminaDexWorker,
	MintToken,
	SwapArgs,
	WithdrawLiquidity
} from "../../dex/luminadex-worker"
import {
	getAmountLiquidityOut,
	getAmountOut,
	getAmountOutFromLiquidity,
	getFirstAmountLiquidityOut
} from "../../dex/utils"
import { sendTransaction } from "../../helpers/transfer"
import { isBetween } from "../../helpers/validation"
import { detectWalletChange } from "../wallet/actors"
import type {
	AddLiquiditySettings,
	InputDexWorker,
	LuminaDexMachineContext,
	LuminaDexMachineEvent,
	LuminaDexMachineInput,
	PoolSettings,
	RemoveLiquiditySettings,
	SwapSettings,
	User
} from "./types"

const inputWorker = (context: LuminaDexMachineContext) => {
	if (!context.contract.worker) throw new Error("Worker not initialized")
	return { worker: context.contract.worker }
}

const setContractError = (defaultMessage: string) =>
(
	{ context, event }: ActionArgs<LuminaDexMachineContext, ErrorActorEvent, LuminaDexMachineEvent>
) => {
	if (event.error instanceof Error) {
		return { contract: { ...context.contract, error: event.error } }
	}
	return { contract: { ...context.contract, error: new Error(defaultMessage) } }
}

const setDexError = (defaultMessage: string) =>
(
	{ context, event }: ActionArgs<LuminaDexMachineContext, ErrorActorEvent, LuminaDexMachineEvent>
) => {
	if (event.error instanceof Error) {
		return { contract: { ...context.contract, error: event.error } }
	}
	return { contract: { ...context.contract, error: new Error(defaultMessage) } }
}

const resetSettings = { calculated: null, transactionResult: null } as const

export const createLuminaDexMachine = () => {
	return setup({
		types: {
			context: {} as LuminaDexMachineContext,
			events: {} as LuminaDexMachineEvent,
			input: {} as LuminaDexMachineInput
		},
		guards: {
			calculatedSwap: ({ context }) => context.dex.swap.calculated !== null,
			calculatedAddLiquidity: ({ context }) => context.dex.addLiquidity.calculated !== null,
			calculatedRemoveLiquidity: ({ context }) => context.dex.removeLiquidity.calculated !== null,
			isTestnet: ({ context }) => !context.wallet.network.includes("mainnet"),
			contractsReady: stateIn({ contractSystem: "CONTRACTS_READY" })
		},
		actors: {
			detectWalletChange,
			initializeWorker: fromPromise(async () => {
				const worker = new SharedWorker(new URL("../../dex/luminadex-worker.ts", import.meta.url), {
					type: "module"
				})
				return Comlink.wrap<LuminaDexWorker>(worker.port)
			}),
			loadAndCompileContracts: fromPromise(
				async ({ input: { worker } }: { input: InputDexWorker }) => {
					await worker.loadContract()
					await worker.compileContract()
				}
			),
			initializeZkApp: fromPromise(
				async ({ input: { worker, ...config } }: { input: InputDexWorker & InitZkappInstance }) => {
					await worker.initZkappInstance(config)
				}
			),
			claim: fromPromise(
				async ({ input }: { input: InputDexWorker & User & { faucet: FaucetSettings } }) => {
					const { worker, user, faucet } = input
					console.time("claim")
					const txJson = await worker.claim({ user, faucet })
					console.timeEnd("claim")
					return await sendTransaction(txJson)
				}
			),
			swap: fromPromise(async ({ input }: { input: InputDexWorker & SwapArgs }) => {
				const { worker, ...swapSettings } = input
				console.time("swap")
				const txJson = await worker.swap(swapSettings)
				console.timeEnd("swap")
				return await sendTransaction(txJson)
			}),
			addLiquidity: fromPromise(async ({ input }: { input: AddLiquidity & InputDexWorker }) => {
				const { worker, ...config } = input
				console.time("addLiquidity")
				const txJson = await worker.addLiquidity(config)
				console.timeEnd("addLiquidity")
				return await sendTransaction(txJson)
			}),
			removeLiquidity: fromPromise(
				async ({ input }: { input: WithdrawLiquidity & InputDexWorker }) => {
					const { worker, ...config } = input
					console.time("removeLiquidity")
					const txJson = await worker.withdrawLiquidity(config)
					console.timeEnd("removeLiquidity")
					return await sendTransaction(txJson)
				}
			),
			mintToken: fromPromise(async ({ input }: { input: InputDexWorker & MintToken }) => {
				const { worker, ...config } = input
				console.time("mint")
				const txJson = await worker.mintToken(config)
				console.timeEnd("mint")
				return await sendTransaction(txJson)
			}),
			deployPool: fromPromise(
				async ({ input }: { input: InputDexWorker & User & PoolSettings }) => {
					const { worker, user, tokenA, tokenB } = input
					console.time("deployPool")
					const txJson = await worker.deployPoolInstance({ user, tokenA, tokenB })
					console.timeEnd("deployPool")
					return await sendTransaction(txJson)
				}
			),
			deployToken: fromPromise(
				async ({ input }: { input: InputDexWorker & { symbol: string } & User }) => {
					const { worker, symbol, user } = input
					console.time("deployToken")
					// TokenKey
					const tk = PrivateKey.random()
					const tokenKey = tk.toBase58()
					const tokenKeyPublic = tk.toPublicKey().toBase58()
					// TokenAdminKey
					const tak = PrivateKey.random()
					const tokenAdminKey = tak.toBase58()
					const tokenAdminKeyPublic = tak.toPublicKey().toBase58()

					const txJson = await worker.deployToken({ user, tokenKey, tokenAdminKey, symbol })
					console.timeEnd("deployToken")
					const transactionOutput = await sendTransaction(txJson)
					return {
						transactionOutput,
						token: { symbol, tokenKey, tokenAdminKey, tokenKeyPublic, tokenAdminKeyPublic }
					}
				}
			),
			calculateSwapAmount: fromPromise(
				async ({ input }: { input: InputDexWorker & SwapSettings }) => {
					const { worker, pool, slippagePercent, from } = input
					const reserves = await worker.getReserves(pool)
					const settings = { from, slippagePercent }
					if (reserves.token0.amount && reserves.token1.amount) {
						const amountIn = Number.parseFloat(from.amount) * 1e9
						const ok = reserves.token0.address === from.address
						const balanceIn = Number.parseInt(ok ? reserves.token0.amount : reserves.token1.amount)
						const balanceOut = Number.parseInt(ok ? reserves.token1.amount : reserves.token0.amount)
						const swapAmount = getAmountOut({
							amountIn,
							balanceIn,
							balanceOut,
							slippagePercent
						})
						return { swapAmount, settings }
					}
					const swapAmount = {
						amountIn: 0,
						amountOut: 0,
						balanceOutMin: 0,
						balanceInMax: 0
					}
					return { swapAmount, settings }
				}
			),
			calculateAddLiquidityAmount: fromPromise(
				async ({ input }: { input: InputDexWorker & AddLiquiditySettings }) => {
					const { worker, pool, tokenA, tokenB, slippagePercent } = input
					const reserves = await worker.getReserves(pool)

					const ok = reserves.token0.address === tokenA.address

					if (reserves.token0.amount && reserves.token1.amount && reserves.liquidity) {
						const balanceA = Number.parseInt(ok ? reserves.token0.amount : reserves.token1.amount)
						const balanceB = Number.parseInt(ok ? reserves.token1.amount : reserves.token0.amount)

						const liquidity = Number.parseInt(reserves.liquidity)

						if (liquidity > 0) {
							const amountAIn = Number.parseFloat(ok ? tokenA.amount : tokenB.amount) * 1e9
							console.log("amountAIn", amountAIn)
							const liquidityAmount = getAmountLiquidityOut({
								amountAIn,
								balanceA,
								balanceB,
								supply: liquidity,
								slippagePercent
							})
							console.log("Calculated liquidityAmount", liquidityAmount)
							return liquidityAmount
						}
						const amountAIn = Number.parseFloat(ok ? tokenA.amount : tokenB.amount) * 1e9
						const amountBIn = Number.parseFloat(ok ? tokenB.amount : tokenA.amount) * 1e9
						const liquidityAmount = getFirstAmountLiquidityOut({ amountAIn, amountBIn })
						console.log("Calculated liquidityAmount", { liquidityAmount })
						return liquidityAmount
					}
					const liquidityAmount = {
						amountAIn: 0,
						amountBIn: 0,
						balanceAMax: 0,
						balanceBMax: 0,
						supplyMin: 0,
						liquidity: 0
					}
					return liquidityAmount
				}
			),
			calculateRemoveLiquidityAmount: fromPromise(
				async ({ input }: { input: InputDexWorker & RemoveLiquiditySettings }) => {
					const { worker, pool, tokenA, tokenB, slippagePercent } = input
					const reserves = await worker.getReserves(pool)

					const ok = reserves.token0.address === tokenA.address

					if (reserves.token0.amount && reserves.token1.amount && reserves.liquidity) {
						const balanceA = Number.parseInt(ok ? reserves.token0.amount : reserves.token1.amount)
						const balanceB = Number.parseInt(ok ? reserves.token1.amount : reserves.token0.amount)

						const supply = Number.parseInt(reserves.liquidity)
						const liquidity = Number.parseFloat(ok ? tokenA.amount : tokenB.amount) * 1e9

						console.log("liquidity (fromAmount)", liquidity)
						const liquidityAmount = getAmountOutFromLiquidity({
							liquidity,
							balanceA,
							balanceB,
							supply,
							slippagePercent
						})
						console.log("Calculated liquidityAmount", liquidityAmount)
						return liquidityAmount
					}
					const liquidityAmount = {
						amountAOut: 0,
						amountBOut: 0,
						balanceAMin: 0,
						balanceBMin: 0,
						supplyMax: 0,
						liquidity: 0
					}
					return liquidityAmount
				}
			)
		}
	}).createMachine({
		id: "luminaDex",
		context: ({
			input: { wallet, frontendFee: { destination, amount } }
		}) => {
			if (!isBetween(0, 15)(amount)) throw new Error("The Frontend Fee must be between 0 and 15.")
			return {
				wallet: {
					actor: wallet,
					account: wallet.getSnapshot().context.account,
					network: wallet.getSnapshot().context.currentNetwork
				},
				frontendFee: { destination, amount },
				contract: { worker: null, error: null },
				dex: {
					error: null,
					swap: {
						pool: "",
						from: { address: "", amount: "" },
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
						tokenA: { address: "", amount: "" },
						tokenB: { address: "", amount: "" },
						slippagePercent: 0,
						...resetSettings
					},
					claim: { transactionResult: null },
					mint: { to: "", token: "", amount: 0, transactionResult: null },
					deployPool: { tokenA: "", tokenB: "", transactionResult: null },
					deployToken: {
						symbol: "",
						transactionResult: null,
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
		invoke: {
			src: "detectWalletChange",
			input: ({ context }) => ({ wallet: context.wallet.actor })
		},
		on: {
			// TODO: What should happen when the network changes?
			// Recalculate Settings if not null ? Re-initialize Contracts?
			NetworkChanged: {
				actions: enqueueActions(({ context, event, enqueue }) => {
					enqueue.assign({ wallet: { ...context.wallet, network: event.network } })
				})
			},

			AccountChanged: {
				actions: assign(({ context, event }) => ({
					wallet: { ...context.wallet, account: event.account }
				}))
			}
		},
		type: "parallel",
		states: {
			contractSystem: {
				initial: "INITIALIZING_WORKER",
				states: {
					INITIALIZING_WORKER: {
						invoke: {
							src: "initializeWorker",
							onDone: {
								target: "LOADING_CONTRACTS",
								actions: assign(({ context, event }) => ({
									contract: { ...context.contract, worker: event.output }
								}))
							},
							onError: {
								target: "FAILED",
								actions: assign(setContractError("Initializing Worker"))
							}
						}
					},
					LOADING_CONTRACTS: {
						invoke: {
							src: "loadAndCompileContracts",
							input: ({ context }) => inputWorker(context),
							onDone: "INITIALIZING_ZKAPP",
							onError: {
								target: "FAILED",
								actions: assign(setContractError("Loading Contracts"))
							}
						}
					},
					INITIALIZING_ZKAPP: {
						invoke: {
							src: "initializeZkApp",
							input: ({ context }) => {
								const network = context.wallet.network
								if (network !== "mina:testnet") throw new Error("Network not supported.")
								const addresses = {
									pool: "", // TODO: What is the pool ?
									factory: luminadexFactories[network],
									faucet: chainFaucets[network]
								}
								return { ...inputWorker(context), ...addresses }
							},
							onDone: "CONTRACTS_READY",
							onError: {
								target: "FAILED",
								actions: assign(setContractError("Initializing zkapp"))
							}
						}
					},
					CONTRACTS_READY: {
						description: "The dex is ready."
					},
					FAILED: {
						on: {
							InitializeWorker: "INITIALIZING_WORKER"
						},
						exit: assign(({ context }) => ({
							contract: { ...context.contract, error: null }
						}))
					}
				}
			},
			dexSystem: {
				initial: "DEX",
				states: {
					DEX: {
						initial: "READY",
						states: { READY: {}, ERROR: {} },
						on: {
							DeployPool: {
								target: "DEPLOYING_POOL",
								description: "Deploy a pool for a given token.",
								guard: "contractsReady",
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										deployPool: {
											...context.dex.deployPool,
											...event.settings,
											transactionResult: null
										}
									}
								}))
							},
							DeployToken: {
								target: "DEPLOYING_TOKEN",
								description: "Deploy a token.",
								guard: "contractsReady",
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										deployToken: {
											symbol: event.settings.symbol,
											transactionResult: null,
											result: null
										}
									}
								}))
							},
							ClaimTokensFromFaucet: {
								target: "CLAIMING_FROM_FAUCET",
								description: "Claim tokens from the faucet. Testnet Only.",
								guard: and(["contractsReady", "isTestnet"]),
								actions: assign(({ context }) => ({
									dex: { ...context.dex, claim: { transactionResult: null } }
								}))
							},
							MintToken: {
								target: "MINTING",
								description: "Mint a token to a given destination address.",
								guard: "contractsReady",
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										mint: { ...context.dex.mint, ...event.settings, transactionResult: null }
									}
								}))
							},
							ChangeRemoveLiquiditySettings: {
								target: "CALCULATING_REMOVE_LIQUIDITY_AMOUNT",
								description: "Change the settings for adding liquidity.",
								guard: "contractsReady",
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
								guard: and(["calculatedRemoveLiquidity", "contractsReady"])
							},
							ChangeAddLiquiditySettings: {
								target: "CALCULATING_ADD_LIQUIDITY_AMOUNT",
								description: "Change the settings for adding liquidity.",
								guard: "contractsReady",
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
								guard: and(["calculatedAddLiquidity", "contractsReady"])
							},
							ChangeSwapSettings: {
								target: "CALCULATING_SWAP_AMOUNT",
								description: "Change the settings for a token swap.",
								guard: "contractsReady",
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										swap: { ...event.settings, ...resetSettings }
									}
								}))
							},
							Swap: {
								target: "SWAPPING",
								guard: and(["calculatedSwap", "contractsReady"]),
								description:
									"Create and send a transaction to swap tokens. To be called after ChangeSwapSettings."
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
									user: context.wallet.account
								}
							},
							onDone: {
								target: "DEX.READY",
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										deployToken: {
											...context.dex.deployToken,
											...event.output.token,
											transactionResult: event.output.transactionOutput
										}
									}
								}))
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
								return {
									...inputWorker(context),
									tokenA: context.dex.deployPool.tokenA,
									tokenB: context.dex.deployPool.tokenB,
									user: context.wallet.account
								}
							},
							onDone: {
								target: "DEX.READY",
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										deployPool: { ...context.dex.deployPool, transactionResult: event.output }
									}
								}))
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
								const faucet = chainFaucets[context.wallet.network]
								return { ...inputWorker(context), user: context.wallet.account, faucet }
							},
							onDone: {
								target: "DEX.READY",
								actions: assign(({ context, event }) => ({
									dex: { ...context.dex, claim: { transactionResult: event.output } }
								}))
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
									user: context.wallet.account,
									to: mint.to,
									token: mint.token,
									amount: mint.amount
								}
							},
							onDone: {
								target: "DEX.READY",
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										mint: { ...context.dex.mint, transactionResult: event.output }
									}
								}))
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
									user: context.wallet.account,
									pool: swap.pool,
									from: swap.from.address,
									amount: swap.calculated.amountIn,
									minOut: swap.calculated.amountOut,
									balanceOutMin: swap.calculated.balanceOutMin,
									balanceInMax: swap.calculated.balanceInMax
								}
							},
							onDone: {
								target: "DEX.READY",
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										swap: { ...context.dex.swap, calculated: null, transactionResult: event.output }
									}
								}))
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
									user: context.wallet.account,
									pool: liquidity.pool,
									supplyMin: liquidity.calculated.supplyMin,
									tokenA: {
										address: liquidity.tokenA.address,
										amount: liquidity.calculated.amountAIn,
										reserve: liquidity.calculated.balanceAMax
									},
									tokenB: {
										address: liquidity.tokenB.address,
										amount: liquidity.calculated.amountBIn,
										reserve: liquidity.calculated.balanceBMax
									}
								}
							},
							onDone: {
								target: "DEX.READY",
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										addLiquidity: {
											...context.dex.addLiquidity,
											calculated: null,
											transactionResult: event.output
										}
									}
								}))
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
									user: context.wallet.account,
									pool: liquidity.pool,
									supplyMax: liquidity.calculated.supplyMax,
									liquidityAmount: liquidity.calculated.liquidity,
									tokenA: {
										address: liquidity.tokenA.address,
										amount: liquidity.calculated.amountAOut,
										reserve: liquidity.calculated.balanceAMin
									},
									tokenB: {
										address: liquidity.tokenB.address,
										amount: liquidity.calculated.amountBOut,
										reserve: liquidity.calculated.balanceBMin
									}
								}
							},
							onDone: {
								target: "DEX.READY",
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										removeLiquidity: {
											...context.dex.removeLiquidity,
											calculated: null,
											transactionResult: event.output
										}
									}
								}))
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
									slippagePercent: swap.slippagePercent
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
										removeLiquidity: {
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
								actions: assign(setDexError("Calculating Remove Liquidity Amount"))
							}
						}
					}
				}
			}
		}
	})
}
