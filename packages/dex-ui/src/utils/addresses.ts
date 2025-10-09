import { MINA_ADDRESS, type LuminaToken } from "@lumina-dex/sdk"
import { PublicKey, TokenId } from "o1js"
export const poolToka = "B62qjGGHziBe9brhAC4zkvQa2dyN7nisKnAhKC7rasGFtW31GiuTZoY"
export const toka = "B62qn71xMXqLmAT83rXW3t7jmnEvezaCYbcnb9NWYz85GTs41VYGDha"
export const emptyAddress = "B62qiTKpEPjGTSHZrtM8uXiKgn8So916pLmNJKDhKeyBQL9TDb3nvBG"

export const tokenA: LuminaToken = {
	address: toka,
	chainId: "mina:devnet",
	tokenId: "wZmPhCrDVraeYcB3By5USJCJ9KCMLYYp497Zuby2b8Rq3wTcbn",
	symbol: "TokenA",
	decimals: 9
}

export const mina: LuminaToken = {
	address: MINA_ADDRESS,
	chainId: "mina:devnet",
	tokenId: "0",
	symbol: "MINA",
	decimals: 9
}

export function toTokenId(address: string): string {
	try {
		const tokenIdPool = TokenId.derive(PublicKey.fromBase58(address))
		return TokenId.toBase58(tokenIdPool)
	} catch {
		return ""
	}
}
