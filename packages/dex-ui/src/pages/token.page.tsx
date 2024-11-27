"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import { PublicKey } from "o1js"
import useAccount from "@/states/useAccount"
import Token from "@/components/Token"
import TabButton from "@/components/TabButton"
import Mint from "@/components/Mint"

type Percent = number | string

// @ts-ignore
const TokenPage = () => {
	const [tab, setTab] = useState<any>("deploy")
	const accountState = useAccount()

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
					<TabButton name="deploy" tab={tab} setTab={setTab} />
					<TabButton name="mint" tab={tab} setTab={setTab} />
				</div>
				<div className="p-2">
					{tab === "deploy" && (
						<div>
							<Token accountState={accountState}></Token>
						</div>
					)}
					{tab === "mint" && (
						<div>
							<Mint accountState={accountState}></Mint>
						</div>
					)}
				</div>
			</div>
		</>
	)
}

export default TokenPage
