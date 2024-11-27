import { ZKFACTORY_ADDRESS } from "@/components/Layout"
import { fetchAccount, fetchEvents, Field, Mina, PublicKey } from "o1js"

export const poolToka = "B62qjmz2oEe8ooqBmvj3a6fAbemfhk61rjxTYmUMP9A6LPdsBLmRAxK"
//export const poolWeth = "B62qphnhqrRW6DFFR39onHNKnBcoB9Gqi3M8Emytg26nwZWUYXR1itw";

export class Addresses {
	private static list = []

	private static listZeko = []

	private static listDevnet = []

	public static async getList() {
		if (Addresses.list.length) {
			return Addresses.list
		}
		const listToken = await fetch("/token-list.json")
		const data = await listToken.json()
		Addresses.list = data
		return Addresses.list
	}

	public static async getEventList(isZeko) {
		if (isZeko && Addresses.listZeko.length) {
			return Addresses.listZeko
		}

		if (!isZeko && Addresses.listDevnet.length) {
			return Addresses.listDevnet
		}

		if (isZeko) {
			const zeko = Mina.Network({
				networkId: "testnet",
				mina: "https://devnet.zeko.io/graphql",
				archive: "https://devnet.zeko.io/graphql"
			})
			Mina.setActiveInstance(zeko)
		} else {
			const devnet = Mina.Network({
				networkId: "testnet",
				mina: window.location.origin + "/api/proxy",
				archive: "https://api.minascan.io/archive/devnet/v1/graphql"
			})
			Mina.setActiveInstance(devnet)
		}

		const events = await fetchEvents({ publicKey: ZKFACTORY_ADDRESS })
		console.log("events", events)
		const newList = []
		if (events?.length) {
			const tokenList = await this.getList()

			for (let index = 0; index < events.length; index++) {
				const x = events[index]
				const data = x.events[0].data
				const poolAddress = PublicKey.fromFields([Field.from(data[2]), Field.from(data[3])])
				const tokenAddress = PublicKey.fromFields([Field.from(data[4]), Field.from(data[5])])
				const tokenAccount = await fetchAccount({ publicKey: tokenAddress })
				const symbol = tokenAccount?.account?.tokenSymbol

				// @ts-ignore
				const alreadyExist = tokenList?.tokens?.find((z) => z.address === tokenAddress.toBase58())

				if (!alreadyExist) {
					newList.push({
						address: tokenAddress.toBase58(),
						poolAddress: poolAddress.toBase58(),
						chainId: isZeko ? "zeko-devnet" : "mina-devnet",
						symbol: symbol,
						decimals: 9
					})
				}
			}
		}
		console.log("list", newList)
		if (isZeko) {
			Addresses.listZeko = newList
			return Addresses.listZeko
		}

		if (!isZeko) {
			Addresses.listDevnet = newList
			return Addresses.listDevnet
		}
	}
}
