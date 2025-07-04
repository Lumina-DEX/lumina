"use client"
import React, { useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import { PublicKey } from "o1js"
// @ts-ignore
import CurrencyFormat from "react-currency-format"
import { poolToka, toka } from "@/utils/addresses"
import TokenMenu from "./TokenMenu"
import Balance from "./Balance"
import { useSelector } from "@lumina-dex/sdk/react"
import ButtonStatus from "./ButtonStatus"
import { feeAmount, LuminaContext } from "./Layout"
import { LuminaPool, LuminaToken } from "@lumina-dex/sdk"

type Percent = number | string
type MinimalToken = { address: string; decimals: number }

// @ts-ignore
const Swap = ({}) => {
	const [mina, setMina] = useState<any>()

	const [poolAddress, setPoolAddress] = useState(poolToka)
	const [pool, setPool] = useState<LuminaPool>()
	const [token, setToken] = useState<LuminaToken | MinimalToken>({ address: toka, decimals: 9 })

	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (window && (window as any).mina) {
			setMina((window as any).mina)
		}
	}, [])

	function updateToken(newToken) {
		setToken(newToken)
	}

	function updatePool(newPool) {
		setPool(newPool)
	}

	const { Wallet, Dex } = useContext(LuminaContext)
	const dexState = useSelector(Dex, (state) => state.value)
	const walletState = useSelector(Wallet, (state) => state.value)

	const [toDai, setToDai] = useState(true)

	const [fromAmount, setFromAmount] = useState("")

	const [toAmount, setToAmount] = useState("0.0")

	const [slippagePercent, setSlippagePercent] = useState<number>(1)

	const [data, setData] = useState({ amountIn: 0, amountOut: 0, balanceOutMin: 0, balanceInMax: 0 })

	useEffect(() => {
		const delayDebounceFn = setTimeout(() => {
			if (parseFloat(fromAmount) && token && pool) {
				handleCalculateSwap(fromAmount)
			}
		}, 500)
		return () => clearTimeout(delayDebounceFn)
	}, [fromAmount, toDai, slippagePercent, token, walletState])

	useEffect(() => {
		const subscription = Dex.subscribe((snapshot) => {
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
				pool: pool.address,
				from: {
					address: toDai ? "MINA" : token.address,
					amount: amount
				},
				to: toDai ? token.address : "MINA",
				slippagePercent: slippagePercent
			}
		})
	}

	const swap = async () => {
		try {
			setLoading(true)
			const res = Dex.send({ type: "Swap" })
			console.log("res", res)
		} catch (error) {
			console.error("swap error", error)
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
							<TokenMenu poolAddress={poolAddress} setToken={updateToken} setPool={updatePool} />
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
							<TokenMenu poolAddress={poolAddress} setToken={setToken} setPool={setPool} />
						)}
					</div>
					{token?.address ? (
						<div>
							Your token balance : <Balance token={token} isPool={false}></Balance>
						</div>
					) : (
						<div></div>
					)}
					<ButtonStatus onClick={swap} text={"Swap"}></ButtonStatus>
				</div>
			</div>
		</>
	)
}

export default Swap
