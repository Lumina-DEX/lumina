import { ZKFACTORY_ADDRESS } from "@/components/Layout"
import { fetchAccount, fetchEvents, Field, Mina, PublicKey } from "o1js"
import { fetchPoolTokenList } from "@lumina-dex/sdk"

export const poolToka = "B62qq47Pu4rmDAs86jRLcwDRD3XDheJU9dmRq5pfSpfWYi2aY7b1KNH"
export const toka = "B62qn71xMXqLmAT83rXW3t7jmnEvezaCYbcnb9NWYz85GTs41VYGDha"

//export const poolWeth = "B62qphnhqrRW6DFFR39onHNKnBcoB9Gqi3M8Emytg26nwZWUYXR1itw";

export class Addresses {
	private static listFromCDN = []
	private static listFromEvent = []
	private static currentNetworkEvent = "mina:devnet"
	private static currentNetworkCDN = "mina:devnet"

	public static async getList(network: string) {
		if (Addresses.currentNetworkCDN === network && Addresses.listFromCDN.length) {
			return Addresses.listFromCDN
		}
		const data = await fetchPoolTokenList(network)
		console.log("list from cdn", data)
		Addresses.listFromCDN = data.tokens
		this.currentNetworkCDN = network
		return Addresses.listFromCDN
	}

	public static async getEventList(network: string) {
		if (Addresses.currentNetworkEvent === network && Addresses.listFromEvent.length) {
			return Addresses.listFromEvent
		}

		const data = await fetchPoolTokenList(network)
		const newList = data.tokens

		Addresses.listFromEvent = newList
		this.currentNetworkEvent = network
		return Addresses.listFromEvent
	}
}
