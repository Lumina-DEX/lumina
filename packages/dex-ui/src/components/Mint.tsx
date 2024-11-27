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
const Mint = ({ accountState }) => {
	const [mina, setMina] = useState<any>()
	const [loading, setLoading] = useState(false)
	const [to, setTo] = useState("")
	const [token, setToken] = useState("")
	const [amount, setAmount] = useState(100_000)

	useEffect(() => {
		if (window && (window as any).mina) {
			const mina = (window as any).mina
			setMina(mina)
			mina?.requestAccounts().then((x) => {
				if (x?.length) {
					setTo(x[0])
				}
			})
		}
	}, [])

	const zkState = accountState

	const mintToken = async () => {
		try {
			setLoading(true)
			if (token) {
				console.time("token")
				console.log("zkState", zkState)
				const user: string = (await mina.requestAccounts())[0]
				await zkState.zkappWorkerClient?.mintToken(user, token, to, amount)
				const json = await zkState.zkappWorkerClient?.getTransactionJSON()
				console.timeEnd("create")
				await mina.sendTransaction({ transaction: json })
			}
		} catch (error) {
			console.log("token minting error", error)
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			<div className="flex flex-row justify-center w-full ">
				<div className="flex flex-col p-5 gap-5 items-center">
					<div className="text-xl">Mint your tokens</div>
					<div className="flex flex-col gap-5">
						<div>
							<span>Token address : </span>{" "}
							<input
								type="text"
								className="w-full"
								defaultValue={token}
								onChange={(event) => setToken(event.target.value)}
							></input>
						</div>
						<div>
							<span>To : </span>{" "}
							<input
								className="w-full"
								type="text"
								defaultValue={to}
								onChange={(event) => setTo(event.target.value)}
							></input>
						</div>
						<div>
							<span>Amount : </span>{" "}
							<input
								className="w-full"
								type="number"
								defaultValue={amount}
								onChange={(event) => setAmount(event.target.valueAsNumber)}
							></input>
						</div>
					</div>
					<button onClick={mintToken} className="w-full bg-cyan-500 text-lg text-white p-1 rounded">
						Mint Token
					</button>
					{loading && <p>Creating transaction ...</p>}
				</div>
			</div>
		</>
	)
}

export default Mint
