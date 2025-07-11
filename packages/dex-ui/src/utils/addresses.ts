import {
	fetchAllPoolsFromPoolFactory,
	fetchPoolList,
	fetchTokenList,
	LuminaPool,
	LuminaToken,
	Networks
} from "@lumina-dex/sdk"

export const poolToka = "B62qjGGHziBe9brhAC4zkvQa2dyN7nisKnAhKC7rasGFtW31GiuTZoY"
export const toka = "B62qn71xMXqLmAT83rXW3t7jmnEvezaCYbcnb9NWYz85GTs41VYGDha"

export const tokenA: LuminaToken = {
	address: toka,
	chainId: "mina:devnet",
	tokenId: "wZmPhCrDVraeYcB3By5USJCJ9KCMLYYp497Zuby2b8Rq3wTcbn",
	symbol: "TokenA",
	decimals: 9
}

//export const poolWeth = "B62qphnhqrRW6DFFR39onHNKnBcoB9Gqi3M8Emytg26nwZWUYXR1itw";

export class Addresses {
	private static listFromCDN: LuminaPool[] = []
	private static listFromEvent: LuminaPool[] = []
	private static currentNetworkEvent = "mina:devnet"
	private static currentNetworkCDN = "mina:devnet"

	public static async getList(network: Networks) {
		if (Addresses.currentNetworkCDN === network && Addresses.listFromCDN.length) {
			return Addresses.listFromCDN
		}
		const data = await fetchPoolList(network)
		console.log("list from cdn", data)
		Addresses.listFromCDN = data
		this.currentNetworkCDN = network
		return Addresses.listFromCDN
	}

	public static async getEventList(network: Networks) {
		if (Addresses.currentNetworkEvent === network && Addresses.listFromEvent.length) {
			return Addresses.listFromEvent
		}

		const data = await fetchAllPoolsFromPoolFactory({
			network
		})
		const newList = data
		console.log("list from event", data)
		Addresses.listFromEvent = Array.from(newList.pools.values())
		this.currentNetworkEvent = network
		return Addresses.listFromEvent
	}
}
