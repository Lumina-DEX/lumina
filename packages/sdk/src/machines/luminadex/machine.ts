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
	spawnChild
} from "xstate"
import {
	chainFaucets,
	luminaCdnOrigin,
	luminadexFactories,
	poolInstance
} from "../../constants/index"
import type {
	AddLiquidity,
	DeployPoolArgs,
	FaucetSettings,
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
import { createMeasure, getDebugConfig, prefixedLogger } from "../../helpers/debug"
import { sendTransaction } from "../../helpers/transfer"
import { isBetween } from "../../helpers/validation"
import { detectWalletChange } from "../wallet/actors"
import type {
	AddLiquiditySettings,
	Can,
	ContractName,
	DexFeatures,
	DexWorker,
	InputDexWorker,
	LuminaDexMachineContext,
	LuminaDexMachineEvent,
	LuminaDexMachineInput,
	RemoveLiquiditySettings,
	SwapSettings,
	Token,
	User
} from "./types"

const logger = prefixedLogger("[DEX]")
const measure = createMeasure(logger)

const amount = (token: Token) => Number.parseFloat(token.amount) * (token.decimal ?? 1e9)

const walletNetwork = (c: LuminaDexMachineContext) => c.wallet.getSnapshot().context.currentNetwork

const walletUser = (c: LuminaDexMachineContext) => c.wallet.getSnapshot().context.account

const inputWorker = (c: LuminaDexMachineContext) => ({
	worker: c.contract.worker,
	wallet: c.wallet
})

const luminaDexFactory = (c: LuminaDexMachineContext) => luminadexFactories[walletNetwork(c)]

const inputCompile = (
	{ context, contract }: { contract: ContractName; context: LuminaDexMachineContext }
) => ({ worker: context.contract.worker, contract })

const loaded = (
	{ context, contract }: { contract: ContractName; context: LuminaDexMachineContext }
) => {
	return {
		contract: {
			...context.contract,
			currentlyLoading: null,
			loaded: { ...context.contract.loaded, [contract]: true }
		}
	}
}

const setContractError = (message: string) =>
(
	{ context, event }: ActionArgs<LuminaDexMachineContext, ErrorActorEvent, LuminaDexMachineEvent>
) => {
	return { contract: { ...context.contract, error: { message, error: event.error } } }
}

const setDexError = (message: string) =>
(
	{ context, event }: ActionArgs<LuminaDexMachineContext, ErrorActorEvent, LuminaDexMachineEvent>
) => {
	return { dex: { ...context.dex, error: { message, error: event.error } } }
}

const resetSettings = { calculated: null, transactionResult: null } as const

/**
 * Helper function to measure and log the time taken to execute an action.
 */
const act = async <T>(label: string, body: (stop: () => void) => Promise<T>) => {
	const stop = measure(label)
	logger.start(label)
	try {
		const result = await body(stop)
		logger.success(label)
		stop()
		return result
	} catch (e) {
		logger.error(`${label} Error:`, e)
		stop()
		throw e
	}
}

/**
 * Verify if the contracts are loaded for a given action.
 */
const canStartDexAction = (context: LuminaDexMachineContext) => {
	const loaded = context.contract.loaded
	return {
		changeSwapSettings: loaded.Pool && loaded.FungibleToken,
		swap: loaded.Pool && loaded.FungibleToken,
		changeAddLiquiditySettings: loaded.Pool && loaded.FungibleToken,
		addLiquidity: loaded.Pool && loaded.FungibleToken,
		changeRemoveLiquiditySettings: loaded.Pool && loaded.FungibleToken,
		removeLiquidity: loaded.Pool && loaded.FungibleToken && loaded.PoolTokenHolder,
		deployPool: loaded.PoolFactory,
		deployToken: loaded.FungibleToken && loaded.FungibleTokenAdmin,
		mintToken: loaded.FungibleToken,
		claim: loaded.FungibleToken && loaded.Faucet
	} satisfies Record<keyof Can, boolean>
}

/**
 * Verify if the user can perform a Dex action based on loaded contracts and calculated values.
 */
export const canDoDexAction = (context: LuminaDexMachineContext) => {
	const start = canStartDexAction(context)
	return {
		...start,
		addLiquidity: start.addLiquidity && context.dex.addLiquidity.calculated !== null,
		removeLiquidity: start.removeLiquidity && context.dex.removeLiquidity.calculated !== null,
		swap: start.swap && context.dex.swap.calculated !== null
	}
}

const setToLoadFromFeatures = (features: DexFeatures) => {
	const toLoad = new Set<ContractName>([])
	if (features.includes("Swap")) {
		toLoad.add("FungibleToken")
		toLoad.add("Pool")
		toLoad.add("PoolTokenHolder")
	}
	if (features.includes("DeployPool")) {
		toLoad.add("PoolFactory")
	}
	if (features.includes("DeployToken")) {
		toLoad.add("FungibleToken")
		toLoad.add("FungibleTokenAdmin")
	}
	if (features.includes("Claim")) {
		toLoad.add("FungibleToken")
		toLoad.add("Faucet")
	}
	return toLoad
}

export const createLuminaDexMachine = () => {
	return setup({
		types: {
			context: {} as LuminaDexMachineContext,
			events: {} as LuminaDexMachineEvent,
			input: {} as LuminaDexMachineInput
		},
		guards: {
			isTestnet: ({ context }) => !walletNetwork(context).includes("mainnet"),
			compileFungibleToken: ({ context }) => context.contract.currentlyLoading === "FungibleToken",
			compilePool: ({ context }) => context.contract.currentlyLoading === "Pool",
			compilePoolTokenHolder: ({ context }) =>
				context.contract.currentlyLoading === "PoolTokenHolder",
			compilePoolFactory: ({ context }) => context.contract.currentlyLoading === "PoolFactory",
			compileFaucet: ({ context }) => context.contract.currentlyLoading === "Faucet",
			compileFungibleTokenAdmin: ({ context }) =>
				context.contract.currentlyLoading === "FungibleTokenAdmin"
		},
		actors: {
			detectWalletChange,
			loadContracts: fromPromise(
				async ({ input }: { input: { worker: DexWorker; features: DexFeatures } }) => {
					const { worker, features } = input
					return act("loadContracts", async () => {
						await worker.loadContracts()
						return setToLoadFromFeatures(features)
					})
				}
			),
			compileContract: fromPromise(
				async ({ input }: { input: { worker: DexWorker; contract: ContractName } }) => {
					const { worker, contract } = input
					return act(contract, async () => {
						const disableCache = getDebugConfig().disableCache
						await worker.compileContract({ contract, disableCache })
					})
				}
			),
			claim: fromPromise(
				async ({ input }: { input: InputDexWorker & User & { faucet: FaucetSettings } }) =>
					act("claim", async (stop) => {
						const { worker, wallet, user, faucet } = input
						const tx = await worker.claim({ user, faucet })
						stop()
						return await sendTransaction({ tx, wallet })
					})
			),
			swap: fromPromise(async ({ input }: { input: InputDexWorker & SwapArgs }) => {
				return act("swap", async (stop) => {
					const { worker, wallet, ...swapSettings } = input
					const tx = await worker.swap(swapSettings)
					stop()
					return await sendTransaction({ tx, wallet })
				})
			}),
			addLiquidity: fromPromise(async ({ input }: { input: AddLiquidity & InputDexWorker }) =>
				act("addLiquidity", async (stop) => {
					const { worker, wallet, ...config } = input
					const tx = await worker.addLiquidity(config)
					stop()
					return await sendTransaction({ tx, wallet })
				})
			),
			removeLiquidity: fromPromise(
				async ({ input }: { input: WithdrawLiquidity & InputDexWorker }) => {
					return act("removeLiquidity", async (stop) => {
						const { worker, wallet, ...config } = input
						const tx = await worker.withdrawLiquidity(config)
						stop()
						return await sendTransaction({ tx, wallet })
					})
				}
			),
			mintToken: fromPromise(async ({ input }: { input: InputDexWorker & MintToken }) =>
				act("mintToken", async (stop) => {
					const { worker, wallet, ...config } = input
					const tx = await worker.mintToken(config)
					stop()
					return await sendTransaction({ tx, wallet })
				})
			),
			deployPool: fromPromise(async ({ input }: { input: InputDexWorker & DeployPoolArgs }) =>
				act("deployPool", async (stop) => {
					const { worker, wallet, ...config } = input
					const tx = await worker.deployPoolInstance(config)
					stop()
					return await sendTransaction({ tx, wallet })
				})
			),
			deployToken: fromPromise(
				async ({ input }: { input: InputDexWorker & { symbol: string } & User }) =>
					act("deployToken", async (stop) => {
						const { worker, symbol, wallet, user } = input
						// TokenKey
						const tk = PrivateKey.random()
						const tokenKey = tk.toBase58()
						const tokenKeyPublic = tk.toPublicKey().toBase58()
						// TokenAdminKey
						const tak = PrivateKey.random()
						const tokenAdminKey = tak.toBase58()
						const tokenAdminKeyPublic = tak.toPublicKey().toBase58()

						const tx = await worker.deployToken({ user, tokenKey, tokenAdminKey, symbol })
						stop()
						const transactionOutput = await sendTransaction({ tx, wallet })
						return {
							transactionOutput,
							token: { symbol, tokenKey, tokenAdminKey, tokenKeyPublic, tokenAdminKeyPublic }
						}
					})
			),
			calculateSwapAmount: fromPromise(
				async ({ input }: { input: InputDexWorker & SwapSettings & { frontendFee: number } }) => {
					return act("calculateSwapAmount", async () => {
						const { worker, pool, slippagePercent, from, frontendFee } = input
						const reserves = await worker.getReserves(pool)
						const settings = { from, slippagePercent }
						if (reserves.token0.amount && reserves.token1.amount) {
							const amountIn = amount(from)
							const ok = reserves.token0.address === from.address
							const balanceIn = Number.parseInt(
								ok ? reserves.token0.amount : reserves.token1.amount
							)
							const balanceOut = Number.parseInt(
								ok ? reserves.token1.amount : reserves.token0.amount
							)
							const swapAmount = getAmountOut({
								amountIn,
								balanceIn,
								balanceOut,
								slippagePercent,
								frontendFee
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
					})
				}
			),
			calculateAddLiquidityAmount: fromPromise(
				async ({ input }: { input: InputDexWorker & AddLiquiditySettings }) => {
					return act("calculateAddLiquidityAmount", async () => {
						const { worker, pool, tokenA, tokenB, slippagePercent } = input
						const reserves = await worker.getReserves(pool)

						const isToken0 = reserves.token0.address === tokenA.address

						if (reserves.token0.amount && reserves.token1.amount && reserves.liquidity) {
							const balanceA = Number.parseInt(
								isToken0 ? reserves.token0.amount : reserves.token1.amount
							)
							const balanceB = Number.parseInt(
								isToken0 ? reserves.token1.amount : reserves.token0.amount
							)

							const liquidity = Number.parseInt(reserves.liquidity)

							if (liquidity > 0) {
								const amountAIn = amount(tokenA)
								const liquidityAmount = getAmountLiquidityOut({
									tokenA: {
										address: tokenA.address,
										amountIn: amountAIn,
										balance: balanceA
									},
									tokenB: { address: tokenB.address, balance: balanceB },
									supply: liquidity,
									slippagePercent
								})
								return liquidityAmount
							}

							const amountAIn = amount(tokenA)
							const amountBIn = amount(tokenB)
							const liquidityAmount = getFirstAmountLiquidityOut({
								tokenA: { address: tokenA.address, amountIn: amountAIn },
								tokenB: { address: tokenB.address, amountIn: amountBIn }
							})
							return liquidityAmount
						}
						const liquidityAmount = {
							tokenA: { address: "", amountIn: 0, balanceMax: 0 },
							tokenB: { address: "", amountIn: 0, balanceMax: 0 },
							supplyMin: 0,
							liquidity: 0
						}
						return liquidityAmount
					})
				}
			),
			calculateRemoveLiquidityAmount: fromPromise(
				async ({ input }: { input: InputDexWorker & RemoveLiquiditySettings }) => {
					return act("calculateRemoveLiquidityAmount", async () => {
						const { worker, pool, lpAmount, slippagePercent } = input
						const reserves = await worker.getReserves(pool)

						if (reserves.token0.amount && reserves.token1.amount && reserves.liquidity) {
							const balanceA = Number.parseInt(reserves.token0.amount)
							const balanceB = Number.parseInt(reserves.token1.amount)

							const supply = Number.parseInt(reserves.liquidity)
							// lp token has 9 decimals
							const liquidity = Number.parseInt(lpAmount) * 10 ** 9
							const liquidityAmount = getAmountOutFromLiquidity({
								liquidity,
								tokenA: { address: reserves.token0.address, balance: balanceA },
								tokenB: { address: reserves.token1.address, balance: balanceB },
								supply,
								slippagePercent
							})
							return liquidityAmount
						}
						const liquidityAmount = {
							tokenA: { address: "", amountOut: 0, balanceMin: 0 },
							tokenB: { address: "", amountOut: 0, balanceMin: 0 },
							supplyMax: 0,
							liquidity: 0
						}
						return liquidityAmount
					})
				}
			)
		},
		actions: {
			trackPoolDeployed: ({ context }) => {
				fetch(`${luminaCdnOrigin}/api/${walletNetwork(context)}/pool`, {
					method: "POST"
				})
			}
		}
	}).createMachine({
		id: "luminaDex",
		context: ({
			input: { wallet, features, frontendFee: { destination, amount } }
		}) => {
			if (!isBetween(0, 10)(amount)) throw new Error("The Frontend Fee must be between 0 and 10.")
			const nsWorker = new Worker(new URL("../../dex/luminadex-worker.ts", import.meta.url), {
				type: "module"
			})
			const worker = Comlink.wrap<LuminaDexWorker>(nsWorker)
			logger.info("Dex Features loaded:", features)
			return {
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
					loaded: {
						Faucet: false,
						FungibleToken: false,
						FungibleTokenAdmin: false,
						Pool: false,
						PoolFactory: false,
						PoolTokenHolder: false
					},
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
		entry: spawnChild("detectWalletChange", {
			input: ({ context }) => ({ wallet: context.wallet })
		}),
		on: {
			NetworkChanged: {
				actions: enqueueActions(({ context, event }) => {
					context.contract.worker.minaInstance(event.network)
				})
			},
			AccountChanged: {}
		},
		type: "parallel",
		states: {
			contractSystem: {
				initial: "LOADING_CONTRACTS",
				states: {
					LOADING_CONTRACTS: {
						invoke: {
							src: "loadContracts",
							input: ({ context }) => ({ ...inputWorker(context), features: context.features }),
							onDone: {
								target: "IDLE",
								actions: assign(({ context, event }) => ({
									...context,
									contract: { ...context.contract, toLoad: event.output }
								}))
							},
							onError: {
								target: "FAILED",
								actions: assign(setContractError("Loading Contracts"))
							}
						}
					},
					COMPILE_FUNGIBLE_TOKEN: {
						invoke: {
							src: "compileContract",
							input: ({ context }) => inputCompile({ context, contract: "FungibleToken" }),
							onDone: {
								target: "IDLE",
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
								target: "IDLE",
								actions: assign(({ context }) =>
									loaded({ context, contract: "FungibleTokenAdmin" })
								)
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
								target: "IDLE",
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
								target: "IDLE",
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
								target: "IDLE",
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
								target: "IDLE",
								actions: assign(({ context }) => loaded({ context, contract: "Faucet" }))
							},
							onError: {
								target: "FAILED",
								actions: assign(setContractError("Compile Faucet Contracts"))
							}
						}
					},
					IDLE: {
						description: "The compiled contracts are ready.",
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
							}
						}),
						on: {
							LoadNextContract: [
								{ target: "COMPILE_FUNGIBLE_TOKEN", guard: "compileFungibleToken" },
								{ target: "COMPILE_FUNGIBLE_TOKEN_ADMIN", guard: "compileFungibleTokenAdmin" },
								{ target: "COMPILE_POOL", guard: "compilePool" },
								{ target: "COMPILE_POOL_TOKEN_HOLDER", guard: "compilePoolTokenHolder" },
								{ target: "COMPILE_POOL_FACTORY", guard: "compilePoolFactory" },
								{ target: "COMPILE_FAUCET", guard: "compileFaucet" }
							],
							LoadFeatures: {
								target: "IDLE",
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
									const toLoad = context.contract.toLoad.union(additionalToLoad).difference(
										alreadyLoaded
									) as Set<ContractName>
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
						on: { LoadContracts: "LOADING_CONTRACTS" },
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
							DeployPool: {
								target: "DEPLOYING_POOL",
								description: "Deploy a pool for a given token.",
								guard: ({ context }) => canStartDexAction(context).deployPool,
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
								guard: ({ context }) => canStartDexAction(context).deployToken,
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
								guard: and(["isTestnet", ({ context }) => canStartDexAction(context).claim]),
								actions: assign(({ context }) => ({
									dex: { ...context.dex, claim: { transactionResult: null } }
								}))
							},
							MintToken: {
								target: "MINTING",
								description: "Mint a token to a given destination address.",
								guard: ({ context }) => canStartDexAction(context).mintToken,
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
									user: walletUser(context)
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
									({ context }) => {
										logger.info("Syncing pools with CDN...")
										fetch(`${luminaCdnOrigin}/api/${walletNetwork(context)}/sync`, {
											method: "POST"
										})
									},
									assign(({ context, event }) => ({
										dex: {
											...context.dex,
											deployPool: { ...context.dex.deployPool, transactionResult: event.output }
										}
									})),
									{ type: "trackPoolDeployed" }
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
									user: walletUser(context),
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
					}
				}
			}
		}
	})
}
