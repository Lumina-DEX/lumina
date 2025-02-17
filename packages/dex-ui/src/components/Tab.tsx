"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import { PublicKey } from "o1js"
// @ts-ignore
import CurrencyFormat from "react-currency-format"
import Liquidity from "./Liquidity"
import Swap from "./Swap"
import Withdraw from "./Withdraw"
import Faucet from "./Faucet"
import TabButton from "./TabButton"
import Create from "./Create"

type Percent = number | string

// @ts-ignore
const Tab = () => {
	const [tab, setTab] = useState<any>("swap")
	const accountState = { network: "", publicKeyBase58: "", balances: { mina: 0 } }

	return (
		<>
			<div>
				<div
					className="flex flex-col  w-[500px]  h-[600px]  rounded"
					style={{ backgroundColor: "rgb(255, 245, 240)" }}
				>
					<div
						className="flex flex-row justify-around items-stretch w-full p-2"
						style={{ borderBottom: "white 1px solid" }}
					>
						<TabButton name="swap" tab={tab} setTab={setTab} />
						<TabButton name="create" tab={tab} setTab={setTab} />
						<TabButton name="liquidity" tab={tab} setTab={setTab} />
						<TabButton name="withdraw" tab={tab} setTab={setTab} />
						<TabButton name="faucet" tab={tab} setTab={setTab} />
					</div>
					<div className="p-2">
						{tab === "swap" && (
							<div>
								<Swap accountState={accountState}></Swap>
							</div>
						)}
						{tab === "liquidity" && (
							<div>
								<Liquidity accountState={accountState}></Liquidity>
							</div>
						)}
						{tab === "withdraw" && (
							<div>
								<Withdraw accountState={accountState}></Withdraw>
							</div>
						)}
						{tab === "faucet" && (
							<div>
								<Faucet accountState={accountState}></Faucet>
							</div>
						)}
						{tab === "create" && (
							<div>
								<Create accountState={accountState}></Create>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	)
}

export default Tab
