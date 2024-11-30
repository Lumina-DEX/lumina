interface GetAmountOut {
	amountIn: number
	balanceIn: number
	balanceOut: number
	slippagePercent: number
}
export function getAmountOut({ amountIn, balanceIn, balanceOut, slippagePercent }: GetAmountOut) {
	const balanceInMax = balanceIn + (balanceIn * slippagePercent) / 100
	const balanceOutMin = balanceOut - (balanceOut * slippagePercent) / 100

	const baseAmountOut = (balanceOutMin * amountIn) / (balanceInMax + amountIn)
	// 0.25 % tax
	const taxedAmountOut = baseAmountOut - baseAmountOut / 400

	// truncate - 1
	const amountOut = Math.trunc(taxedAmountOut) - 1

	return { amountIn, amountOut, balanceOutMin, balanceInMax }
}

interface GetAmountLiquidityOut {
	amountAIn: number
	balanceA: number
	balanceB: number
	supply: number
	slippagePercent: number
}
export function getAmountLiquidityOut({
	amountAIn,
	balanceA,
	balanceB,
	supply,
	slippagePercent
}: GetAmountLiquidityOut) {
	const balanceAMax = balanceA + (balanceA * slippagePercent) / 100
	const balanceBMax = balanceB + (balanceB * slippagePercent) / 100
	const supplyMin = supply - (supply * slippagePercent) / 100

	const liquidityA = Math.trunc((amountAIn * supplyMin) / balanceAMax)
	const amountBIn = Math.trunc((liquidityA * balanceBMax) / supplyMin)
	const liquidityB = Math.trunc((amountBIn * supplyMin) / balanceBMax)

	const baseLiquidity = Math.min(liquidityA, liquidityB)
	// remove 0.1 % protocol tax
	const taxedLiquidity = baseLiquidity - baseLiquidity / 1000

	// truncate - 1
	const liquidity = Math.trunc(taxedLiquidity) - 1

	return { amountAIn, amountBIn, balanceAMax, balanceBMax, supplyMin, liquidity }
}

interface GetFirstAmountLiquidityOut {
	amountAIn: number
	amountBIn: number
}
export function getFirstAmountLiquidityOut({ amountAIn, amountBIn }: GetFirstAmountLiquidityOut) {
	const baseLiquidity = amountAIn + amountBIn

	// remove 0.1 % protocol tax
	const taxedLiquidity = baseLiquidity - baseLiquidity / 1000

	// truncate - 1
	const liquidity = Math.trunc(taxedLiquidity) - 1

	// use same return than getAmountLiquidityOut to use same method on supply liquidity
	return { amountAIn, amountBIn, balanceAMax: 0, balanceBMax: 0, supplyMin: 0, liquidity }
}

interface GetAmountOutFromLiquidity {
	liquidity: number
	balanceA: number
	balanceB: number
	supply: number
	slippagePercent: number
}
export function getAmountOutFromLiquidity({
	liquidity,
	balanceA,
	balanceB,
	supply,
	slippagePercent
}: GetAmountOutFromLiquidity) {
	const balanceAMin = balanceA - (balanceA * slippagePercent) / 100
	const balanceBMin = balanceB - (balanceB * slippagePercent) / 100
	const supplyMax = supply + (supply * slippagePercent) / 100

	// truncate - 1
	const amountAOut = Math.trunc((liquidity * balanceAMin) / supplyMax) - 1
	const amountBOut = Math.trunc((liquidity * balanceBMin) / supplyMax) - 1

	return { amountAOut, amountBOut, balanceAMin, balanceBMin, supplyMax, liquidity }
}
