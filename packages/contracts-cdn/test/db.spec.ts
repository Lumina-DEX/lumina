import { env, runInDurableObject } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import type { TokenList } from "../src/do"

const id = env.TOKENLIST.idFromName("/path")
const stub = env.TOKENLIST.get(id)

const testToken0 = {
	address: "token0Address",
	tokenId: "token0Id",
	chainId: "zeko:testnet" as const,
	symbol: "TKN0",
	decimals: 9
}

const testToken1 = {
	address: "token1Address",
	tokenId: "token1Id",
	chainId: "zeko:testnet" as const,
	symbol: "TKN1",
	decimals: 9
}

const testToken = {
	address: "tokenAddress",
	tokenId: "testTokenId",
	chainId: "zeko:testnet" as const,
	symbol: "TEST",
	decimals: 9
}

const insertTokens = (instance: TokenList) => {
	instance.insertToken(testToken)
	instance.insertToken({
		...testToken,
		address: "tokenAddress2",
		symbol: "TEST2"
	})
}

const testPool = {
	address: "testPoolAddress",
	token0Address: "tokenAddress",
	token1Address: "tokenAddress2",
	tokenId: "testPoolTokenId",
	chainId: "zeko:testnet" as const,
	name: "TEST_POOL"
}

const insertPools = (instance: TokenList) => {
	insertTokens(instance)
	instance.insertPool(testPool)
	instance.insertPool({
		...testPool,
		address: "poolAddress2",
		token0Address: "token0Address2",
		token1Address: "token1Address2",
		name: "TEST_POOL2"
	})
}

describe("Read and write to the DO database", () => {
	describe("Token Management", () => {
		describe("Token Insertion", () => {
			it("can insert a token and retrieve it", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					instance.insertToken(testToken)
					const tokens = await instance.findAllTokens({ network: "zeko:testnet" })
					expect(tokens).toHaveLength(1)
					expect(tokens[0]).toMatchObject(testToken)
				})
			})

			it("handles multiple tokens at the same pool address", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					const token2 = { ...testToken, address: "address2", symbol: "TEST2" }

					instance.insertToken(testToken)
					instance.insertToken(token2)

					const tokens = await instance.findAllTokens({ network: "zeko:testnet" })
					expect(tokens).toHaveLength(2)
				})
			})

			it("maintains separation between networks", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					instance.insertToken(testToken)
					instance.insertToken({ ...testToken, chainId: "mina:mainnet" as const })

					const testnetTokens = await instance.findAllTokens({ network: "zeko:testnet" })
					const mainnetTokens = await instance.findAllTokens({ network: "mina:mainnet" })

					expect(testnetTokens).toHaveLength(1)
					expect(mainnetTokens).toHaveLength(1)
				})
			})
		})

		describe("Token Queries", () => {
			it("can find token by symbol", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					insertTokens(instance)
					const tokens = await instance.findTokenBy({
						network: "zeko:testnet",
						by: "symbol",
						value: "TEST"
					})
					expect(tokens).toHaveLength(1)
					expect(tokens[0].symbol).toBe("TEST")
				})
			})

			it("can find token by address", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					insertTokens(instance)
					const tokens = await instance.findTokenBy({
						network: "zeko:testnet",
						by: "address",
						value: "tokenAddress"
					})
					expect(tokens).toHaveLength(1)
					expect(tokens[0].address).toBe("tokenAddress")
				})
			})

			it("Can count the number of tokens", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					insertTokens(instance)
					const count = await instance.countTokens({ network: "zeko:testnet" })
					expect(count).toBe(2)
				})
			})
		})

		describe("Token Existence", () => {
			it("correctly checks token existence", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					insertTokens(instance)
					const exists = await instance.tokenExists({
						network: "zeko:testnet",
						address: "tokenAddress"
					})
					expect(exists).toBe(true)

					const notExists = await instance.tokenExists({
						network: "zeko:testnet",
						address: "nonexistent"
					})
					expect(notExists).toBe(false)
				})
			})

			it("inserts token if it doesn't exist", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					const inserted = await instance.insertTokenIfExists({
						network: "zeko:testnet",
						address: "tokenAddress",
						token: testToken
					})
					if (typeof inserted === "boolean") throw new Error("Token was not inserted")
					expect(inserted[0]).toMatchObject(testToken)

					const exists = await instance.tokenExists({
						network: "zeko:testnet",
						address: "tokenAddress"
					})
					expect(exists).toBe(true)
				})
			})
		})

		describe("Error Handling", () => {
			it("handles duplicate primary keys", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					instance.insertToken(testToken)
					try {
						await instance.insertToken(testToken)
					} catch (e) {
						expect(e instanceof Error).toBe(true)
					}
				})
			})
		})
	})

	describe("Pool Management", () => {
		const testPool = {
			address: "testPoolAddress",
			token0Address: testToken0.address,
			token1Address: testToken1.address,
			chainId: "zeko:testnet" as const,
			tokenId: "testPoolTokenId",
			name: "TEST_POOL"
		}

		const insertPoolsWithTokens = async (instance: TokenList) => {
			await instance.insertToken([testToken0, testToken1])
			await instance.insertPool(testPool)
			await instance.insertPool({
				...testPool,
				address: "poolAddress2",
				token0Address: "token0Address2",
				token1Address: "token1Address2",
				name: "TEST_POOL2"
			})
		}

		describe("Pool Insertion", () => {
			it("can insert a pool and retrieve it", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					instance.insertPool(testPool)
					const pools = await instance.findAllPools({ network: "zeko:testnet" })
					expect(pools).toHaveLength(1)
					expect(pools[0]).toMatchObject(testPool)
				})
			})

			it("handles multiple pools with different addresses", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					insertPools(instance)
					const pools = await instance.findAllPools({ network: "zeko:testnet" })
					expect(pools).toHaveLength(2)
				})
			})

			it("maintains separation between networks", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					instance.insertPool(testPool)
					instance.insertPool({ ...testPool, chainId: "mina:mainnet" as const })

					const testnetPools = await instance.findAllPools({ network: "zeko:testnet" })
					const mainnetPools = await instance.findAllPools({ network: "mina:mainnet" })

					expect(testnetPools).toHaveLength(1)
					expect(mainnetPools).toHaveLength(1)
				})
			})
		})

		describe("Pool Queries", () => {
			it("can find pool by address", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					insertPools(instance)
					const pools = await instance.findPoolBy({
						network: "zeko:testnet",
						by: "address",
						value: "testPoolAddress"
					})
					expect(pools).toHaveLength(1)
					expect(pools[0].address).toBe("testPoolAddress")
				})
			})

			it("can find pools by token address", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					insertPools(instance)
					const pools = await instance.findPoolBy({
						network: "zeko:testnet",
						by: "tokenAddress",
						value: "tokenAddress"
					})
					expect(pools).toHaveLength(1)
					expect(pools[0].token0Address).toBe("tokenAddress")
				})
			})

			it("Can count the number of pools", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					insertPools(instance)
					const count = await instance.countPools({ network: "zeko:testnet" })
					expect(count).toBe(2)
				})
			})
		})

		describe("Pool Existence", () => {
			it("correctly checks pool existence", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					insertPools(instance)
					const exists = await instance.poolExists({
						network: "zeko:testnet",
						address: "testPoolAddress"
					})
					expect(exists).toBe(true)

					const notExists = await instance.poolExists({
						network: "zeko:testnet",
						address: "nonexistent"
					})
					expect(notExists).toBe(false)
				})
			})

			it("inserts pool if it doesn't exist", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					const inserted = await instance.insertPoolIfExists({
						network: "zeko:testnet",
						address: "testPoolAddress",
						pool: testPool
					})
					if (typeof inserted === "boolean") throw new Error("Pool was not inserted")
					expect(inserted[0]).toMatchObject(testPool)

					const exists = await instance.poolExists({
						network: "zeko:testnet",
						address: "testPoolAddress"
					})
					expect(exists).toBe(true)
				})
			})
		})

		describe("Pool with Token Data", () => {
			it("retrieves pool with associated tokens", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					await insertPoolsWithTokens(instance)
					const pools = await instance.findAllPools({ network: "zeko:testnet" })

					expect(pools[0].address).toBe(testPool.address)
					expect(pools[0].tokens).toHaveLength(2)
					expect(pools[0].tokens).toContainEqual(
						expect.objectContaining({
							address: testToken0.address,
							symbol: testToken0.symbol
						})
					)
					expect(pools[0].tokens).toContainEqual(
						expect.objectContaining({
							address: testToken1.address,
							symbol: testToken1.symbol
						})
					)
				})
			})

			it("finds pool by address with token data", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					await insertPoolsWithTokens(instance)
					const pools = await instance.findPoolBy({
						network: "zeko:testnet",
						by: "address",
						value: testPool.address
					})

					expect(pools).toHaveLength(1)
					expect(pools[0].address).toBe(testPool.address)
					expect(pools[0].tokens).toHaveLength(2)
					expect(pools[0].tokens[0].symbol).toBe(testToken0.symbol)
					expect(pools[0].tokens[1].symbol).toBe(testToken1.symbol)
				})
			})

			it("finds pool by token address with token data", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					await insertPoolsWithTokens(instance)
					const pools = await instance.findPoolBy({
						network: "zeko:testnet",
						by: "tokenAddress",
						value: testToken0.address
					})

					expect(pools).toHaveLength(1)
					expect(pools[0].token0Address).toBe(testToken0.address)
					expect(pools[0].tokens).toHaveLength(2)
					expect(pools[0].tokens).toContainEqual(
						expect.objectContaining({
							address: testToken0.address,
							symbol: testToken0.symbol
						})
					)
				})
			})

			it("handles pools with missing token data", async () => {
				await runInDurableObject(stub, async (instance: TokenList) => {
					// Insert pool without inserting tokens first
					await instance.insertPool(testPool)
					const pools = await instance.findAllPools({ network: "zeko:testnet" })

					expect(pools[0]).toBeDefined()
					expect(pools[0].tokens).toEqual([])
				})
			})
		})
	})

	describe("Reset Database", () => {
		it("resets tokens correctly", async () => {
			await runInDurableObject(stub, async (instance: TokenList) => {
				// Insert initial data
				await instance.insertToken([testToken0, testToken1])

				// Verify initial state
				const initialTokens = await instance.findAllTokens({ network: "zeko:testnet" })
				expect(initialTokens).toHaveLength(2)

				// Reset
				await instance.reset({ network: "zeko:testnet" })

				// Verify tokens are removed
				const tokensAfterReset = await instance.findAllTokens({ network: "zeko:testnet" })
				expect(tokensAfterReset).toHaveLength(0)
			})
		})

		it("resets pools correctly", async () => {
			await runInDurableObject(stub, async (instance: TokenList) => {
				// Insert initial data
				await instance.insertPool(testPool)

				// Verify initial state
				const initialPools = await instance.findAllPools({ network: "zeko:testnet" })
				expect(initialPools).toHaveLength(1)

				// Reset
				await instance.reset({ network: "zeko:testnet" })

				// Verify pools are removed
				const poolsAfterReset = await instance.findAllPools({ network: "zeko:testnet" })
				expect(poolsAfterReset).toHaveLength(0)
			})
		})

		it("resets both pools and tokens", async () => {
			await runInDurableObject(stub, async (instance: TokenList) => {
				// Insert initial data
				await instance.insertToken([testToken0, testToken1])
				await instance.insertPool(testPool)

				// Verify initial state
				const initialTokens = await instance.findAllTokens({ network: "zeko:testnet" })
				const initialPools = await instance.findAllPools({ network: "zeko:testnet" })
				expect(initialTokens).toHaveLength(2)
				expect(initialPools).toHaveLength(1)

				// Reset
				await instance.reset({ network: "zeko:testnet" })

				// Verify both tokens and pools are removed
				const tokensAfterReset = await instance.findAllTokens({ network: "zeko:testnet" })
				const poolsAfterReset = await instance.findAllPools({ network: "zeko:testnet" })
				expect(tokensAfterReset).toHaveLength(0)
				expect(poolsAfterReset).toHaveLength(0)
			})
		})

		it("only resets data for the specified network", async () => {
			await runInDurableObject(stub, async (instance: TokenList) => {
				// Insert data in multiple networks
				await instance.insertToken([testToken0, { ...testToken1, chainId: "mina:mainnet" }])
				await instance.insertPool([testPool, { ...testPool, chainId: "mina:mainnet" }])

				// Reset only testnet
				await instance.reset({ network: "zeko:testnet" })

				// Verify testnet data is removed
				const testnetTokens = await instance.findAllTokens({ network: "zeko:testnet" })
				const testnetPools = await instance.findAllPools({ network: "zeko:testnet" })
				expect(testnetTokens).toHaveLength(0)
				expect(testnetPools).toHaveLength(0)

				// Verify mainnet data remains
				const mainnetTokens = await instance.findAllTokens({ network: "mina:mainnet" })
				const mainnetPools = await instance.findAllPools({ network: "mina:mainnet" })
				expect(mainnetTokens).toHaveLength(1)
				expect(mainnetPools).toHaveLength(1)
			})
		})
	})
})
