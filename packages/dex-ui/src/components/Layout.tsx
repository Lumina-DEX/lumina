"use client"

import { createDex, createWallet, type LuminaContext as LC } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { createContext, useEffect, useState } from "react"
import Account from "@/components/Account"
import styles from "../styles/Home.module.css"

export const feeAmount = 10

const Wallet = typeof window !== "undefined" ? createWallet() : null
const Dex = Wallet
	? createDex({
			input: {
				wallet: Wallet,
				features: ["Swap"],
				frontendFee: {
					destination: "B62qrUAGW6S4pSBcZko2LdbUAhtLd15zVs9KtQedScBvwuZVbcnej35",
					amount: feeAmount
				}
			}
		})
	: null
const Context: LC = { Dex, Wallet }
export const LuminaContext = createContext(Context)

export default function Layout({ children }) {
	const walletState = useSelector(Wallet, (state) => state.value)
	const dexState = useSelector(Dex, (state) => state.value)

	const [displayText, setDisplayText] = useState("")
	const [displayTextWallet, setDisplayTextWallet] = useState("")
	const [transactionlink] = useState("")

	// -------------------------------------------------------
	// Do Setup

	useEffect(() => {
		if (dexState?.contractSystem === "IDLE") {
			setDisplayText("")
		}
		setDisplayText(JSON.stringify(dexState))
	}, [dexState])

	useEffect(() => {
		setDisplayTextWallet(JSON.stringify(walletState))
	}, [walletState])

	// -------------------------------------------------------
	// Create UI elements

	const stepDisplay = transactionlink ? (
		<a
			href={transactionlink}
			target="_blank"
			rel="noreferrer"
			style={{ textDecoration: "underline" }}
		>
			View transaction
		</a>
	) : (
		<div>
			<div className="text-sm">{displayText}</div>
			<div className="text-sm">{displayTextWallet}</div>
		</div>
	)

	const setup = (
		<div
			className={styles.start}
			style={{ fontWeight: "bold", fontSize: "1.5rem", paddingBottom: "5rem" }}
		>
			{stepDisplay}
		</div>
	)

	const mainContent = (
		<div className="flex flex-col">
			<Account />
			<div className="flex flex-row w-screen p-5 items-center justify-center">{children}</div>
		</div>
	)

	return (
		<LuminaContext.Provider value={Context}>
			<div className={styles.main} style={{ padding: 0 }}>
				<div className={styles.center} style={{ padding: 0 }}>
					{mainContent}
					<footer>{setup}</footer>
				</div>
			</div>
		</LuminaContext.Provider>
	)
}
