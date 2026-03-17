import type { Networks } from "@lumina-dex/sdk"

const ALL_NETWORKS: Networks[] = ["mina:mainnet", "mina:devnet", "zeko:testnet", "zeko:mainnet"]

const HOSTNAME_RULES: Array<{ pattern: string; networks: Networks[] }> = [
	{ pattern: "mainnet", networks: ["mina:mainnet"] },
	{ pattern: "testnet", networks: ["mina:devnet", "zeko:testnet"] }
]

export function resolveAllowedNetworks(hostname?: string): Networks[] {
	if (!hostname) return ALL_NETWORKS
	const host = hostname.split(":")[0]
	if (host === "localhost" || host === "127.0.0.1") return ALL_NETWORKS
	for (const rule of HOSTNAME_RULES) {
		if (host.includes(rule.pattern)) return rule.networks
	}
	return ALL_NETWORKS
}

export function validateNetwork(queryNetwork: Networks, allowedNetworks: Networks[]): void {
	if (!allowedNetworks.includes(queryNetwork)) {
		throw new Error(`Network "${queryNetwork}" is not allowed on this server. Allowed: ${allowedNetworks.join(", ")}`)
	}
}
