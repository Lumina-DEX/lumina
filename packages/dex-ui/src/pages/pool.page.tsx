"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import { PublicKey } from "o1js"
// @ts-ignore
import CurrencyFormat from "react-currency-format"
import Liquidity from "@/components/Liquidity"
import Withdraw from "@/components//Withdraw"
import TabButton from "@/components/TabButton"
import Create from "@/components/Create"

type Percent = number | string

// @ts-ignore
const Pool = () => {
	const [tab, setTab] = useState<any>("create")

	return (
		<>
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
							<Liquidity></Liquidity>
						</div>
					)}
					{tab === "withdraw" && (
						<div>
							<Withdraw></Withdraw>
						</div>
					)}
					{tab === "create" && (
						<div>
							<Create></Create>
						</div>
					)}
				</div>
			</div>
		</>
	)
}

export default Pool
