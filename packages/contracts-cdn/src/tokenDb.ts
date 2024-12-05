import type { TokenDbList } from "@lumina-dex/sdk"
import { data } from "../generated/mina:testnet"

const version = { major: 1, minor: 0, patch: 0 }
const keywords = ["uniswap", "default", "list"]

export const minaTestnet = (): TokenDbList => {
	data.push({
		address: "B62qqKNnNRpCtgcBexw5khZSpk9K2d9Z7Wzcyir3WZcVd15Bz8eShVi",
		poolAddress: "B62qkrzCSQXVgjaWBc2evMGne2KMnx62MYFXdtQGKVc9G8eBQ1KYhk1",
		chainId: "mina:tesnet",
		tokenId: "yBtcFk2EJTBJh7Ubjbw7oeAmiPjSTNKbtSVHd1f7voV39HQaWK",
		symbol: "WETH",
		decimals: 9
	})
	return {
		name: "Mina alpha",
		timestamp: new Date().toJSON(),
		version,
		keywords,
		tokens: data
	}
}
