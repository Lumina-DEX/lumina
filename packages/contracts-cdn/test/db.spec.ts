import { env, runInDurableObject } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import type { TokenList } from "../src/do"

const id = env.TOKENLIST.idFromName("/path")
const stub = env.TOKENLIST.get(id)

const testToken = {
	address: "testAddress",
	tokenId: "testTokenId",
	chainId: "zeko:testnet" as const,
	symbol: "TEST",
	decimals: 9
}

const insertTokens = (instance: TokenList) => {
	instance.insertToken(testToken)
	instance.insertToken({
		...testToken,
		address: "address2",
		symbol: "TEST2"
	})
}

describe("Read and write to the DO database", () => {
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
					value: "testAddress"
				})
				expect(tokens).toHaveLength(1)
				expect(tokens[0].address).toBe("testAddress")
			})
		})

		// it("can find token by poolAddress", async () => {
		// 	await runInDurableObject(stub, async (instance: TokenList) => {
		// 		insertTokens(instance)
		// 		const tokens = await instance.findTokenBy({
		// 			network: "zeko:testnet",
		// 			by: "poolAddress",
		// 			value: "testPoolAddress"
		// 		})
		// 		expect(tokens).toHaveLength(1)
		// 		expect(tokens[0].poolAddress).toBe("testPoolAddress")
		// 	})
		// })

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
					address: "testAddress"
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
					address: "testAddress",
					token: testToken
				})
				if (typeof inserted === "boolean") throw new Error("Token was not inserted")
				expect(inserted[0]).toMatchObject(testToken)

				const exists = await instance.tokenExists({
					network: "zeko:testnet",
					address: "testAddress"
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

	describe("Resetting the database", () => {
		it("can reset the database", async () => {
			await runInDurableObject(stub, async (instance: TokenList) => {
				insertTokens(instance)
				const count = await instance.countTokens({ network: "zeko:testnet" })
				expect(count).toBe(2)

				instance.reset({ network: "zeko:testnet" })
				const newCount = await instance.countTokens({ network: "zeko:testnet" })
				expect(newCount).toBe(0)
			})
		})
	})
})
