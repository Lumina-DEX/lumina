import { Field, PublicKey } from "o1js"
import useAccount from "@/states/useAccount"
import Swap from "@/components/Swap"
import { useState } from "react"
import TabButton from "@/components/TabButton"

export default function Home() {
	const [tab, setTab] = useState<any>("swap")
	const accountState = useAccount()

	return (
		<>
			<div
				className="flex flex-col min-w-[360px]  w-screen  max-w-[500px] h-[400px] rounded"
				style={{ backgroundColor: "rgb(255, 245, 240)" }}
			>
				<div className="p-2">
					{tab === "swap" && (
						<div>
							<Swap accountState={accountState}></Swap>
						</div>
					)}
				</div>
			</div>
		</>
	)
}
