import { describe, expect, it } from "vitest"
import { getAmountOutFromLiquidity } from "../src/dex/utils"

describe("getAmountOutFromLiquidity", () => {
	it("should handle 0% slippage — balanceMin equals full balance", () => {
		const result = getAmountOutFromLiquidity({
			liquidity: 36205869.5,
			tokenA: { address: "MINA", balance: "336033312365460" },
			tokenB: {
				address: "B62qjUhPDbMskxMduyzkyGnK6LZwHksuuYPRjyF4owJM7UWLGJynN36",
				balance: "555061724685882"
			},
			supply: "1751668281916",
			slippagePercent: 0
		})

		expect(result.tokenA.balanceMin).toBe(336033312365460)
		expect(result.tokenB.balanceMin).toBe(555061724685882)
		expect(result.supplyMax).toBe(1751668281916)
	})

	it("should produce lower amountOut with higher slippage", () => {
		const base = getAmountOutFromLiquidity({
			liquidity: 36205869.5,
			tokenA: { address: "MINA", balance: "336033312365460" },
			tokenB: {
				address: "B62qjUhPDbMskxMduyzkyGnK6LZwHksuuYPRjyF4owJM7UWLGJynN36",
				balance: "555061724685882"
			},
			supply: "1751668281916",
			slippagePercent: 1
		})

		const highSlippage = getAmountOutFromLiquidity({
			liquidity: 36205869.5,
			tokenA: { address: "MINA", balance: "336033312365460" },
			tokenB: {
				address: "B62qjUhPDbMskxMduyzkyGnK6LZwHksuuYPRjyF4owJM7UWLGJynN36",
				balance: "555061724685882"
			},
			supply: "1751668281916",
			slippagePercent: 5
		})

		expect(highSlippage.tokenA.amountOut).toBeLessThan(base.tokenA.amountOut)
		expect(highSlippage.tokenB.amountOut).toBeLessThan(base.tokenB.amountOut)
	})

	it("should match the exact args logged before the contract call", () => {
		// These are the exact values from the error log
		const liquidityAmount = 36205869n
		const reserveMinaMin = 332672979241806n
		const reserveTokenMin = 549511107439024n
		const supplyMax = 1769184964735n

		// Replicate contract's mulDiv: liquidityAmount * reserveMin / supplyMax
		const contractMinaOut = (liquidityAmount * reserveMinaMin) / supplyMax
		const contractTokenOut = (liquidityAmount * reserveTokenMin) / supplyMax

		const result = getAmountOutFromLiquidity({
			liquidity: 36205869.5,
			tokenA: { address: "MINA", balance: "336033312365460" },
			tokenB: {
				address: "B62qjUhPDbMskxMduyzkyGnK6LZwHksuuYPRjyF4owJM7UWLGJynN36",
				balance: "555061724685882"
			},
			supply: "1751668281916",
			slippagePercent: 1
		})

		// SDK amountOut must be <= what the contract computes (contract asserts amountOut >= amountMin)
		expect(result.tokenA.amountOut).toBeLessThanOrEqual(Number(contractMinaOut))
		expect(result.tokenB.amountOut).toBeLessThanOrEqual(Number(contractTokenOut))
	})
})
