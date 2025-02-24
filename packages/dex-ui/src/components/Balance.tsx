"use client"
import React, { useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import { PrivateKey, PublicKey, UInt64 } from "o1js"
// @ts-ignore
import CurrencyFormat from "react-currency-format"
import { poolToka } from "@/utils/addresses"
import TokenMenu from "./TokenMenu"
import { Networks } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { LuminaContext } from "./Layout"

// @ts-ignore
const Balance = ({ token }) => {
	const { Wallet, Dex } = useContext(LuminaContext)
	const walletState = useSelector(Wallet, (state) => state.value)
	const walletContext = useSelector(Wallet, (state) => state.context)
	const [balance, setBalance] = useState("0.0")

	useEffect(() => {
		getBalance().then()
		const intervalID = setInterval(() => {
			getBalance().then()
		}, 10000)

		return () => clearInterval(intervalID)
	}, [])

	const getBalance = async () => {
		if (token && token?.symbol?.length) {
			const chainId = Wallet.send({
				type: "FetchBalance",
				networks: [walletContext.currentNetwork],
				token: {
					address: token.address,
					decimal: 10 ** token.decimals,
					tokenId: token.tokenId,
					symbol: token.symbol
				}
			})
		}
	}

	useEffect(() => {
		if (walletContext?.currentNetwork && token?.symbol?.length) {
			console.log("token", token)
			const bal = walletContext.balances[walletContext.currentNetwork][token.symbol.toUpperCase()]
			console.log("bql", walletContext.balances)
			setBalance(bal.toFixed(2).toString())
		}
	}, [walletContext, token])

	return (
		<>
			<span>{balance}</span>
		</>
	)
}

export default Balance
