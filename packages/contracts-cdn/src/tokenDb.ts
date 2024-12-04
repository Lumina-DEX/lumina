import type { TokenDbList } from "@lumina-dex/sdk"

const version = { major: 1, minor: 0, patch: 0 }
const keywords = ["uniswap", "default", "list"]

export const minaTestnet = (): TokenDbList => ({
	name: "Mina alpha",
	timestamp: new Date().toJSON(),
	version,
	keywords,
	tokens: [
		{
			address: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
			poolAddress: "B62qjmz2oEe8ooqBmvj3a6fAbemfhk61rjxTYmUMP9A6LPdsBLmRAxK",
			chainId: "mina:testnet",
			tokenId: "wTRtTRnW7hZCQSVgsuMVJRvnS1xEAbRRMWyaaJPkQsntSNh67n",
			name: "Toka test token",
			symbol: "TOKA",
			decimals: 9
		},
		{
			address: "B62qqKNnNRpCtgcBexw5khZSpk9K2d9Z7Wzcyir3WZcVd15Bz8eShVi",
			poolAddress: "B62qkrzCSQXVgjaWBc2evMGne2KMnx62MYFXdtQGKVc9G8eBQ1KYhk1",
			chainId: "mina:tesnet",
			tokenId: "yBtcFk2EJTBJh7Ubjbw7oeAmiPjSTNKbtSVHd1f7voV39HQaWK",
			name: "Wrapped ether",
			symbol: "WETH",
			decimals: 9
		}
	]
})
