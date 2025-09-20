import { fromPromise } from "xstate"
import {
	getAmountLiquidityOut,
	getAmountOut,
	getAmountOutFromLiquidity,
	getFirstAmountLiquidityOut
} from "../../../dex/utils"
import { getDebugConfig } from "../../../helpers/debug"
import { act, amount, setToLoadFromFeatures } from "../helpers"
import type {
	AddLiquiditySettings,
	ContractName,
	DexFeatures,
	DexWorker,
	InputDexWorker,
	RemoveLiquiditySettings,
	SwapSettings
} from "../types"

export const initContracts = fromPromise(
	async ({ input }: { input: { worker: DexWorker; features: DexFeatures } }) => {
		const { worker, features } = input
		return act("initContracts", async () => {
			await worker.initContracts()
			return setToLoadFromFeatures(features)
		})
	}
)

export const compileContract = fromPromise(
	async ({ input }: { input: { worker: DexWorker; contract: ContractName } }) => {
		const { worker, contract } = input
		return act(contract, async () => {
			const disableCache = getDebugConfig().disableCache
			await worker.compileContract({ contract, disableCache })
		})
	}
)

export const calculateSwapAmount = fromPromise(
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
)

export const calculateAddLiquidityAmount = fromPromise(
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
)

export const calculateRemoveLiquidityAmount = fromPromise(
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
