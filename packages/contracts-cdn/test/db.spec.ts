import { env, runInDurableObject } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import type { TokenList } from "../src/do"

const id = env.TOKENLIST.idFromName("/path")
const stub = env.TOKENLIST.get(id)

const testToken = {
	address: "testAddress",
	poolAddress: "testPoolAddress",
	tokenId: "testTokenId",
	symbol: "TEST",
	decimals: 9
}

const insertTokens = (instance: TokenList) => {
	instance.insertToken("mina:berkeley", testToken)
	instance.insertToken("mina:berkeley", {
		...testToken,
		poolAddress: "testPoolAddress2",
		address: "address2",
		symbol: "TEST2"
	})
}

describe("Read and write to the DO database", () => {
	describe("Token Insertion", () => {
		it("can insert a token and retrieve it", async () => {
			await runInDurableObject(stub, (instance: TokenList) => {
				instance.insertToken("mina:berkeley", testToken)

				const tokens = instance.findAllTokens({ network: "mina:berkeley" })
				expect(tokens).toHaveLength(1)
				expect(tokens[0]).toMatchObject(testToken)
			})
		})

		it("handles multiple tokens at the same pool address", async () => {
			await runInDurableObject(stub, (instance: TokenList) => {
				const token2 = { ...testToken, address: "address2", symbol: "TEST2" }

				instance.insertToken("mina:berkeley", testToken)
				instance.insertToken("mina:berkeley", token2)

				const tokens = instance.findAllTokens({ network: "mina:berkeley" })
				expect(tokens).toHaveLength(2)
			})
		})

		it("maintains separation between networks", async () => {
			await runInDurableObject(stub, (instance: TokenList) => {
				instance.insertToken("mina:berkeley", testToken)
				instance.insertToken("mina:mainnet", testToken)

				const testnetTokens = instance.findAllTokens({ network: "mina:berkeley" })
				const mainnetTokens = instance.findAllTokens({ network: "mina:mainnet" })

				expect(testnetTokens).toHaveLength(1)
				expect(mainnetTokens).toHaveLength(1)
			})
		})
	})

	describe("Token Queries", () => {
		it("can find token by symbol", async () => {
			await runInDurableObject(stub, (instance: TokenList) => {
				insertTokens(instance)
				const tokens = instance.findTokenBy({
					network: "mina:berkeley",
					by: "symbol",
					value: "TEST"
				})
				expect(tokens).toHaveLength(1)
				expect(tokens[0].symbol).toBe("TEST")
			})
		})

		it("can find token by address", async () => {
			await runInDurableObject(stub, (instance: TokenList) => {
				insertTokens(instance)
				const tokens = instance.findTokenBy({
					network: "mina:berkeley",
					by: "address",
					value: "testAddress"
				})
				expect(tokens).toHaveLength(1)
				expect(tokens[0].address).toBe("testAddress")
			})
		})

		it("can find token by poolAddress", async () => {
			await runInDurableObject(stub, (instance: TokenList) => {
				insertTokens(instance)
				const tokens = instance.findTokenBy({
					network: "mina:berkeley",
					by: "poolAddress",
					value: "testPoolAddress"
				})
				expect(tokens).toHaveLength(1)
				expect(tokens[0].poolAddress).toBe("testPoolAddress")
			})
		})

		it("correctly checks token existence", async () => {
			await runInDurableObject(stub, (instance: TokenList) => {
				insertTokens(instance)
				const exists = instance.tokenExists({
					network: "mina:berkeley",
					address: "testAddress",
					poolAddress: "testPoolAddress"
				})
				expect(exists).toBe(true)

				const notExists = instance.tokenExists({
					network: "mina:berkeley",
					address: "nonexistent",
					poolAddress: "nonexistent"
				})
				expect(notExists).toBe(false)
			})
		})

		it("Can count the number of tokens", async () => {
			await runInDurableObject(stub, (instance: TokenList) => {
				insertTokens(instance)
				const count = instance.count({ network: "mina:berkeley" })
				expect(count).toBe(2)
			})
		})
	})

	describe("Error Handling", () => {
		it("handles duplicate primary keys", async () => {
			await runInDurableObject(stub, (instance: TokenList) => {
				instance.insertToken("mina:berkeley", testToken)
				try {
					instance.insertToken("mina:berkeley", testToken)
				} catch (e) {
					expect(e instanceof Error).toBe(true)
				}
			})
		})
	})
})
