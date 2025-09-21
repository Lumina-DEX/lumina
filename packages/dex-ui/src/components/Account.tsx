"use client"
import type { Networks } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { useCallback, useContext, useEffect } from "react"
import { LuminaContext } from "./Layout"
import Menu from "./Menu"

export const zekoTestnet: Networks = "zeko:testnet"
export const minaTestnet: Networks = "mina:devnet"

const Account = () => {
	const { Wallet } = useContext(LuminaContext)
	const walletState = useSelector(Wallet, (state) => state.value)
	const walletContext = useSelector(Wallet, (state) => state.context)

	const balance = useSelector(
		Wallet,
		(state) => state.context.balances[state.context.currentNetwork]?.MINA?.balance || 0
	)

	const switchNetwork = async (newNetwork: Networks) => {
		Wallet.send({ type: "RequestNetworkChange", network: newNetwork })
	}

	const trimText = (text: string) => {
		if (!text) return ""
		return `${text.substring(0, 4)}...${text.substring(text.length - 4, text.length)}`
	}

	const handleConnect = useCallback(() => {
		console.log("connect")
		Wallet.send({ type: "Connect" })
	}, [Wallet])

	useEffect(() => {
		if (walletState && walletState === "INIT") {
			handleConnect()
		}
	}, [walletState, handleConnect])

	return (
		<div
			className="flex flex-row justify-between items-center w-screen menu"
			style={{ position: "fixed", top: "0", left: "0", backgroundColor: "white" }}
		>
			<div className="hidden lg:block">
				<picture>
					<img className="w-52 h-12" src="/assets/logo/logo.png" alt="logo" />
				</picture>
			</div>
			<div>
				<Menu />
			</div>

			{walletState !== "INIT" && (
				<div className="flex flex-row">
					<div className="flex flex-col lg:flex-row">
						<div>
							<span>{balance?.toFixed(2)} MINA</span>
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
							{walletContext.currentNetwork !== zekoTestnet && walletContext.currentNetwork !== minaTestnet && (
								<option>N/A</option>
							)}
							<option value={zekoTestnet}>Zeko</option>
							<option value={minaTestnet}>Devnet</option>
						</select>
					</div>
				</div>
			)}
			{walletState === "INIT" && (
				<button type="button" onClick={handleConnect}>
					Connect Wallet
				</button>
			)}
		</div>
	)
}

export default Account
