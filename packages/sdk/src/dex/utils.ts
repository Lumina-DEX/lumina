interface GetAmountOut {
	amountIn: number
	balanceIn: number
	balanceOut: number
	slippagePercent: number
	frontendFee: number
}
export function getAmountOut({ amountIn, balanceIn, balanceOut, slippagePercent, frontendFee }: GetAmountOut) {
	const balanceInMax = balanceIn + (balanceIn * slippagePercent) / 100
	const balanceOutMin = balanceOut - (balanceOut * slippagePercent) / 100

	const baseAmountOut = (balanceOutMin * amountIn) / (balanceInMax + amountIn)
	// 0.25 % tax
	const feeFrontend = (baseAmountOut * frontendFee) / 10000
	const feeLP = (baseAmountOut * 2) / 1000
	const feeProtocol = (baseAmountOut * 5) / 10000
	const taxedAmountOut = baseAmountOut - feeFrontend - feeLP - feeProtocol
	// truncate - 1
	const amountOut = Math.trunc(taxedAmountOut) - 1

	return { amountIn, amountOut, balanceOutMin, balanceInMax }
}

interface GetAmountLiquidityOut {
	tokenA: { address: string; amountIn: number; balance: number }
	tokenB: { address: string; balance: number }
	supply: number
	slippagePercent: number
}

export function getAmountLiquidityOut({ tokenA, tokenB, supply, slippagePercent }: GetAmountLiquidityOut) {
	const balanceAMax = tokenA.balance + (tokenA.balance * slippagePercent) / 100
	const balanceBMax = tokenB.balance + (tokenB.balance * slippagePercent) / 100
	const supplyMin = supply - (supply * slippagePercent) / 100

	const liquidityA = Math.trunc((tokenA.amountIn * supplyMin) / balanceAMax)
	const amountBIn = Math.trunc((liquidityA * balanceBMax) / supplyMin)
	const liquidityB = Math.trunc((amountBIn * supplyMin) / balanceBMax)

	const baseLiquidity = Math.min(liquidityA, liquidityB)
	// remove 0.1 % protocol tax
	const taxedLiquidity = baseLiquidity - baseLiquidity / 1000

	// truncate - 1
	const liquidity = Math.trunc(taxedLiquidity) - 1

	return {
		tokenA: { address: tokenA.address, amountIn: tokenA.amountIn, balanceMax: balanceAMax },
		tokenB: { address: tokenB.address, amountIn: amountBIn, balanceMax: balanceBMax },
		supplyMin,
		liquidity
	}
}

interface GetFirstAmountLiquidityOut {
	tokenA: { address: string; amountIn: number }
	tokenB: { address: string; amountIn: number }
}
export function getFirstAmountLiquidityOut({ tokenA, tokenB }: GetFirstAmountLiquidityOut) {
	const baseLiquidity = tokenA.amountIn + tokenB.amountIn

	// remove 0.1 % protocol tax
	const taxedLiquidity = baseLiquidity - baseLiquidity / 1000

	// truncate - 1
	const liquidity = Math.trunc(taxedLiquidity) - 1

	// use same return than getAmountLiquidityOut to use same method on supply liquidity
	return {
		tokenA: { address: tokenA.address, amountIn: tokenA.amountIn, balanceMax: 0 },
		tokenB: { address: tokenB.address, amountIn: tokenB.amountIn, balanceMax: 0 },
		supplyMin: 0,
		liquidity
	}
}

type GetAmountOutFromLiquidity = {
	liquidity: bigint
	tokenA: { address: string; balance: bigint }
	tokenB: { address: string; balance: bigint }
	supply: bigint
	slippagePercent: number
}

export function getAmountOutFromLiquidity({
	liquidity,
	tokenA,
	tokenB,
	supply,
	slippagePercent
}: GetAmountOutFromLiquidity) {
	const slip = BigInt(Math.trunc(slippagePercent * 100))

	const balanceAMin = tokenA.balance - (tokenA.balance * slip) / 10_000n
	const balanceBMin = tokenB.balance - (tokenB.balance * slip) / 10_000n
	const supplyMax = supply + (supply * slip) / 10_000n

	const amountAOut = (liquidity * balanceAMin) / supplyMax - 1n
	const amountBOut = (liquidity * balanceBMin) / supplyMax - 1n

	return {
		tokenA: { address: tokenA.address, amountOut: amountAOut, balanceMin: balanceAMin },
		tokenB: { address: tokenB.address, amountOut: amountBOut, balanceMin: balanceBMin },
		supplyMax,
		liquidity
	}
}

/**
 * Converts a decimal number to nano units (multiplies by 10^9 and converts to bigint).
 * Handles up to 9 decimal places and truncates any excess decimals.
 * @param amount The decimal number to convert (e.g., 1.23456789)
 * @returns the bigint representation of the amount in nano units
 */
export function toNanoUnits(amount: number): bigint {
	const amountStr = amount.toString()
	const [integerPart, decimalPart = ""] = amountStr.split(".")
	const paddedDecimals = (decimalPart + "000000000").slice(0, 9)
	return BigInt(integerPart + paddedDecimals)
}
