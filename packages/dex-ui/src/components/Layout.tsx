"use client"

import { createDex, createWallet, type LuminaContext as LC } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { createContext } from "react"
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
	const displayText = useSelector(Dex, (state) => state.value)
	const displayTextWallet = useSelector(Wallet, (state) => state.value)
	const dexContext = useSelector(Dex, ({ context: { dex } }) => dex)
	const walletContext = useSelector(Wallet, (state) => state.context)
	const showDebug = localStorage.getItem("debug") === "true"

	const DebugText = ({ children }) => (
		<pre
			style={{
				fontSize: "0.75rem",
				whiteSpace: "pre-wrap",
				wordWrap: "break-word"
			}}
		>
			{JSON.stringify(children, null, 2)}
		</pre>
	)
	return (
		<LuminaContext.Provider value={Context}>
			<div className={styles.main} style={{ padding: 0 }}>
				<div className={styles.center} style={{ padding: 0 }}>
					<div className="flex flex-col">
						<Account />
						<div className="flex flex-row w-screen p-5 items-center justify-center">{children}</div>
					</div>
					{showDebug && (
						<aside>
							<div
								className={styles.start}
								style={{
									position: "fixed",
									top: "75px",
									left: "0",
									width: "100vw",
									fontWeight: "bold",
									display: "flex",
									justifyContent: "space-between",
									gap: "1rem",
									pointerEvents: "none"
								}}
							>
								<DebugText>{dexContext}</DebugText>
								<DebugText>{displayText}</DebugText>
								<DebugText>{displayTextWallet}</DebugText>
								<DebugText>{walletContext}</DebugText>
							</div>
						</aside>
					)}
				</div>
			</div>
		</LuminaContext.Provider>
	)
}
