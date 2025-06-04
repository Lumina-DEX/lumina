import { Field, PublicKey } from "o1js"
import Swap from "@/components/Swap"
import { useState } from "react"
import TabButton from "@/components/TabButton"

export default function Home() {
	const [tab, setTab] = useState<any>("swap")
	const accountState = { network: "", publicKeyBase58: "", balances: { mina: 0 } }

	return (
		<>
			<div
				className="flex flex-col min-w-[360px]  w-screen  max-w-[500px] h-[400px] rounded"
				style={{ backgroundColor: "rgb(255, 245, 240)" }}
			>
				<div className="p-2">
					{tab === "swap" && (
						<div>
							<Swap></Swap>
						</div>
					)}
				</div>
			</div>
		</>
	)
}
