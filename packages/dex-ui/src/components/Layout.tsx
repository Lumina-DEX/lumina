import { Field, PublicKey } from "o1js"
import { useEffect, useState } from "react"
import GradientBG from "./GradientBG.js"
import styles from "../styles/Home.module.css"
import * as react from "../pages/reactCOIServiceWorker.js"
import ZkappWorkerClient from "@/lib/zkappWorkerClient"
import Swap from "@/components/Swap"
import Account from "@/components/Account"
import Tab from "@/components/Tab"
import useAccount from "@/states/useAccount"
import useLoad from "@/states/useLoad"

let transactionFee = 0.1
const ZKAPP_ADDRESS = "B62qjmz2oEe8ooqBmvj3a6fAbemfhk61rjxTYmUMP9A6LPdsBLmRAxK"
const ZKTOKEN_ADDRESS = "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w"
export const ZKFACTORY_ADDRESS = "B62qpfZ1egTLiRyX2DxfeFENrumeZowycer3Y5J9pKbiGVkgQBDkhW3"
const ZKFAUCET_ADDRESS = "B62qnigaSA2ZdhmGuKfQikjYKxb6V71mLq3H8RZzvkH4htHBEtMRUAG"
const WETH_ADDRESS = "B62qisgt5S7LwrBKEc8wvWNjW7SGTQjMZJTDL2N6FmZSVGrWiNkV21H"

export default function Layout({ children }) {
	const { loadUpdate } = useLoad((state) => ({
		loadUpdate: state.update
	}))

	const { address, hasBeenSetup, accountUpdate } = useAccount((state) => ({
		address: state.publicKeyBase58,
		hasBeenSetup: state.hasBeenSetup,
		accountUpdate: state.update
	}))

	const [displayText, setDisplayText] = useState("")
	const [transactionlink, setTransactionLink] = useState("")

	// -------------------------------------------------------
	// Do Setup

	useEffect(() => {
		async function timeout(seconds: number): Promise<void> {
			return new Promise<void>((resolve) => {
				setTimeout(() => {
					resolve()
				}, seconds * 1000)
			})
		}
		;(async () => {
			if (!hasBeenSetup) {
				setDisplayText("Loading web worker...")
				console.log("Loading web worker...")
				const zkappWorkerClient = new ZkappWorkerClient()
				accountUpdate({ zkappWorkerClient })
				await timeout(1)

				setDisplayText("Done loading web worker")
				console.log("Done loading web worker")

				await zkappWorkerClient.setActiveInstanceToDevnet()

				await zkappWorkerClient.loadContract()

				console.log("Compiling zkApp...")
				setDisplayText("Compiling zkApp...")
				await zkappWorkerClient.compileContract()
				console.log("zkApp compiled")
				setDisplayText("zkApp compiled...")

				const zkappPublicKey = PublicKey.fromBase58(ZKAPP_ADDRESS)

				await zkappWorkerClient.initZkappInstance(
					ZKAPP_ADDRESS,
					ZKFAUCET_ADDRESS,
					ZKFACTORY_ADDRESS
				)

				setDisplayText("")

				// setState({
				//   ...state,
				//   zkappWorkerClient,
				//   hasWallet: true,
				//   hasBeenSetup: true,
				//   zkappPublicKey,
				// });

				accountUpdate({
					hasBeenSetup: true,
					zkappPublicKey
				})
				loadUpdate({ state: true, process: 1 })
			}
		})()
	}, [])

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
		displayText
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
			<div className="flex flex-row w-screen p-5 items-center justify-center">
				{hasBeenSetup && children}
			</div>
		</div>
	)

	return (
		<div className={styles.main} style={{ padding: 0 }}>
			<div className={styles.center} style={{ padding: 0 }}>
				{setup}
				{mainContent}
			</div>
		</div>
	)
}
