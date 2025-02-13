import { useState } from "react"
import reactLogo from "./assets/react.svg"
import viteLogo from "/vite.svg"
import "./App.css"
import { Transaction } from "o1js"

function App() {
	const [count, setCount] = useState(0)
	const [account, setAccount] = useState("")
	const [tokenA, setTokenA] = useState("MINA")
	const [tokenB, setTokenB] = useState("B62qqbQt3E4re5VLpgsQnhDj4R4bYvhXLds1dK9nRiUBRF9wweFxadW")

	const connect = async () => {
		if (typeof window.mina !== "undefined") {
			console.log("Auro Wallet is installed!")
		}

		const account: string[] = await window.mina.requestAccounts().catch((err: any) => err)

		console.log(account)

		setAccount(account[0])
	}

	const deploy = async () => {
		const dataJson = JSON.stringify({
			user: account,
			tokenA: tokenA,
			tokenB: tokenB
		})

		const res = await fetch("http://localhost:8000/api/sign", {
			body: dataJson,
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			}
		})

		const resJson = await res.text()
		console.log("resJson", resJson)

		const parsed = JSON.parse(resJson)
		console.log("parsed", parsed)
		const newtx = Transaction.fromJSON(parsed)
		await newtx.prove()
		console.log("proved")
		await window.mina.sendTransaction({ transaction: newtx.toJSON() })
	}

	return (
		<>
			<div>
				<a href="https://vite.dev" target="_blank">
					<img src={viteLogo} className="logo" alt="Vite logo" />
				</a>
				<a href="https://react.dev" target="_blank">
					<img src={reactLogo} className="logo react" alt="React logo" />
				</a>
			</div>
			<h1>Vite + React</h1>
			<p className="read-the-docs">Click on the Vite and React logos to learn more</p>
			<div className="flex-column">
				<button onClick={connect}>Connect</button>
				<span>Account : {account}</span>
				<div>
					Token A :
					<input
						type="text"
						placeholder="token A"
						value={tokenA}
						onChange={(ev) => setTokenA(ev.target.value)}
					></input>
				</div>
				<div>
					Token B :
					<input
						type="text"
						placeholder="token B"
						value={tokenB}
						onChange={(ev) => setTokenB(ev.target.value)}
					></input>
				</div>
				<button onClick={deploy}>deploy pool</button>
			</div>
		</>
	)
}

export default App
