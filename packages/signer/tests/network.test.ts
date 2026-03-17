import { describe, expect, it } from "vitest"
import { resolveAllowedNetworks, validateNetwork } from "../src/helpers/network"

describe("resolveAllowedNetworks", () => {
	it("returns mainnet networks for mina-mainnet hostname", () => {
		expect(resolveAllowedNetworks("mina-mainnet.signer.luminadex.com")).toEqual(["mina:mainnet"])
	})

	it("returns testnet networks for zeko-testnet hostname", () => {
		expect(resolveAllowedNetworks("zeko-testnet.signer.luminadex.com")).toEqual(["mina:devnet", "zeko:testnet"])
	})

	it("returns all networks for localhost", () => {
		expect(resolveAllowedNetworks("localhost")).toEqual(["mina:mainnet", "mina:devnet", "zeko:testnet", "zeko:mainnet"])
	})

	it("returns all networks for localhost with port", () => {
		expect(resolveAllowedNetworks("localhost:3001")).toEqual([
			"mina:mainnet",
			"mina:devnet",
			"zeko:testnet",
			"zeko:mainnet"
		])
	})

	it("returns all networks for undefined hostname", () => {
		expect(resolveAllowedNetworks(undefined)).toEqual(["mina:mainnet", "mina:devnet", "zeko:testnet", "zeko:mainnet"])
	})
})

describe("validateNetwork", () => {
	it("does not throw for mina:mainnet on mainnet hostname", () => {
		expect(() => validateNetwork("mina:mainnet", "mina-mainnet.signer.luminadex.com")).not.toThrow()
	})

	it("throws for mina:devnet on mainnet hostname", () => {
		expect(() => validateNetwork("mina:devnet", "mina-mainnet.signer.luminadex.com")).toThrow()
	})

	it("does not throw for zeko:testnet on testnet hostname", () => {
		expect(() => validateNetwork("zeko:testnet", "zeko-testnet.signer.luminadex.com")).not.toThrow()
	})

	it("does not throw for mina:devnet on testnet hostname (same proving keys)", () => {
		expect(() => validateNetwork("mina:devnet", "zeko-testnet.signer.luminadex.com")).not.toThrow()
	})

	it("throws for mina:mainnet on testnet hostname", () => {
		expect(() => validateNetwork("mina:mainnet", "zeko-testnet.signer.luminadex.com")).toThrow()
	})
})
