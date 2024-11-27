import { Field, PublicKey } from "o1js"
import useAccount from "@/states/useAccount"
import Swap from "@/components/Swap"
import { useState } from "react"
import TabButton from "@/components/TabButton"
import Faucet from "@/components/Faucet"

export default function Home() {
	const accountState = useAccount()

	return (
		<>
			<div
				className="flex flex-col min-w-[360px]  w-screen  max-w-[500px] h-[400px] rounded"
				style={{ backgroundColor: "rgb(255, 245, 240)" }}
			>
				<div className="p-2">
					<Faucet accountState={accountState}></Faucet>
				</div>
			</div>
		</>
	)
}
