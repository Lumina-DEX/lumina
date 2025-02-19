"use client"
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import { fetchAccount, PublicKey } from "o1js"
// @ts-ignore
import CurrencyFormat from "react-currency-format"
import { connect, minaTestnet, requestAccounts, switchChain, zekoTestnet } from "@/lib/wallet"
import Menu from "./Menu"
import { LuminaContext } from "@/pages/_app.page"
import { useSelector } from "@lumina-dex/sdk/react"
import { Networks } from "@lumina-dex/sdk"

// @ts-ignore
const Account = () => {
	const [balance, setBalance] = useState(0)
	const zkState = { network: "", publicKeyBase58: "", balances: { mina: 0 } }
	const { Wallet, Dex } = useContext(LuminaContext)
	const walletState = useSelector(Wallet, (state) => state.value)
	const walletContext = useSelector(Wallet, (state) => state.context)

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
		if (walletState && walletState === "INIT") {
			handleConnect()
		}
	}, [walletState])

	useEffect(() => {
		if (walletContext) {
			try {
				const bal = walletContext.balances[walletContext.currentNetwork]["MINA"]
				setBalance(bal)
			} catch (error) {}

			console.log("walletContext", walletContext)
		}
	}, [walletContext])

	const switchNetwork = async (newNetwork: Networks) => {
		Wallet.send({ type: "RequestNetworkChange", network: newNetwork })
	}

	const trimText = (text: string) => {
		if (!text) {
			return ""
		}
		return text.substring(0, 4) + "..." + text.substring(text.length - 4, text.length)
	}

	const handleConnect = async () => {
		console.log("connect")
		Wallet.send({ type: "Connect" })
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

				{walletState !== "INIT" && (
					<div className="flex flex-row">
						<div className="flex flex-col lg:flex-row">
							<div>
								<span>{balance.toFixed(2)} MINA</span>
							</div>
							<div>
								<span title={walletContext.account}>{trimText(walletContext.account)}</span>
							</div>
						</div>
						<div>
							<select
								value={walletContext.currentNetwork}
								onChange={async (ev) => await switchNetwork(ev.target.value as Networks)}
							>
								{walletContext.currentNetwork !== zekoTestnet &&
									walletContext.currentNetwork !== minaTestnet && <option>N/A</option>}
								<option value={zekoTestnet}>Zeko</option>
								<option value={minaTestnet}>Devnet</option>
							</select>
						</div>
					</div>
				)}
				{walletState === "INIT" && (
					<button onClick={() => handleConnect().then()}>Connect Wallet</button>
				)}
			</div>
		</>
	)
}

export default Account
