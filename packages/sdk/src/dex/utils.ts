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

interface GetAmountOutFromLiquidity {
	liquidity: number
	tokenA: { address: string; balance: number }
	tokenB: { address: string; balance: number }
	supply: number
	slippagePercent: number
}

export function getAmountOutFromLiquidity({
	liquidity,
	tokenA,
	tokenB,
	supply,
	slippagePercent
}: GetAmountOutFromLiquidity) {
	const balanceAMin = tokenA.balance - (tokenA.balance * slippagePercent) / 100
	const balanceBMin = tokenB.balance - (tokenB.balance * slippagePercent) / 100
	const supplyMax = supply + (supply * slippagePercent) / 100

	// truncate - 1
	const amountAOut = Math.trunc((liquidity * balanceAMin) / supplyMax) - 1
	const amountBOut = Math.trunc((liquidity * balanceBMin) / supplyMax) - 1
	return {
		tokenA: { address: tokenA.address, amountOut: amountAOut, balanceMin: balanceAMin },
		tokenB: { address: tokenB.address, amountOut: amountBOut, balanceMin: balanceBMin },
		supplyMax,
		liquidity
	}
}
