"use client"
import Create from "@/components/Create"
import Liquidity from "@/components/Liquidity"
import TabButton from "@/components/TabButton"
import Withdraw from "@/components/Withdraw"
import { useState } from "react"

const Pool = () => {
	const [tab, setTab] = useState<string>("create")

	return (
		<div
			className="flex flex-col min-w-[360px] w-screen max-w-[500px]  h-[600px]  rounded"
			style={{ backgroundColor: "rgb(255, 245, 240)" }}
		>
			<div
				className="flex flex-row justify-around items-stretch w-full p-2"
				style={{ borderBottom: "white 1px solid" }}
			>
				<TabButton name="create" tab={tab} setTab={setTab} />
				<TabButton name="add" tab={tab} setTab={setTab} />
				<TabButton name="withdraw" tab={tab} setTab={setTab} />
			</div>
			<div className="p-2">
				{tab === "add" && (
					<div>
						<Liquidity />
					</div>
				)}
				{tab === "withdraw" && (
					<div>
						<Withdraw />
					</div>
				)}
				{tab === "create" && (
					<div>
						<Create />
					</div>
				)}
			</div>
		</div>
	)
}

export default Pool
