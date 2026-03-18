import type { Networks } from "@lumina-dex/sdk"

const ALL_NETWORKS: Networks[] = ["mina:mainnet", "mina:devnet", "zeko:testnet", "zeko:mainnet"]

const HOSTNAME_MAP: Record<string, Networks[]> = {
	"mina-mainnet": ["mina:mainnet"],
	"zeko-testnet": ["mina:devnet", "zeko:testnet"]
}

export function resolveAllowedNetworks(hostname?: string): Networks[] {
	if (!hostname) return ALL_NETWORKS
	const host = hostname.split(":")[0]
	if (host === "localhost" || host === "127.0.0.1") return ALL_NETWORKS
	for (const [prefix, networks] of Object.entries(HOSTNAME_MAP)) {
		if (host.startsWith(prefix)) return networks
	}
	return []
}

export function validateNetwork(queryNetwork: Networks, allowedNetworks: Networks[]): void {
	if (!allowedNetworks.includes(queryNetwork)) {
		throw new Error(`Network "${queryNetwork}" is not allowed on this server. Allowed: ${allowedNetworks.join(", ")}`)
	}
}
