"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import { PrivateKey, PublicKey, UInt64 } from "o1js"
// @ts-ignore
import CurrencyFormat from "react-currency-format"
import { poolToka } from "@/utils/addresses"
import TokenMenu from "./TokenMenu"
import useAccount from "@/states/useAccount"

// @ts-ignore
const Balance = ({ tokenAddress }) => {
	const zkState = useAccount()
	const [balance, setBalance] = useState("0.0")

	useEffect(() => {
		getBalance().then()
		const intervalID = setInterval(() => {
			getBalance().then()
		}, 10000)

		return () => clearInterval(intervalID)
	}, [zkState.network, zkState.publicKeyBase58, tokenAddress])

	const getBalance = async () => {
		if (zkState.publicKeyBase58 && tokenAddress) {
			zkState.zkappWorkerClient
				.getBalanceToken(zkState.publicKeyBase58, tokenAddress)
				.then((x: UInt64) => {
					if (x) {
						let amtOut = x.toBigInt() / BigInt(10 ** 9)
						console.log("bal", balance)
						setBalance(Number(amtOut).toFixed(2))
					} else {
						setBalance("0.0")
					}
				})
		}
	}

	return (
		<>
			<span>{balance}</span>
		</>
	)
}

export default Balance
