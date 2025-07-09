"use client"

import { Field, PublicKey } from "o1js"
import { useContext, useEffect, useState } from "react"
import styles from "../styles/Home.module.css"
import Account from "@/components/Account"
import { useSelector } from "@lumina-dex/sdk/react"
import { createContext } from "react"
import { type LuminaContext as LC, createDex, createWallet } from "@lumina-dex/sdk"

export const feeAmount = 10
export const ZKFACTORY_ADDRESS = "B62qo8GFnNj3JeYq6iUUXeHq5bqJqPQmT5C2cTU7YoVc4mgiC8XEjHd"

const Wallet = typeof window !== "undefined" ? createWallet() : null
const Dex =
	typeof window !== "undefined" && Wallet
		? createDex({
				input: {
					wallet: Wallet,
					features: ["Swap", "DeployPool"],
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
	const [transactionlink, setTransactionLink] = useState("")

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

	let setup = (
		<div
			className={styles.start}
			style={{ fontWeight: "bold", fontSize: "1.5rem", paddingBottom: "5rem" }}
		>
			{stepDisplay}
		</div>
	)

	let mainContent = (
		<div className="flex flex-col">
			<Account></Account>
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
