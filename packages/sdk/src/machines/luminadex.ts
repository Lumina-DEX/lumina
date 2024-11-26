import * as Comlink from "comlink"
import { PrivateKey } from "o1js"
import {
	type ErrorActorEvent,
	assertEvent,
	assign,
	enqueueActions,
	fromPromise,
	setup
} from "xstate"
import {
	getAmountLiquidityOut,
	getAmountOut,
	getAmountOutFromLiquidity,
	getFirstAmountLiquidityOut
} from "../dex/helper"
import type {
	AddLiquidity,
	InitZkappInstance,
	LuminaDexWorker,
	MintToken,
	SwapFrom,
	WithdrawLiquidity
} from "../dex/luminadex-worker"
import { sendTransaction } from "../helpers/transfer"

type DexWorker = Comlink.Remote<LuminaDexWorker>
type InputDexWorker = { worker: DexWorker }

type SwapSettings = {
	toDai?: boolean
	fromAmount?: string
	toAmount?: string
	pool?: string
	slippagePercent?: number
}

type AddLiquiditySettings = {
	toDai?: boolean
	fromAmount?: string
	toAmount?: string
	pool?: string
	slippagePercent?: number
}

type RemoveLiquiditySettings = {
	pool?: string
	fromAmount?: string
	slippagePercent?: number
}

type ContractContext = {
	worker: DexWorker | null
	error: Error | null
}

type DexContext = {
	removeLiquidity: {
		fromAmount: string
		slippagePercent: number
		pool: string
		liquidity: number
		toMina: number
		toToken: number
		amountAOut: number
		amountBOut: number
		balanceAMin: number
		balanceBMin: number
		supplyMax: number
	}
	addLiquidity: {
		toDai: boolean
		fromAmount: string
		toAmount: string
		slippagePercent: number
		pool: string
		liquidityMinted: number
		liquidity: number
		amountAIn: number
		amountBIn: number
		balanceAMax: number
		balanceBMax: number
		supplyMin: number
	}
	swap: {
		amountIn: number
		amountOut: number
		balanceOutMin: number
		balanceInMax: number
	} & Required<SwapSettings>
	mint: Omit<MintToken, "user">
	deployPool: { tokenAddress: string }
	deployToken: { symbol: string }
}

type ContractEvent = { type: "InitializeWorker" }

type DexEvent =
	//Swap
	| { type: "ChangeSwapSettings"; settings: SwapSettings }
	| { type: "CalculateSwapAmount" }
	| { type: "Swap"; user: string }
	//Remove Liquidity
	| { type: "ChangeRemoveLiquiditySettings"; settings: RemoveLiquiditySettings }
	| { type: "CalculateRemoveLiquidityAmount" }
	| { type: "RemoveLiquidity"; user: string }
	//Add Liquidity
	| { type: "ChangeAddLiquiditySettings"; settings: AddLiquiditySettings }
	| { type: "CalculateAddLiquidityAmount" }
	| { type: "AddLiquidity"; user: string }
	//Deploy
	//TODO: On zeko we can deploy token/token pool
	| { type: "DeployPool"; user: string; settings: { tokenAddress: string } }
	| { type: "DeployToken"; user: string; symbol: string }
	//Mint
	| { type: "MintToken"; user: string; settings: Omit<MintToken, "user"> }
	//Claim
	| { type: "ClaimTokensFromFaucet"; user: string }

type LuminaDexMachineContext = {
	contract: ContractContext
	dex: DexContext
	addresses: InitZkappInstance
}

const inputWorker = (context: LuminaDexMachineContext) => {
	if (!context.contract.worker) throw new Error("Worker not initialized")
	return { worker: context.contract.worker }
}

const setContractError = (defaultMessage: string) => {
	return {
		target: "failed",
		// biome-ignore lint/suspicious/noExplicitAny: helper
		actions: assign<LuminaDexMachineContext, ErrorActorEvent, any, any, any>(
			({ context, event }) => {
				if (event.error instanceof Error) {
					return { contract: { ...context.contract, error: event.error } }
				}
				return { contract: { ...context.contract, error: new Error(defaultMessage) } }
			}
		)
	} as const
}

export const createLuminaDexMachine = () => {
	return setup({
		types: {
			context: {} as LuminaDexMachineContext,
			events: {} as ContractEvent | DexEvent,
			input: {} as { addresses: InitZkappInstance }
		},
		actors: {
			initializeWorker: fromPromise(async () => {
				const worker = new Worker(new URL("../dex/luminadex-worker.ts", import.meta.url), {
					type: "module"
				})
				return Comlink.wrap<LuminaDexWorker>(worker)
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
			claim: fromPromise(async ({ input }: { input: InputDexWorker & { user: string } }) => {
				const { worker, user } = input
				console.time("claim")
				const txJson = await worker.claim({ user })
				console.timeEnd("claim")
				await sendTransaction(txJson)
			}),
			swap: fromPromise(
				async ({ input }: { input: InputDexWorker & { toDai: boolean } & SwapFrom }) => {
					const { worker, toDai, ...swapSettings } = input
					console.time("swap")
					const txJson = toDai
						? await worker.swapFromMina(swapSettings)
						: await worker.swapFromToken(swapSettings)
					console.timeEnd("swap")
					await sendTransaction(txJson)
				}
			),
			addLiquidity: fromPromise(async ({ input }: { input: AddLiquidity & InputDexWorker }) => {
				const { worker, ...config } = input
				console.time("addLiquidity")
				const txJson = await worker.addLiquidity(config)
				console.timeEnd("addLiquidity")
				await sendTransaction(txJson)
			}),
			removeLiquidity: fromPromise(
				async ({ input }: { input: WithdrawLiquidity & InputDexWorker }) => {
					const { worker, ...config } = input
					console.time("removeLiquidity")
					const txJson = await worker.withdrawLiquidity(config)
					console.timeEnd("removeLiquidity")
					await sendTransaction(txJson)
				}
			),
			calculateSwapAmount: fromPromise(
				async ({
					input
				}: {
					input: InputDexWorker & { pool: string } & Required<SwapSettings>
				}) => {
					const { worker, pool, slippagePercent, fromAmount, toDai } = input
					const reserves = await worker.getReserves(pool)
					const settings = { toDai, fromAmount, slippagePercent }
					if (reserves.amountMina && reserves.amountToken) {
						const amountIn = Number.parseFloat(fromAmount) * 1e9
						const amountMina = Number.parseInt(reserves.amountMina)
						const amountToken = Number.parseInt(reserves.amountToken)
						const swapAmount = getAmountOut({
							amountIn,
							balanceIn: toDai ? amountMina : amountToken,
							balanceOut: toDai ? amountToken : amountMina,
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
			mintToken: fromPromise(async ({ input }: { input: InputDexWorker & MintToken }) => {
				const { worker, ...config } = input
				console.time("mint")
				const txJson = await worker.mintToken(config)
				console.timeEnd("mint")
				await sendTransaction(txJson)
			}),
			deployPool: fromPromise(
				async ({ input }: { input: InputDexWorker & { tokenAddress: string; user: string } }) => {
					const { worker, tokenAddress, user } = input
					console.time("deployPool")
					const txJson = await worker.deployPoolInstance({ tokenAddress, user })
					console.timeEnd("deployPool")
					await sendTransaction(txJson)
				}
			),
			deployToken: fromPromise(
				async ({ input }: { input: InputDexWorker & { symbol: string; user: string } }) => {
					const { worker, symbol, user } = input
					console.time("deployToken")
					//TokenKey
					const tk = PrivateKey.random()
					const tokenKey = tk.toBase58()
					const tokenKeyPublic = tk.toPublicKey().toBase58()
					//TokenAdminKey
					const tak = PrivateKey.random()
					const tokenAdminKey = tak.toBase58()
					const tokenAdminKeyPublic = tak.toPublicKey().toBase58()

					const txJson = await worker.deployToken({ user, tokenKey, tokenAdminKey, symbol })
					console.timeEnd("deployToken")
					await sendTransaction(txJson)
					return { symbol, tokenKey, tokenAdminKey, tokenKeyPublic, tokenAdminKeyPublic }
				}
			),
			calculateAddLiquidityAmount: fromPromise(
				async ({
					input
				}: {
					input: InputDexWorker & {
						toDai: boolean
						pool: string
						fromAmount: string
						toAmount: string
						slippagePercent: number
					}
				}) => {
					const { worker, pool, fromAmount, toDai, toAmount, slippagePercent } = input
					const reserves = await worker.getReserves(pool)

					if (reserves.amountMina && reserves.amountToken && reserves.liquidity) {
						const amountMina = Number.parseInt(reserves.amountMina)
						const amountToken = Number.parseInt(reserves.amountToken)
						const liquidity = Number.parseInt(reserves.liquidity)

						if (liquidity > 0) {
							const amountAIn = Number.parseFloat(fromAmount) * 1e9
							console.log("amountAIn", amountAIn)
							const liquidityAmount = getAmountLiquidityOut({
								amountAIn,
								balanceA: toDai ? amountMina : amountToken,
								balanceB: toDai ? amountToken : amountMina,
								supply: liquidity,
								slippagePercent
							})
							console.log("Calculated liquidityAmount", { toDai, liquidityAmount })
							const toAmount = (liquidityAmount.amountBIn / 1e9).toString()
							const liquidityMinted = liquidityAmount.liquidity / 1e9
							return { liquidityAmount, settings: { toDai, toAmount, liquidityMinted } }
						}
						const amountA = Number.parseFloat(fromAmount) * 1e9
						const amountB = Number.parseFloat(toAmount) * 1e9
						const liquidityAmount = getFirstAmountLiquidityOut({
							amountAIn: toDai ? amountA : amountB,
							amountBIn: toDai ? amountB : amountA
						})
						console.log("Calculated liquidityAmount", { toDai, liquidityAmount })
						const liquidityMinted = liquidityAmount.liquidity / 1e9
						return { liquidityAmount, settings: { toDai, toAmount, liquidityMinted } }
					}
					const liquidityAmount = {
						amountAIn: 0,
						amountBIn: 0,
						balanceAMax: 0,
						balanceBMax: 0,
						supplyMin: 0,
						liquidity: 0
					}
					const settings = { toDai, toAmount, liquidityMinted: 0 }
					return { liquidityAmount, settings }
				}
			),
			calculateRemoveLiquidityAmount: fromPromise(
				async ({
					input
				}: {
					input: InputDexWorker & {
						pool: string
						fromAmount: string
						slippagePercent: number
					}
				}) => {
					const { worker, pool, fromAmount, slippagePercent } = input
					const reserves = await worker.getReserves(pool)

					if (reserves.amountMina && reserves.amountToken && reserves.liquidity) {
						const amountMina = Number.parseInt(reserves.amountMina)
						const amountToken = Number.parseInt(reserves.amountToken)
						const supply = Number.parseInt(reserves.liquidity)

						const liquidity = Number.parseFloat(fromAmount) * 1e9
						console.log("liquidity (fromAmount)", liquidity)
						const liquidityAmount = getAmountOutFromLiquidity({
							liquidity,
							balanceA: amountMina,
							balanceB: amountToken,
							supply,
							slippagePercent
						})
						console.log("Calculated liquidityAmount", { liquidityAmount })
						const toMina = liquidityAmount.amountAOut / 1e9
						const toToken = liquidityAmount.amountBOut / 1e9
						return { liquidityAmount, settings: { toMina, toToken } }
					}
					const liquidityAmount = {
						amountAOut: 0,
						amountBOut: 0,
						balanceAMin: 0,
						balanceBMin: 0,
						supplyMax: 0,
						liquidity: 0
					}
					const settings = { toMina: 0, toToken: 0 }
					return { liquidityAmount, settings }
				}
			)
		}
	}).createMachine({
		id: "luminaDex",
		context: ({
			//TODO: Automatically track the current user from the wallet machine.
			input: {
				addresses: { pool, faucet, factory }
			}
		}) => ({
			addresses: {
				pool,
				faucet,
				factory
			},
			contract: {
				worker: null,
				error: null
			},
			dex: {
				swap: {
					pool: "",
					toDai: false,
					fromAmount: "",
					toAmount: "",
					slippagePercent: 0,
					amountIn: 0,
					amountOut: 0,
					balanceOutMin: 0,
					balanceInMax: 0
				},
				removeLiquidity: {
					pool: "",
					toDai: false,
					fromAmount: "",
					slippagePercent: 0,
					liquidity: 0,
					toMina: 0,
					toToken: 0,
					amountAOut: 0,
					amountBOut: 0,
					balanceAMin: 0,
					balanceBMin: 0,
					supplyMax: 0
				},
				addLiquidity: {
					pool: "",
					liquidityMinted: 0,
					toDai: false,
					fromAmount: "",
					toAmount: "",
					slippagePercent: 0,
					amountAIn: 0,
					amountBIn: 0,
					balanceAMax: 0,
					balanceBMax: 0,
					supplyMin: 0,
					liquidity: 0
				},
				mint: {
					to: "",
					token: "",
					amount: 0
				},
				deployPool: {
					tokenAddress: ""
				},
				deployToken: {
					symbol: "",
					tokenKey: "",
					tokenAdminKey: "",
					tokenKeyPublic: "",
					tokenAdminKeyPublic: ""
				}
			}
		}),
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
							onError: setContractError("Error initializing worker")
						}
					},
					LOADING_CONTRACTS: {
						invoke: {
							src: "loadAndCompileContracts",
							input: ({ context }) => inputWorker(context),
							onDone: "INITIALIZING_ZKAPP",
							onError: setContractError("Error loading contracts")
						}
					},
					INITIALIZING_ZKAPP: {
						invoke: {
							src: "initializeZkApp",
							input: ({ context }) => {
								return { ...inputWorker(context), ...context.addresses }
							},
							onDone: "READY",
							onError: setContractError("Error initializing zkapp")
						}
					},
					READY: {
						description: "The dex is ready."
					},
					//TODO: Add a global way to enter the failed state.
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
				initial: "READY",
				states: {
					//TODO: Handle Errors
					READY: {
						on: {
							CalculateRemoveLiquidityAmount: {
								target: "CALCULATING_REMOVE_LIQUIDITY_AMOUNT",
								actions: assign(({ context }) => ({
									dex: {
										...context.dex,
										removeLiquidity: {
											...context.dex.removeLiquidity,
											amountAOut: 0,
											amountBOut: 0,
											balanceAMin: 0,
											balanceBMin: 0,
											supplyMax: 0,
											liquidity: 0,
											liquidityMinted: 0
										}
									}
								}))
							},
							ChangeRemoveLiquiditySettings: {
								description: "Change the settings for adding liquidity.",
								actions: enqueueActions(({ context, event, enqueue }) => {
									enqueue.assign({
										dex: {
											...context.dex,
											removeLiquidity: { ...context.dex.removeLiquidity, ...event.settings }
										}
									})
									//Only recalculate if the settings are relevant
									if (event.settings.fromAmount || event.settings.slippagePercent) {
										enqueue.raise({ type: "CalculateRemoveLiquidityAmount" })
									}
								})
							},
							//TODO: Guard against incomplete settings
							RemoveLiquidity: {
								description: "Remove liquidity from a pool.",
								target: "REMOVING_LIQUIDITY"
							},
							CalculateAddLiquidityAmount: {
								target: "CALCULATING_ADD_LIQUIDITY_AMOUNT",
								actions: assign(({ context }) => ({
									dex: {
										...context.dex,
										addLiquidity: {
											...context.dex.addLiquidity,
											amountAIn: 0,
											amountBIn: 0,
											balanceAMax: 0,
											balanceBMax: 0,
											supplyMin: 0,
											liquidity: 0,
											liquidityMinted: 0
										}
									}
								}))
							},
							ChangeAddLiquiditySettings: {
								description: "Change the settings for adding liquidity.",
								actions: enqueueActions(({ context, event, enqueue }) => {
									enqueue.assign({
										dex: {
											...context.dex,
											addLiquidity: { ...context.dex.addLiquidity, ...event.settings }
										}
									})
									//Only recalculate if the settings are relevant
									if (
										event.settings.pool ||
										event.settings.toDai ||
										event.settings.fromAmount ||
										event.settings.toAmount ||
										event.settings.slippagePercent
									) {
										enqueue.raise({ type: "CalculateAddLiquidityAmount" })
									}
								})
							},
							//TODO: Guard against incomplete settings
							AddLiquidity: {
								description: "Add liquidity to a pool.",
								target: "ADDING_LIQUIDITY"
							},
							DeployPool: {
								description: "Deploy a pool for a given token.",
								target: "DEPLOYING_POOL",
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										deployPool: { ...context.dex.deployPool, ...event.settings }
									}
								}))
							},
							DeployToken: {
								description: "Deploy a token.",
								target: "DEPLOYING_TOKEN",
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										deployToken: {
											tokenKey: "",
											tokenAdminKey: "",
											tokenKeyPublic: "",
											tokenAdminKeyPublic: "",
											symbol: event.symbol
										}
									}
								}))
							},
							ClaimTokensFromFaucet: {
								description: "Claim tokens from the faucet.",
								target: "CLAIMING_FROM_FAUCET"
							},
							MintToken: {
								description: "Mint a token to a given destination address.",
								target: "MINTING",
								actions: assign(({ context, event }) => ({
									dex: { ...context.dex, mint: { ...context.dex.mint, ...event.settings } }
								}))
							},
							ChangeSwapSettings: {
								description: "Change the settings for a token swap.",
								actions: enqueueActions(({ context, event, enqueue }) => {
									enqueue.assign({
										dex: {
											...context.dex,
											swap: { ...context.dex.swap, ...event.settings }
										}
									})
									//Only recalculate if the settings are relevant
									//TODO: Handle network change
									if (
										event.settings.toDai ||
										event.settings.pool ||
										event.settings.fromAmount ||
										event.settings.slippagePercent
									) {
										enqueue.raise({ type: "CalculateSwapAmount" })
									}
								})
							},
							CalculateSwapAmount: {
								target: "CALCULATING_SWAP_AMOUNT",
								description: "Manually recalculate the swap amount.",
								actions: assign(({ context }) => ({
									dex: {
										...context.dex,
										swap: {
											...context.dex.swap,
											amountIn: 0,
											amountOut: 0,
											balanceOutMin: 0,
											balanceInMax: 0
										}
									}
								}))
							},
							//TODO: Guard against incomplete settings
							Swap: {
								target: "SWAPPING",
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
									user: event.user
								}
							},
							onDone: {
								target: "READY",
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										deployToken: {
											...context.dex.deployToken,
											...event.output
										}
									}
								}))
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
									tokenAddress: context.dex.deployPool.tokenAddress,
									user: event.user
								}
							},
							onDone: "READY"
						}
					},
					CLAIMING_FROM_FAUCET: {
						invoke: {
							src: "claim",
							input: ({ context, event }) => {
								assertEvent(event, "ClaimTokensFromFaucet")
								return { ...inputWorker(context), user: event.user }
							},
							onDone: "READY"
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
									user: event.user,
									to: mint.to,
									token: mint.token,
									amount: mint.amount
								}
							},
							onDone: "READY"
						}
					},
					SWAPPING: {
						invoke: {
							src: "swap",
							input: ({ context, event }) => {
								assertEvent(event, "Swap")
								const swap = context.dex.swap
								return {
									...inputWorker(context),
									user: event.user,
									pool: context.addresses.pool,
									toDai: swap.toDai,
									amount: swap.amountIn,
									minOut: swap.amountOut,
									balanceOutMin: swap.balanceOutMin,
									balanceInMax: swap.balanceInMax
								}
							},
							onDone: "READY"
						}
					},
					ADDING_LIQUIDITY: {
						invoke: {
							src: "addLiquidity",
							input: ({ context, event }) => {
								assertEvent(event, "AddLiquidity")
								const liquidity = context.dex.addLiquidity
								return {
									...inputWorker(context),
									user: event.user,
									pool: liquidity.pool,
									amountMina: liquidity.toDai ? liquidity.amountAIn : liquidity.amountBIn,
									amountToken: liquidity.toDai ? liquidity.amountBIn : liquidity.amountAIn,
									reserveMinaMax: liquidity.toDai ? liquidity.balanceAMax : liquidity.balanceBMax,
									reserveTokenMax: liquidity.toDai ? liquidity.balanceBMax : liquidity.balanceAMax,
									supplyMin: liquidity.supplyMin
								}
							},
							onDone: "READY"
						}
					},
					REMOVING_LIQUIDITY: {
						invoke: {
							src: "removeLiquidity",
							input: ({ context, event }) => {
								assertEvent(event, "RemoveLiquidity")
								const liquidity = context.dex.removeLiquidity
								return {
									...inputWorker(context),
									user: event.user,
									pool: liquidity.pool,
									liquidityAmount: liquidity.liquidity,
									amountMinaMin: liquidity.amountAOut,
									amountTokenMin: liquidity.amountBOut,
									reserveMinaMin: liquidity.balanceAMin,
									reserveTokenMin: liquidity.balanceBMin,
									supplyMax: liquidity.supplyMax
								}
							},
							onDone: "READY"
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
									toDai: swap.toDai,
									fromAmount: swap.fromAmount,
									toAmount: swap.toAmount,
									slippagePercent: swap.slippagePercent
								}
							},
							onDone: {
								target: "READY",
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										swap: {
											...context.dex.swap,
											...event.output.swapAmount
										}
									}
								}))
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
									toDai: liquidity.toDai,
									fromAmount: liquidity.fromAmount,
									toAmount: liquidity.toAmount,
									slippagePercent: liquidity.slippagePercent
								}
							},
							onDone: {
								target: "READY",
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										addLiquidity: {
											...context.dex.addLiquidity,
											...event.output.liquidityAmount,
											...event.output.settings
										}
									}
								}))
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
									fromAmount: liquidity.fromAmount,
									slippagePercent: liquidity.slippagePercent
								}
							},
							onDone: {
								target: "READY",
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										removeLiquidity: {
											...context.dex.addLiquidity,
											...event.output.liquidityAmount,
											...event.output.settings
										}
									}
								}))
							}
						}
					}
				}
			}
		}
	})
}
