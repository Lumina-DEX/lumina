"use client"
import React, { useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import { PrivateKey, PublicKey, TokenId, UInt64 } from "o1js"
// @ts-ignore
import CurrencyFormat from "react-currency-format"
import { poolToka } from "@/utils/addresses"
import TokenMenu from "./TokenMenu"
import { Networks } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { LuminaContext } from "./Layout"

// @ts-ignore
const Balance = ({ token, isPool }: { token: any; isPool: boolean | undefined }) => {
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
		if (token && token?.symbol?.length) {
			let data = {
				address: token.address,
				decimal: 10 ** token.decimals,
				tokenId: token.tokenId,
				symbol: token.symbol
			}

			if (isPool) {
				const tokenIdPool = TokenId.derive(PublicKey.fromBase58(token.poolAddress))
				data.address = token.poolAddress
				data.tokenId = TokenId.toBase58(tokenIdPool)
				data.symbol = "LUM"
				data.decimal = 10 ** 9
			}
			setTimeout(
				() => {
					Wallet.send({
						type: "FetchBalance",
						networks: [walletContext.currentNetwork],
						token: data
					})
				},
				isPool ? 2000 : 100
			)
		}
	}

	useEffect(() => {
		const symbol = isPool ? "LUM" : token?.symbol
		if (walletContext?.currentNetwork && symbol?.length) {
			const bal = walletContext.balances[walletContext.currentNetwork][symbol.toUpperCase()]
			if (bal) {
				setBalance(bal.toFixed(2).toString())
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
