"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import { PublicKey } from "o1js"
// @ts-ignore
import CurrencyFormat from "react-currency-format"
import { poolToka } from "@/utils/addresses"
import TokenMenu from "./TokenMenu"
import ButtonStatus from "./ButtonStatus"

// @ts-ignore
const Create = ({}) => {
	const [mina, setMina] = useState<any>()
	const [loading, setLoading] = useState(false)
	const [tokenAddress, setTokenAddress] = useState("")

	useEffect(() => {
		if (window && (window as any).mina) {
			setMina((window as any).mina)
		}
	}, [])

	const createPool = async () => {
		try {
			setLoading(true)
			if (mina) {
				console.time("create")
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
					<ButtonStatus onClick={createPool} text={"Create Pool"}></ButtonStatus>
				</div>
			</div>
		</>
	)
}

export default Create
