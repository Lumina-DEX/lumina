import { ZKFACTORY_ADDRESS } from "@/components/Layout"
import { fetchAccount, fetchEvents, Field, Mina, PublicKey } from "o1js"
import {
	fetchPoolTokenList,
	internal_fetchAllTokensFromPoolFactory,
	Networks
} from "@lumina-dex/sdk"

export const poolToka = "B62qq47Pu4rmDAs86jRLcwDRD3XDheJU9dmRq5pfSpfWYi2aY7b1KNH"
export const toka = "B62qn71xMXqLmAT83rXW3t7jmnEvezaCYbcnb9NWYz85GTs41VYGDha"

//export const poolWeth = "B62qphnhqrRW6DFFR39onHNKnBcoB9Gqi3M8Emytg26nwZWUYXR1itw";

export class Addresses {
	private static listFromCDN = []
	private static listFromEvent = []
	private static currentNetworkEvent = "mina:devnet"
	private static currentNetworkCDN = "mina:devnet"

	public static async getList(network: Networks) {
		if (Addresses.currentNetworkCDN === network && Addresses.listFromCDN.length) {
			return Addresses.listFromCDN
		}
		const data = await fetchPoolTokenList(network)
		console.log("list from cdn", data)
		const tokenA = {
			address: "B62qn71xMXqLmAT83rXW3t7jmnEvezaCYbcnb9NWYz85GTs41VYGDha",
			poolAddress: "B62qq47Pu4rmDAs86jRLcwDRD3XDheJU9dmRq5pfSpfWYi2aY7b1KNH",
			tokenId: "wZmPhCrDVraeYcB3By5USJCJ9KCMLYYp497Zuby2b8Rq3wTcbn",
			symbol: "TokenA",
			decimals: 9,
			timestamp: "2025-03-12 00:00:26",
			chainId: "mina:devnet"
		}
		Addresses.listFromCDN = [tokenA].concat(data.tokens)
		this.currentNetworkCDN = network
		return Addresses.listFromCDN
	}

	public static async getEventList(network: Networks) {
		if (Addresses.currentNetworkEvent === network && Addresses.listFromEvent.length) {
			return Addresses.listFromEvent
		}

		const data = await fetchPoolTokenList(network)
		const newList = data.tokens
		console.log("list from event", data)
		Addresses.listFromEvent = newList
		this.currentNetworkEvent = network
		return Addresses.listFromEvent
	}
}
