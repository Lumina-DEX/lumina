interface GetAmountOut {
	amountIn: bigint
	balanceIn: bigint
	balanceOut: bigint
	slippagePercent: number
	frontendFee: number
}
export function getAmountOut({ amountIn, balanceIn, balanceOut, slippagePercent, frontendFee }: GetAmountOut) {
	const slip = BigInt(Math.trunc(slippagePercent * 100))
	const fee = BigInt(Math.trunc(frontendFee))

	const balanceInMax = balanceIn + (balanceIn * slip) / 10_000n
	const balanceOutMin = balanceOut - (balanceOut * slip) / 10_000n

	const baseAmountOut = (balanceOutMin * amountIn) / (balanceInMax + amountIn)
	const feeFrontend = (baseAmountOut * fee) / 10_000n
	const feeLP = (baseAmountOut * 2n) / 1_000n
	const feeProtocol = (baseAmountOut * 5n) / 10_000n
	const amountOut = baseAmountOut - feeFrontend - feeLP - feeProtocol - 1n

	return { amountIn, amountOut, balanceOutMin, balanceInMax }
}

interface GetAmountLiquidityOut {
	tokenA: { address: string; amountIn: bigint; balance: bigint }
	tokenB: { address: string; balance: bigint }
	supply: bigint
	slippagePercent: number
}
export function getAmountLiquidityOut({ tokenA, tokenB, supply, slippagePercent }: GetAmountLiquidityOut) {
	const slip = BigInt(Math.trunc(slippagePercent * 100))

	const balanceAMax = tokenA.balance + (tokenA.balance * slip) / 10_000n
	const balanceBMax = tokenB.balance + (tokenB.balance * slip) / 10_000n
	const supplyMin = supply - (supply * slip) / 10_000n

	const liquidityA = (tokenA.amountIn * supplyMin) / balanceAMax
	const amountBIn = (liquidityA * balanceBMax) / supplyMin
	const liquidityB = (amountBIn * supplyMin) / balanceBMax

	const baseLiquidity = liquidityA < liquidityB ? liquidityA : liquidityB
	// remove 0.1% protocol tax, truncate - 1
	const liquidity = baseLiquidity - baseLiquidity / 1_000n - 1n

	return {
		tokenA: { address: tokenA.address, amountIn: tokenA.amountIn, balanceMax: balanceAMax },
		tokenB: { address: tokenB.address, amountIn: amountBIn, balanceMax: balanceBMax },
		supplyMin,
		liquidity
	}
}

interface GetFirstAmountLiquidityOut {
	tokenA: { address: string; amountIn: bigint }
	tokenB: { address: string; amountIn: bigint }
}
export function getFirstAmountLiquidityOut({ tokenA, tokenB }: GetFirstAmountLiquidityOut) {
	const baseLiquidity = tokenA.amountIn + tokenB.amountIn
	// remove 0.1% protocol tax, truncate - 1
	const liquidity = baseLiquidity - baseLiquidity / 1_000n - 1n

	return {
		tokenA: { address: tokenA.address, amountIn: tokenA.amountIn, balanceMax: 0n },
		tokenB: { address: tokenB.address, amountIn: tokenB.amountIn, balanceMax: 0n },
		supplyMin: 0n,
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
 * Converts a decimal number to the smallest unit of a token (e.g., 1.5 MINA → 1_500_000_000n).
 * Uses string manipulation to avoid float precision loss during conversion.
 * Truncates any decimal places beyond the specified precision.
 * @param amount The decimal number to convert (e.g., 1.23456789)
 * @param decimals The number of decimal places for the token (e.g., 9 for MINA)
 * @returns The bigint representation of the amount in smallest units
 */
export function toUnits(amount: number, decimals: number): bigint {
	const amountStr = amount.toString()
	const [integerPart, decimalPart = ""] = amountStr.split(".")
	const pad = "0".repeat(decimals)
	const paddedDecimals = (decimalPart + pad).slice(0, decimals)
	return BigInt(integerPart + paddedDecimals)
}

/**
 * Converts a decimal number to nano units (multiplies by 10^9 and converts to bigint).
 * Handles up to 9 decimal places and truncates any excess decimals.
 * @param amount The decimal number to convert (e.g., 1.23456789)
 * @returns The bigint representation of the amount in nano units
 */
export const toNanoUnits = (amount: number) => toUnits(amount, 9)

/**
 * Converts a bigint amount in smallest units back to a decimal number (e.g., 1_500_000_000n → 1.5).
 * @param amount The bigint amount
 * @param decimals The number of decimal places for the token (e.g., 9 for MINA)
 * @returns The decimal representation of the amount
 */
export function fromUnits(amount: bigint, decimals: number): number {
	const divisor = BigInt(10 ** decimals)
	const integer = amount / divisor
	const remainder = amount % divisor
	return Number(integer) + Number(remainder) / 10 ** decimals
}

/**
 * Converts a bigint amount in nano units back to a decimal number (e.g., 1_500_000_000n → 1.5).
 * Usefull for Mina and lp tokens which have 9 decimals.
 * @param amount The bigint amount in nano units
 * @returns The decimal representation of the amount
 */
export const fromNanoUnits = (amount: bigint): number => fromUnits(amount, 9)
