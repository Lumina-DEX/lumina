"use client"
import React, { useContext, useEffect, useMemo, useState } from "react"
// @ts-ignore
import { LuminaPool, LuminaToken, Networks, PublicKey, TokenId } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { LuminaContext } from "./Layout"
import { toTokenId } from "@/utils/addresses"

// @ts-ignore
const Balance = ({ token, pool }: { token: LuminaToken | LuminaPool }) => {
	const { Wallet, Dex } = useContext(LuminaContext)
	const walletState = useSelector(Wallet, (state) => state.value)
	const walletContext = useSelector(Wallet, (state) => state.context)
	const balance = useSelector(
		Wallet,
		(state) =>
			state.context.balances[state.context.currentNetwork][toTokenId(token?.address)]?.balance ?? 0
	)

	useEffect(() => {
		getBalance()
		const intervalID = setInterval(() => {
			getBalance()
		}, 10000)

		return () => clearInterval(intervalID)
	}, [token])

	const getBalance = async () => {
		if (token?.address) {
			const tokenId = toTokenId(token.address)
			let data = {
				address: token.address,
				decimal: "decimals" in token ? 10 ** token.decimals : 10 ** 9,
				tokenId: tokenId,
				symbol: "symbol" in token ? token.symbol : "LUM"
			}

			setTimeout(
				() => {
					Wallet.send({
						type: "FetchBalance",
						network: walletContext.currentNetwork,
						tokens: [data]
					})
				},
				"decimals" in token ? 100 : 2000
			)
		}
	}

	return (
		<>
			<span>{balance.toFixed(2).toString()}</span>
		</>
	)
}

export default Balance
