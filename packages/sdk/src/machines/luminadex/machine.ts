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
	spawnChild,
	stateIn
} from "xstate"
import { chainFaucets, luminaCdnOrigin, luminadexFactories } from "../../constants/index"
import type {
	AddLiquidity,
	CompileContract,
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
import { createMeasure, prefixedLogger } from "../../helpers/logs"
import { sendTransaction } from "../../helpers/transfer"
import { isBetween } from "../../helpers/validation"
import { detectWalletChange, type WalletActorRef } from "../wallet/actors"
import type {
	AddLiquiditySettings,
	Can,
	ContractName,
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

const walletNetwork = (c: { wallet: WalletActorRef }) =>
	c.wallet.getSnapshot().context.currentNetwork
const walletUser = (c: LuminaDexMachineContext) => c.wallet.getSnapshot().context.account

const inputWorker = (context: LuminaDexMachineContext) => ({ worker: context.contract.worker })

const luminaDexFactory = (context: { wallet: WalletActorRef }) => {
	const network = walletNetwork(context)
	if (network !== "mina:testnet") throw new Error("Network not supported.")
	return luminadexFactories[network]
}

const inputCompile = (
	{ context, contract }: { contract: ContractName; context: LuminaDexMachineContext }
) => ({ ...inputWorker(context), contract })

const loaded = (
	{ context, contract }: { contract: ContractName; context: LuminaDexMachineContext }
) => {
	const c = {
		contract: {
			...context.contract,
			loaded: { ...context.contract.loaded, [contract]: true }
		}
	}
	return c
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

export const canDoDexAction = (context: LuminaDexMachineContext) => {
	const loaded = context.contract.loaded
	return {
		changeSwapSettings: loaded.Pool && loaded.FungibleToken,
		swap: loaded.Pool && loaded.FungibleToken && context.dex.swap.calculated !== null,
		changeAddLiquiditySettings: loaded.Pool && loaded.FungibleToken,
		addLiquidity: loaded.Pool && loaded.FungibleToken
			&& context.dex.addLiquidity.calculated !== null,
		changeRemoveLiquiditySettings: loaded.Pool && loaded.FungibleToken,
		removeLiquidity: loaded.Pool && loaded.FungibleToken && loaded.PoolTokenHolder
			&& context.dex.removeLiquidity.calculated !== null,
		deployPool: loaded.PoolFactory,
		deployToken: loaded.FungibleToken && loaded.FungibleTokenAdmin,
		mintToken: loaded.FungibleToken,
		claim: loaded.FungibleToken && loaded.Faucet
	} satisfies Record<keyof Can, boolean>
}

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
			isTestnet: ({ context }) => !walletNetwork(context).includes("mainnet"),
			allContractsReady: stateIn({ contractSystem: "CONTRACTS_READY" }),
			contract: ({ context }, { contracts }: { contracts: ContractName[] }) =>
				contracts.every(contract => context.contract.loaded[contract])
		},
		actors: {
			detectWalletChange,
			loadContracts: fromPromise(async ({ input: { worker } }: { input: InputDexWorker }) => {
				act("loadContracts", async () => {
					await worker.loadContracts()
				})
			}),
			compileContract: fromPromise(
				async ({ input: { worker, ...config } }: { input: InputDexWorker & CompileContract }) =>
					act(config.contract, async () => {
						await worker.compileContract(config)
					})
			),
			claim: fromPromise(
				async ({ input }: { input: InputDexWorker & User & { faucet: FaucetSettings } }) =>
					act("claim", async (stop) => {
						const { worker, user, faucet } = input
						const txJson = await worker.claim({ user, faucet })
						stop()
						return await sendTransaction(txJson)
					})
			),
			swap: fromPromise(async ({ input }: { input: InputDexWorker & SwapArgs }) => {
				return act("swap", async (stop) => {
					const { worker, ...swapSettings } = input
					const txJson = await worker.swap(swapSettings)
					stop()
					return await sendTransaction(txJson)
				})
			}),
			addLiquidity: fromPromise(async ({ input }: { input: AddLiquidity & InputDexWorker }) =>
				act("addLiquidity", async (stop) => {
					const { worker, ...config } = input
					const txJson = await worker.addLiquidity(config)
					stop()
					return await sendTransaction(txJson)
				})
			),
			removeLiquidity: fromPromise(
				async ({ input }: { input: WithdrawLiquidity & InputDexWorker }) => {
					return act("removeLiquidity", async (stop) => {
						const { worker, ...config } = input
						const txJson = await worker.withdrawLiquidity(config)
						stop()
						return await sendTransaction(txJson)
					})
				}
			),
			mintToken: fromPromise(async ({ input }: { input: InputDexWorker & MintToken }) =>
				act("mintToken", async (stop) => {
					const { worker, ...config } = input
					const txJson = await worker.mintToken(config)
					stop()
					return await sendTransaction(txJson)
				})
			),
			deployPool: fromPromise(async ({ input }: { input: InputDexWorker & DeployPoolArgs }) =>
				act("deployPool", async (stop) => {
					const { worker, user, tokenA, tokenB, factory } = input
					const txJson = await worker.deployPoolInstance({ user, tokenA, tokenB, factory })
					stop()
					return await sendTransaction(txJson)
				})
			),
			deployToken: fromPromise(
				async ({ input }: { input: InputDexWorker & { symbol: string } & User }) =>
					act("deployToken", async (stop) => {
						const { worker, symbol, user } = input
						// TokenKey
						const tk = PrivateKey.random()
						const tokenKey = tk.toBase58()
						const tokenKeyPublic = tk.toPublicKey().toBase58()
						// TokenAdminKey
						const tak = PrivateKey.random()
						const tokenAdminKey = tak.toBase58()
						const tokenAdminKeyPublic = tak.toPublicKey().toBase58()

						const txJson = await worker.deployToken({ user, tokenKey, tokenAdminKey, symbol })
						stop()
						const transactionOutput = await sendTransaction(txJson)
						return {
							transactionOutput,
							token: { symbol, tokenKey, tokenAdminKey, tokenKeyPublic, tokenAdminKeyPublic }
						}
					})
			),
			calculateSwapAmount: fromPromise(
				async ({ input }: { input: InputDexWorker & SwapSettings }) => {
					return act("calculateSwapAmount", async () => {
						const { worker, pool, slippagePercent, from } = input
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
					})
				}
			),
			calculateAddLiquidityAmount: fromPromise(
				async ({ input }: { input: InputDexWorker & AddLiquiditySettings }) => {
					return act("calculateAddLiquidityAmount", async () => {
						const { worker, pool, tokenA, tokenB, slippagePercent } = input
						const reserves = await worker.getReserves(pool)

						const ok = reserves.token0.address === tokenA.address

						if (reserves.token0.amount && reserves.token1.amount && reserves.liquidity) {
							const balanceA = Number.parseInt(ok ? reserves.token0.amount : reserves.token1.amount)
							const balanceB = Number.parseInt(ok ? reserves.token1.amount : reserves.token0.amount)

							const liquidity = Number.parseInt(reserves.liquidity)

							if (liquidity > 0) {
								const amountAIn = amount(ok ? tokenA : tokenB)
								const liquidityAmount = getAmountLiquidityOut({
									amountAIn,
									balanceA,
									balanceB,
									supply: liquidity,
									slippagePercent
								})
								return liquidityAmount
							}

							const amountAIn = amount(ok ? tokenA : tokenB)
							const amountBIn = amount(ok ? tokenB : tokenA)
							const liquidityAmount = getFirstAmountLiquidityOut({ amountAIn, amountBIn })
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
					})
				}
			),
			calculateRemoveLiquidityAmount: fromPromise(
				async ({ input }: { input: InputDexWorker & RemoveLiquiditySettings }) => {
					return act("calculateRemoveLiquidityAmount", async () => {
						const { worker, pool, tokenA, tokenB, slippagePercent } = input
						const reserves = await worker.getReserves(pool)

						const ok = reserves.token0.address === tokenA.address

						if (reserves.token0.amount && reserves.token1.amount && reserves.liquidity) {
							const balanceA = Number.parseInt(ok ? reserves.token0.amount : reserves.token1.amount)
							const balanceB = Number.parseInt(ok ? reserves.token1.amount : reserves.token0.amount)

							const supply = Number.parseInt(reserves.liquidity)
							const liquidity = amount(ok ? tokenA : tokenB)
							const liquidityAmount = getAmountOutFromLiquidity({
								liquidity,
								balanceA,
								balanceB,
								supply,
								slippagePercent
							})
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
			input: { wallet, frontendFee: { destination, amount } }
		}) => {
			if (!isBetween(0, 15)(amount)) throw new Error("The Frontend Fee must be between 0 and 15.")
			const nsWorker = new Worker(new URL("../../dex/luminadex-worker.ts", import.meta.url), {
				type: "module"
			})
			const worker = Comlink.wrap<LuminaDexWorker>(nsWorker)
			return {
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
							input: ({ context }) => inputWorker(context),
							onDone: "COMPILE_FUNGIBLE_TOKEN",
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
								target: "COMPILE_POOL",
								actions: assign(({ context }) => loaded({ context, contract: "FungibleToken" }))
							},
							onError: {
								target: "FAILED",
								actions: assign(setContractError("Compile Contracts"))
							}
						}
					},
					COMPILE_POOL: {
						invoke: {
							src: "compileContract",
							input: ({ context }) => inputCompile({ context, contract: "Pool" }),
							onDone: {
								target: "COMPILE_POOL_TOKEN_HOLDER",
								actions: assign(({ context }) => loaded({ context, contract: "Pool" }))
							}
						}
					},
					COMPILE_POOL_TOKEN_HOLDER: {
						invoke: {
							src: "compileContract",
							input: ({ context }) => inputCompile({ context, contract: "PoolTokenHolder" }),
							onDone: {
								target: "COMPILE_FUNGIBLE_TOKEN_ADMIN",
								actions: assign(({ context }) => loaded({ context, contract: "PoolTokenHolder" }))
							}
						}
					},
					COMPILE_FUNGIBLE_TOKEN_ADMIN: {
						invoke: {
							src: "compileContract",
							input: ({ context }) => inputCompile({ context, contract: "FungibleTokenAdmin" }),
							onDone: {
								target: "COMPILE_POOL_FACTORY",
								actions: assign(({ context }) =>
									loaded({ context, contract: "FungibleTokenAdmin" })
								)
							}
						}
					},
					COMPILE_POOL_FACTORY: { // We don't need to target INITIALIZE_POOL_FACTORY as its done in the worker.
						invoke: {
							src: "compileContract",
							input: ({ context }: { context: LuminaDexMachineContext }) =>
								inputCompile({ context, contract: "PoolFactory" }),
							onDone: {
								target: "COMPILE_FAUCET",
								actions: assign(({ context }) => loaded({ context, contract: "PoolFactory" }))
							}
						}
					},
					COMPILE_FAUCET: {
						invoke: {
							src: "compileContract",
							input: ({ context }) => inputCompile({ context, contract: "Faucet" }),
							onDone: {
								target: "CONTRACTS_READY",
								actions: assign(({ context }) => loaded({ context, contract: "Faucet" }))
							}
						}
					},
					CONTRACTS_READY: { description: "The dex is ready." },
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
								guard: "allContractsReady",
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
								guard: "allContractsReady",
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
								guard: and(["allContractsReady", "isTestnet"]),
								actions: assign(({ context }) => ({
									dex: { ...context.dex, claim: { transactionResult: null } }
								}))
							},
							MintToken: {
								target: "MINTING",
								description: "Mint a token to a given destination address.",
								guard: "allContractsReady",
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
								guard: { type: "contract", params: { contracts: ["Pool", "FungibleToken"] } },
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
								guard: and(["calculatedRemoveLiquidity", "allContractsReady"])
							},
							ChangeAddLiquiditySettings: {
								target: "CALCULATING_ADD_LIQUIDITY_AMOUNT",
								description: "Change the settings for adding liquidity.",
								guard: { type: "contract", params: { contracts: ["Pool", "FungibleToken"] } },
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
								guard: and(["calculatedAddLiquidity", "allContractsReady"])
							},
							ChangeSwapSettings: {
								target: "CALCULATING_SWAP_AMOUNT",
								description: "Change the settings for a token swap.",
								guard: { type: "contract", params: { contracts: ["Pool", "FungibleToken"] } },
								actions: assign(({ context, event }) => ({
									dex: {
										...context.dex,
										swap: { ...event.settings, ...resetSettings }
									}
								}))
							},
							Swap: {
								target: "SWAPPING",
								guard: and(["calculatedSwap", "allContractsReady"]),
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
								return {
									...inputWorker(context),
									tokenA: context.dex.deployPool.tokenA,
									tokenB: context.dex.deployPool.tokenB,
									user: walletUser(context),
									factory: luminaDexFactory(context)
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
									user: walletUser(context),
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
									to: swap.to,
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
