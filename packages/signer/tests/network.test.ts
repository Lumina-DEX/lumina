import { describe, expect, it } from "vitest"
import { resolveAllowedNetworks, validateNetwork } from "../src/helpers/network"

describe("resolveAllowedNetworks", () => {
	it("returns mainnet networks for mina-mainnet", () => {
		expect(resolveAllowedNetworks("mina-mainnet")).toEqual(["mina:mainnet"])
	})

	it("returns testnet networks for zeko-testnet", () => {
		expect(resolveAllowedNetworks("zeko-testnet")).toEqual(["mina:devnet", "zeko:testnet"])
	})

	it("returns zeko mainnet networks for zeko-mainnet", () => {
		expect(resolveAllowedNetworks("zeko-mainnet")).toEqual(["zeko:mainnet"])
	})

	it("returns all networks when environment is undefined (local dev)", () => {
		expect(resolveAllowedNetworks(undefined)).toEqual(["mina:mainnet", "mina:devnet", "zeko:testnet", "zeko:mainnet"])
	})

	it("returns empty array for unknown environment (deny by default)", () => {
		expect(resolveAllowedNetworks("unknown-env")).toEqual([])
	})
})

describe("validateNetwork", () => {
	const mainnetOnly = resolveAllowedNetworks("mina-mainnet")
	const testnetOnly = resolveAllowedNetworks("zeko-testnet")

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

	it("throws for any network on unknown environment (deny by default)", () => {
		const empty = resolveAllowedNetworks("unknown-env")
		expect(() => validateNetwork("mina:mainnet", empty)).toThrow()
		expect(() => validateNetwork("mina:devnet", empty)).toThrow()
	})
})
