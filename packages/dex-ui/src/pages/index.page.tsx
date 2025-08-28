import { useState } from "react"
import Swap from "@/components/Swap"

export default function Home() {
	const [tab] = useState("swap")

	return (
		<div
			className="flex flex-col min-w-[360px]  w-screen  max-w-[500px] h-[400px] rounded"
			style={{ backgroundColor: "rgb(255, 245, 240)" }}
		>
			<div className="p-2">
				{tab === "swap" && (
					<div>
						<Swap />
					</div>
				)}
			</div>
		</div>
	)
}
