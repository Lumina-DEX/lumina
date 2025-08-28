"use client"
import type { LuminaPool, LuminaToken } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { useCallback, useContext, useEffect } from "react"
import { toTokenId } from "@/utils/addresses"
import { LuminaContext } from "./Layout"

const Balance = ({ token }: { token: LuminaToken | LuminaPool }) => {
	const { Wallet } = useContext(LuminaContext)
	const walletContext = useSelector(Wallet, (state) => state.context)
	const balance = useSelector(
		Wallet,
		(state) =>
			state.context.balances[state.context.currentNetwork][toTokenId(token?.address)]?.balance ?? 0
	)

	const getBalance = useCallback(() => {
		if (token?.address) {
			const tokenId = toTokenId(token.address)
			const data = {
				address: token.address,
				decimal: "decimals" in token ? 10 ** token.decimals : 10 ** 9,
				tokenId: tokenId,
				symbol: "symbol" in token ? token.symbol : "LUM"
			}

			Wallet.send({
				type: "FetchBalance",
				network: walletContext.currentNetwork,
				tokens: [data]
			})
		}
	}, [token, walletContext.currentNetwork, Wallet])

	useEffect(() => {
		getBalance()
		const intervalID = setInterval(() => {
			getBalance()
		}, 10_000)

		return () => clearInterval(intervalID)
	}, [getBalance])
	return <span>{balance.toFixed(2).toString()}</span>
}

export default Balance
