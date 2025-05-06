"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import { PublicKey } from "o1js"
import ButtonStatus from "./ButtonStatus"

// @ts-ignore
const Faucet = ({}) => {
	const [mina, setMina] = useState<any>()

	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (window && (window as any).mina) {
			setMina((window as any).mina)
		}
	}, [])

	const claim = async () => {
		try {
			setLoading(true)

			if (mina) {
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
				<div className="flex flex-col p-5 gap-5  items-center">
					<div className="text-xl">Faucet</div>
					<div>
						<span>You can only claim TOKA once by network and address</span>
					</div>
					<ButtonStatus onClick={claim} text={"Claim"}></ButtonStatus>
					{loading && <p>Creating transaction ...</p>}
					<a
						className="text-blue-500 underline"
						href="https://faucet.minaprotocol.com/"
						target="_blank"
					>
						Official Mina Faucet
					</a>
					<a className="text-blue-500 underline" href="https://zeko.io/faucet" target="_blank">
						Official Zeko Faucet
					</a>
				</div>
			</div>
		</>
	)
}

export default Faucet
