"use client"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import { fetchAccount, PublicKey } from "o1js"
// @ts-ignore
import CurrencyFormat from "react-currency-format"
import useAccount from "@/states/useAccount"
import { connect, minaTestnet, requestAccounts, switchChain, zekoTestnet } from "@/lib/wallet"
import Menu from "./Menu"

// @ts-ignore
const Account = () => {
	const zkState = useAccount()

	async function timeout(seconds: number): Promise<void> {
		return new Promise<void>((resolve) => {
			setTimeout(() => {
				resolve()
			}, seconds * 1000)
		})
	}

	useEffect(() => {
		timeout(1).then(() => {
			connect().then((x) => {
				console.log("network", zkState.network)
			})
		})
	}, [])

	useEffect(() => {
		const intervalID = setInterval(() => {
			if (zkState.publicKeyBase58) {
				requestAccounts().then()
			}
		}, 10000)

		return () => clearInterval(intervalID)
	}, [zkState.network, zkState.publicKeyBase58])

	const switchNetwork = async (newNetwork: string) => {
		await switchChain(newNetwork).then()
	}

	const trimText = (text: string) => {
		if (!text) {
			return ""
		}
		return text.substring(0, 4) + "..." + text.substring(text.length - 4, text.length)
	}

	const handleConnect = async () => {
		connect()
	}

	return (
		<>
			<div
				className="flex flex-row justify-between items-center w-screen menu"
				style={{ position: "fixed", top: "0", left: "0", backgroundColor: "white" }}
			>
				<div className="hidden lg:block">
					<img className="w-52 h-12" src="/assets/logo/logo.png" />
				</div>
				<div>
					<Menu></Menu>
				</div>

				{zkState?.publicKeyBase58 && (
					<div className="flex flex-row">
						<div className="flex flex-col lg:flex-row">
							<div>
								<span>{zkState.balances["mina"]?.toFixed(2)} MINA</span>
							</div>
							<div>
								<span title={zkState?.publicKeyBase58}>{trimText(zkState?.publicKeyBase58)}</span>
							</div>
						</div>
						<div>
							<select
								value={zkState?.network}
								onChange={async (ev) => await switchNetwork(ev.target.value)}
							>
								{zkState?.network !== zekoTestnet && zkState?.network !== minaTestnet && (
									<option>N/A</option>
								)}
								<option value={zekoTestnet}>Zeko</option>
								<option value={minaTestnet}>Devnet</option>
							</select>
						</div>
					</div>
				)}
				{!zkState?.publicKeyBase58 && (
					<button onClick={() => handleConnect().then()}>Connect Wallet</button>
				)}
			</div>
		</>
	)
}

export default Account
