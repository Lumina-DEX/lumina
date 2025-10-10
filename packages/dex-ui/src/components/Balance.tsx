"use client"
import { type LuminaPool, type LuminaToken, MINA_ADDRESS } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { useContext, useEffect } from "react"
import { emptyAddress, toTokenId } from "@/utils/addresses"
import { LuminaContext } from "./Layout"

const Balance = ({ token }: { token: LuminaToken | LuminaPool }) => {
	const { Wallet } = useContext(LuminaContext)
	const walletContext = useSelector(Wallet, (state) => state.context)
	const balance = useSelector(Wallet, (state) => {
		const tokenId =
			token?.address === MINA_ADDRESS || token?.address === emptyAddress ? "MINA" : toTokenId(token?.address)
		return state.context.balances[state.context.currentNetwork][tokenId]?.balance ?? 0
	})

	//Fetch balance on load and every 10 seconds
	useEffect(() => {
		const fetchBalance = () => {
			if (token?.address) {
				Wallet.send({
					type: "FetchBalance",
					network: walletContext.currentNetwork,
					tokens: [
						{
							address: token.address,
							decimal: "decimals" in token ? 10 ** token.decimals : 10 ** 9,
							tokenId: toTokenId(token.address),
							symbol: "symbol" in token ? token.symbol : "LUM"
						}
					]
				})
			}
		}
		fetchBalance()
		const intervalID = setInterval(fetchBalance, 10_000)
		return () => clearInterval(intervalID)
	}, [Wallet, token, walletContext.currentNetwork])

	return <span>{balance.toFixed(2).toString()}</span>
}

export default Balance
