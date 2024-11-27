"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import { PublicKey } from "o1js"
// @ts-ignore
import CurrencyFormat from "react-currency-format"
import { poolToka } from "@/utils/addresses"
import TokenMenu from "./TokenMenu"

// @ts-ignore
const Create = ({ accountState }) => {
	const [mina, setMina] = useState<any>()
	const [loading, setLoading] = useState(false)
	const [tokenAddress, setTokenAddress] = useState("")

	useEffect(() => {
		if (window && (window as any).mina) {
			setMina((window as any).mina)
		}
	}, [])

	const zkState = accountState

	const createPool = async () => {
		try {
			setLoading(true)
			if (mina) {
				console.time("create")
				console.log("zkState", zkState)
				const user: string = (await mina.requestAccounts())[0]
				await zkState.zkappWorkerClient?.deployPoolInstance(tokenAddress, user)
				const json = await zkState.zkappWorkerClient?.getTransactionJSON()
				console.timeEnd("create")
				await mina.sendTransaction({ transaction: json })
			}
		} catch (error) {
			console.log("swap error", error)
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			<div className="flex flex-row justify-center w-full ">
				<div className="flex flex-col p-5 gap-5 items-center">
					<div className="text-xl">Create Pool</div>
					<div>
						<span>Token address : </span>{" "}
						<input
							type="text"
							defaultValue={tokenAddress}
							onChange={(event) => setTokenAddress(event.target.value)}
						></input>
					</div>
					<button
						onClick={createPool}
						className="w-full bg-cyan-500 text-lg text-white p-1 rounded"
					>
						Create Pool
					</button>
					{loading && <p>Creating transaction ...</p>}
				</div>
			</div>
		</>
	)
}

export default Create
