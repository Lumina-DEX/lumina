"use client"
import React, { useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import { PublicKey } from "o1js"
// @ts-ignore
import CurrencyFormat from "react-currency-format"
import { poolToka } from "@/utils/addresses"
import TokenMenu from "./TokenMenu"
import Balance from "./Balance"
import { feeAmount, LuminaContext } from "@/pages/_app.page"
import { useSelector } from "@lumina-dex/sdk/react"

type Percent = number | string

// @ts-ignore
const Swap = ({ accountState }) => {
	const [mina, setMina] = useState<any>()

	const [pool, setPool] = useState(poolToka)
	const [token, setToken] = useState({ address: "", decimals: 9 })

	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (window && (window as any).mina) {
			setMina((window as any).mina)
		}
	}, [])

	const zkState = accountState

	const { Wallet, Dex } = useContext(LuminaContext)
	const dexState = useSelector(Dex, (state) => state.value)

	const [toDai, setToDai] = useState(true)

	const [fromAmount, setFromAmount] = useState("")

	const [toAmount, setToAmount] = useState("0.0")

	const [slippagePercent, setSlippagePercent] = useState<number>(1)

	const [data, setData] = useState({ amountIn: 0, amountOut: 0, balanceOutMin: 0, balanceInMax: 0 })

	useEffect(() => {
		const delayDebounceFn = setTimeout(() => {
			if (parseFloat(fromAmount)) {
				handleCalculateSwap(fromAmount)
			}
		}, 500)
		return () => clearTimeout(delayDebounceFn)
	}, [fromAmount, toDai, slippagePercent, pool, zkState.network])

	useEffect(() => {
		const subscription = Dex.subscribe((snapshot) => {
			// simple logging
			console.log("Dex", snapshot)
			console.log("token", token)
			let valTo = snapshot.context.dex.swap.calculated?.amountOut || 0
			if (token) {
				valTo = valTo / 10 ** token.decimals
			}

			setToAmount(valTo.toString())
		})
		return subscription.unsubscribe
	}, [Dex])

	// Action handlers
	const handleCalculateSwap = (amount) => {
		Dex.send({
			type: "ChangeSwapSettings",
			settings: {
				pool: poolToka,
				from: {
					address: "MINA",
					amount: fromAmount
				},
				to: "B62qn71xMXqLmAT83rXW3t7jmnEvezaCYbcnb9NWYz85GTs41VYGDha",
				slippagePercent: slippagePercent,
				frontendFee: feeAmount
			}
		})
	}

	const swap = async () => {
		try {
			setLoading(true)
			console.log("infos", { fromAmount, toAmount })
			const res = Dex.send({ type: "Swap" })
			console.log("res", res)
		} catch (error) {
			console.log("swap error", error)
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			<div className="flex flex-row justify-center w-full ">
				<div className="flex flex-col p-5 gap-5  items-center">
					<div className="text-xl">Swap</div>
					<div>
						<span>Slippage (%) : </span>
						<input
							type="number"
							defaultValue={slippagePercent}
							onChange={(event) => setSlippagePercent(event.target.valueAsNumber)}
						></input>
					</div>
					<div className="flex flex-row w-full">
						<CurrencyFormat
							className="w-48 border-black text-default pr-3 text-xl text-right rounded focus:outline-none "
							thousandSeparator={true}
							decimalScale={2}
							placeholder="0.0"
							value={fromAmount}
							onValueChange={({ value }) => setFromAmount(value)}
						/>
						{toDai ? (
							<span className="w-24 text-center">MINA</span>
						) : (
							<TokenMenu pool={pool} setToken={setToken} setPool={setPool} />
						)}
					</div>
					<div>
						<button
							onClick={() => setToDai(!toDai)}
							className="w-8 bg-cyan-500 text-lg text-white rounded"
						>
							&#8645;
						</button>
					</div>
					<div className="flex flex-row w-full">
						<CurrencyFormat
							className="w-48 border-slate-50 text-default  pr-3 text-xl text-right text-xl rounded focus:outline-none "
							thousandSeparator={true}
							decimalScale={2}
							placeholder="0.0"
							value={toAmount}
							onValueChange={({ value }) => setToAmount(value)}
						/>
						{!toDai ? (
							<span className="w-24 text-center">MINA</span>
						) : (
							<TokenMenu pool={pool} setToken={setToken} setPool={setPool} />
						)}
					</div>
					<div>
						Your token balance : <Balance tokenAddress={token.address}></Balance>
					</div>
					<button onClick={swap} className="w-full bg-cyan-500 text-lg text-white p-1 rounded">
						Swap
					</button>
					{loading && <p>Creating transaction ...</p>}
				</div>
			</div>
		</>
	)
}

export default Swap
