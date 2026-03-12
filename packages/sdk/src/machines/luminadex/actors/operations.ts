import { fromPromise } from "xstate"
import {
	getAmountLiquidityOut,
	getAmountOut,
	getAmountOutFromLiquidity,
	getFirstAmountLiquidityOut,
	toNanoUnits
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

export const initContracts = fromPromise(async ({ input }: { input: { worker: DexWorker; features: DexFeatures } }) => {
	const { worker, features } = input
	return act("initContracts", async () => {
		await worker.initContracts()
		return setToLoadFromFeatures(features)
	})
})

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
				const ok = reserves.token0.address === from.address
				const amountIn = amount(from)
				const balanceIn = BigInt(ok ? reserves.token0.amount : reserves.token1.amount)
				const balanceOut = BigInt(ok ? reserves.token1.amount : reserves.token0.amount)
				const swapAmount = getAmountOut({ amountIn, balanceIn, balanceOut, slippagePercent, frontendFee })
				return { swapAmount, settings }
			}
			const swapAmount = {
				amountIn: 0n,
				amountOut: 0n,
				balanceOutMin: 0n,
				balanceInMax: 0n
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
				const balanceA = BigInt(isToken0 ? reserves.token0.amount : reserves.token1.amount)
				const balanceB = BigInt(isToken0 ? reserves.token1.amount : reserves.token0.amount)
				const supply = BigInt(reserves.liquidity)

				if (supply > 0n) {
					const amountAIn = amount(tokenA)
					return getAmountLiquidityOut({
						tokenA: { address: tokenA.address, amountIn: amountAIn, balance: balanceA },
						tokenB: { address: tokenB.address, balance: balanceB },
						supply,
						slippagePercent
					})
				}

				const amountAIn = amount(tokenA)
				const amountBIn = amount(tokenB)
				return getFirstAmountLiquidityOut({
					tokenA: { address: tokenA.address, amountIn: amountAIn },
					tokenB: { address: tokenB.address, amountIn: amountBIn }
				})
			}
			return {
				tokenA: { address: "", amountIn: 0n, balanceMax: 0n },
				tokenB: { address: "", amountIn: 0n, balanceMax: 0n },
				supplyMin: 0n,
				liquidity: 0n
			}
		})
	}
)

export const calculateRemoveLiquidityAmount = fromPromise(
	async ({ input }: { input: InputDexWorker & RemoveLiquiditySettings }) => {
		return act("calculateRemoveLiquidityAmount", async () => {
			const { worker, pool, lpAmount, slippagePercent } = input
			const reserves = await worker.getReserves(pool)

			if (reserves.token0.amount && reserves.token1.amount && reserves.liquidity) {
				const liquidity = toNanoUnits(Number.parseFloat(lpAmount))
				return getAmountOutFromLiquidity({
					liquidity,
					tokenA: { address: reserves.token0.address, balance: BigInt(reserves.token0.amount) },
					tokenB: { address: reserves.token1.address, balance: BigInt(reserves.token1.amount) },
					supply: BigInt(reserves.liquidity),
					slippagePercent
				})
			}
			return {
				tokenA: { address: "", amountOut: 0n, balanceMin: 0n },
				tokenB: { address: "", amountOut: 0n, balanceMin: 0n },
				supplyMax: 0n,
				liquidity: 0n
			}
		})
	}
)
