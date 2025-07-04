"use client"
import React, { useContext, useEffect, useMemo, useState } from "react"
// @ts-ignore
import { LuminaPool, LuminaToken, Networks, PublicKey, TokenId } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { LuminaContext } from "./Layout"

// @ts-ignore
const Balance = ({ token, pool }: { token: LuminaToken; pool?: LuminaPool }) => {
	const { Wallet, Dex } = useContext(LuminaContext)
	const walletState = useSelector(Wallet, (state) => state.value)
	const walletContext = useSelector(Wallet, (state) => state.context)
	const [balance, setBalance] = useState("0.0")

	useEffect(() => {
		getBalance()
		const intervalID = setInterval(() => {
			getBalance()
		}, 10000)

		return () => clearInterval(intervalID)
	}, [token])

	const getBalance = async () => {
		if (token && token.decimals) {
			let data = {
				address: token.address,
				decimal: 10 ** token.decimals,
				tokenId: token.tokenId,
				symbol: token.symbol
			}

			if (pool) {
				const tokenIdPool = TokenId.derive(PublicKey.fromBase58(pool.address))
				data.address = pool.address
				data.tokenId = TokenId.toBase58(tokenIdPool)
				data.symbol = "LUM"
				data.decimal = 10 ** 9
			}
			setTimeout(
				() => {
					console.log({
						type: "FetchBalance",
						network: walletContext.currentNetwork,
						tokens: [data]
					})
					Wallet.send({
						type: "FetchBalance",
						network: walletContext.currentNetwork,
						tokens: [data]
					})
				},
				pool ? 2000 : 100
			)
		}
	}

	useEffect(() => {
		let tokenId = token.tokenId
		if (pool) {
			const tokenIdPool = TokenId.derive(PublicKey.fromBase58(pool.address))
			tokenId = TokenId.toBase58(tokenIdPool)
		}
		if (walletContext?.currentNetwork && tokenId) {
			const tokenBalance = walletContext.balances[walletContext.currentNetwork][tokenId]
			if (tokenBalance && tokenBalance.balance) {
				setBalance(tokenBalance.balance.toFixed(2).toString())
			} else {
				setBalance("0.00")
			}
		}
	}, [walletContext, token])

	return (
		<>
			<span>{balance}</span>
		</>
	)
}

export default Balance
