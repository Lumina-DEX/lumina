"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import { PrivateKey, PublicKey } from "o1js"
// @ts-ignore
import CurrencyFormat from "react-currency-format"
import { poolToka } from "@/utils/addresses"
import TokenMenu from "./TokenMenu"

// @ts-ignore
const Token = ({ accountState }) => {
	const [mina, setMina] = useState<any>()
	const [loading, setLoading] = useState(false)
	const [symbol, setSymbol] = useState("SYM")
	const [tokenInfo, setTokenInfo] = useState({
		tokenAdminKey: "",
		tokenAdminPublic: "",
		tokenKey: "",
		tokenPublic: ""
	})

	useEffect(() => {
		if (window && (window as any).mina) {
			setMina((window as any).mina)
		}

		generateInfo()
	}, [])

	const zkState = accountState

	const createToken = async () => {
		try {
			setLoading(true)
			if (symbol) {
				console.time("token")
				console.log("zkState", zkState)
				const user: string = (await mina.requestAccounts())[0]
				await zkState.zkappWorkerClient?.deployToken(
					user,
					tokenInfo.tokenKey,
					tokenInfo.tokenAdminKey,
					symbol
				)
				const json = await zkState.zkappWorkerClient?.getTransactionJSON()
				console.timeEnd("create")
				await mina.sendTransaction({ transaction: json })
			} else {
				console.error("No symbol, set a symbol name")
			}
		} catch (error) {
			console.log("token creation error", error)
		} finally {
			setLoading(false)
		}
	}

	const generateInfo = () => {
		const tokenAdminKey = PrivateKey.random()
		const tokenAdminPublic = tokenAdminKey.toPublicKey()
		const tokenKey = PrivateKey.random()
		const tokenPublic = tokenKey.toPublicKey()

		setTokenInfo({
			tokenAdminKey: tokenAdminKey.toBase58(),
			tokenAdminPublic: tokenAdminPublic.toBase58(),
			tokenKey: tokenKey.toBase58(),
			tokenPublic: tokenPublic.toBase58()
		})
	}

	const trimText = (text: string) => {
		if (!text) {
			return ""
		}
		return text.substring(0, 4) + "..." + text.substring(text.length - 4, text.length)
	}

	return (
		<>
			<div className="flex flex-row justify-center w-full ">
				<div className="flex flex-col p-5 gap-5 items-center">
					<div className="text-xl">Deploy your own fungible token</div>
					<div className="text-l text-blue-500">Keep your private keys preciously</div>
					<div className="flex flex-col">
						<span>Token address : </span>
						<span className="break-all text-xs">{tokenInfo.tokenPublic}</span>
						<span>Token private key : </span>
						<span className="break-all text-xs">{tokenInfo.tokenKey}</span>
						<span>Token admin address : </span>
						<span className="break-all text-xs">{tokenInfo.tokenAdminPublic}</span>
						<span>Token admin private key : </span>
						<span className="break-all text-xs">{tokenInfo.tokenAdminKey}</span>
						<div>
							{" "}
							<span>Symbol : </span>{" "}
							<input
								type="text"
								defaultValue={symbol}
								onChange={(event) => setSymbol(event.target.value)}
							></input>
						</div>{" "}
						<button
							onClick={generateInfo}
							className="w-12 bg-cyan-500 text-lg text-white p-1 rounded"
						>
							&#8635;
						</button>
					</div>
					<button
						onClick={createToken}
						className="w-full bg-cyan-500 text-lg text-white p-1 rounded"
					>
						Create Token
					</button>
					{loading && <p>Creating transaction ...</p>}
				</div>
			</div>
		</>
	)
}

export default Token
