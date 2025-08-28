"use client"
import { useContext, useState } from "react"
import ButtonStatus from "./ButtonStatus"
import { LuminaContext } from "./Layout"

const Faucet = () => {
	const { Dex } = useContext(LuminaContext)

	const [loading, setLoading] = useState(false)

	const claim = async () => {
		try {
			setLoading(true)
			Dex.send({ type: "ClaimTokensFromFaucet" })
		} catch (error) {
			console.log("swap error", error)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="flex flex-row justify-center w-full ">
			<div className="flex flex-col p-5 gap-5  items-center">
				<div className="text-xl">Faucet</div>
				<div>
					<span>You can only claim TOKA once by network and address</span>
				</div>
				<ButtonStatus onClick={claim} text={"Claim"} />
				{loading && <p>Creating transaction ...</p>}
				<a
					className="text-blue-500 underline"
					href="https://faucet.minaprotocol.com/"
					target="_blank"
					rel="noopener"
				>
					Official Mina Faucet
				</a>
				<a
					className="text-blue-500 underline"
					href="https://zeko.io/faucet"
					target="_blank"
					rel="noopener"
				>
					Official Zeko Faucet
				</a>
			</div>
		</div>
	)
}

export default Faucet
