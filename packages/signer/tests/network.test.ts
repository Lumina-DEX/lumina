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

	it("returns empty array for unknown hostname (deny by default)", () => {
		expect(resolveAllowedNetworks("unknown.example.com")).toEqual([])
	})
})

describe("validateNetwork", () => {
	const mainnetOnly = resolveAllowedNetworks("mina-mainnet.signer.luminadex.com")
	const testnetOnly = resolveAllowedNetworks("zeko-testnet.signer.luminadex.com")

	it("does not throw for mina:mainnet on mainnet server", () => {
		expect(() => validateNetwork("mina:mainnet", mainnetOnly)).not.toThrow()
	})

	it("throws for mina:devnet on mainnet server", () => {
		expect(() => validateNetwork("mina:devnet", mainnetOnly)).toThrow()
	})

	it("does not throw for zeko:testnet on testnet server", () => {
		expect(() => validateNetwork("zeko:testnet", testnetOnly)).not.toThrow()
	})

	it("does not throw for mina:devnet on testnet server (same proving keys)", () => {
		expect(() => validateNetwork("mina:devnet", testnetOnly)).not.toThrow()
	})

	it("throws for mina:mainnet on testnet server", () => {
		expect(() => validateNetwork("mina:mainnet", testnetOnly)).toThrow()
	})

	it("throws for any network on unknown hostname (deny by default)", () => {
		const empty = resolveAllowedNetworks("unknown.example.com")
		expect(() => validateNetwork("mina:mainnet", empty)).toThrow()
		expect(() => validateNetwork("mina:devnet", empty)).toThrow()
	})
})
