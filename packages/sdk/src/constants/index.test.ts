import { describe, expect, it } from "vitest"
import { poolCreationUrls } from "."

describe("poolCreationUrls", () => {
	it("routes mina:mainnet to mainnet signer", () => {
		expect(poolCreationUrls["mina:mainnet"]).toBe("https://mina-mainnet.signer.luminadex.com/graphql")
	})

	it("routes mina:devnet to testnet signer", () => {
		expect(poolCreationUrls["mina:devnet"]).toBe("https://zeko-testnet.signer.luminadex.com/graphql")
	})

	it("routes zeko:testnet to testnet signer", () => {
		expect(poolCreationUrls["zeko:testnet"]).toBe("https://zeko-testnet.signer.luminadex.com/graphql")
	})

	it("marks zeko:mainnet as not implemented", () => {
		expect(poolCreationUrls["zeko:mainnet"]).toBe("NOT_IMPLEMENTED")
	})
})
