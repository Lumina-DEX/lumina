import type { Networks } from "@lumina-dex/sdk"

const ALL_NETWORKS: Networks[] = ["mina:mainnet", "mina:devnet", "zeko:testnet", "zeko:mainnet"]

const ENVIRONMENT_MAP: Record<string, Networks[]> = {
	"mina-mainnet": ["mina:mainnet"],
	"zeko-testnet": ["mina:devnet", "zeko:testnet"],
	"zeko-mainnet": ["zeko:mainnet"]
}

export function resolveAllowedNetworks(environment?: string): Networks[] {
	if (!environment) return ALL_NETWORKS
	return ENVIRONMENT_MAP[environment] ?? []
}

export function validateNetwork(queryNetwork: Networks, allowedNetworks: Networks[]): void {
	if (!allowedNetworks.includes(queryNetwork)) {
		throw new Error(`Network "${queryNetwork}" is not allowed on this server. Allowed: ${allowedNetworks.join(", ")}`)
	}
}
