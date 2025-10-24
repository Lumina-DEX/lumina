"use client"
import React, { useEffect, useMemo, useState } from "react"
import { PrivateKey, PublicKey } from "o1js"
// @ts-ignore
import Loading from "./Loading"

// @ts-ignore
const Token = ({ accountState }) => {
	const [mina, setMina] = useState<any>()
	const [loading, setLoading] = useState(false)
	const [symbol, setSymbol] = useState("SYM")
	const [tokenInfo, setTokenInfo] = useState({ tokenAdminKey: "", tokenAdminPublic: "", tokenKey: "", tokenPublic: "" })

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
				await zkState.zkappWorkerClient?.deployToken(user, tokenInfo.tokenKey, tokenInfo.tokenAdminKey, symbol)
				const json = await zkState.zkappWorkerClient?.getTransactionJSON()
				console.timeEnd("create")
				await mina.sendTransaction({ transaction: json })
			} else {
				alert("No symbol, set a symbol name")
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

	const download = () => {
		const token = { ...tokenInfo, symbol }
		const fileData = JSON.stringify(token)
		const blob = new Blob([fileData], { type: "text/plain" })
		const url = URL.createObjectURL(blob)
		const link = document.createElement("a")
		link.download = `token-${symbol}.txt`
		link.href = url
		link.click()
	}

	const trimText = (text: string) => {
		if (!text) {
			return ""
		}
		return text.substring(0, 4) + "..." + text.substring(text.length - 4, text.length)
	}

	const setTokenKey = (key: string) => {
		try {
			const pk = PrivateKey.fromBase58(key)
			setTokenInfo({ ...tokenInfo, tokenKey: key, tokenPublic: pk.toPublicKey().toBase58() })
		} catch (error) {}
	}

	const setAdminKey = (key: string) => {
		try {
			const pk = PrivateKey.fromBase58(key)
			setTokenInfo({ ...tokenInfo, tokenAdminKey: key, tokenAdminPublic: pk.toPublicKey().toBase58() })
		} catch (error) {}
	}

	return (
		<>
			<div className="flex flex-row justify-center w-full p-5">
				<div className="flex flex-col gap-5 items-center w-full">
					<div className="text-xl">Deploy your own fungible token</div>
					<div className="text-l text-blue-500">Keep your private keys preciously</div>
					<div className="flex flex-col w-full">
						<span>Token address : </span>
						<span className="break-all mb-2">{tokenInfo.tokenPublic}</span>

						<span>Token private key : </span>
						<input
							type="text"
							placeholder="Token private key"
							className="w-full mt-1 mb-2"
							defaultValue={tokenInfo.tokenKey}
							onChange={(event) => setTokenKey(event.target.value)}
						></input>

						<span>Token admin address : </span>
						<span className="break-all  mb-2">{tokenInfo.tokenAdminPublic}</span>

						<span>Token admin private key : </span>
						<input
							type="text"
							placeholder="Admin private key"
							className="w-full mt-1 mb-2"
							defaultValue={tokenInfo.tokenAdminKey}
							onChange={(event) => setAdminKey(event.target.value)}
						></input>

						<div className="mb-3">
							<span>Symbol : </span>{" "}
							<input
								className="w-80 ml-3"
								type="text"
								placeholder="Ex : PEPE, 6 characters maximums"
								onChange={(event) => setSymbol(event.target.value)}
							></input>
						</div>
						<div className="flex flex-row justify-between">
							<button onClick={download} className="w-12 bg-cyan-500 text-lg text-white p-1 rounded">
								&#11015;
							</button>

							<button onClick={generateInfo} className="w-12 bg-cyan-500 text-lg text-white p-1 rounded">
								&#8635;
							</button>
						</div>
					</div>
					<button onClick={createToken} className="w-full bg-cyan-500 text-lg text-white p-1 rounded">
						Create Token
					</button>
					{loading && (
						<div className="flex flex-row items-center">
							<Loading></Loading> <span className="ml-3">Creating transaction ...</span>
						</div>
					)}
				</div>
			</div>
		</>
	)
}

export default Token
