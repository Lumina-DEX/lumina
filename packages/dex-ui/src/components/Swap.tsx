"use client"
import { poolToka, tokenA } from "@/utils/addresses"
import type { LuminaPool, LuminaToken } from "@lumina-dex/sdk"
import { useCallback, useContext, useEffect, useState } from "react"
import CurrencyFormat from "react-currency-format"
import Balance from "./Balance"
import ButtonStatus from "./ButtonStatus"
import { LuminaContext } from "./Layout"
import TokenMenu from "./TokenMenu"

const Swap = () => {
	const [poolAddress, setPoolAddress] = useState(poolToka)
	const [pool, setPool] = useState<LuminaPool>()
	const [token, setToken] = useState<LuminaToken>(tokenA)

	function updateToken(newToken: LuminaToken) {
		setToken(newToken)
	}

	function updatePool(newPool: LuminaPool) {
		setPool(newPool)
		setPoolAddress(newPool.address)
	}

	const { Dex } = useContext(LuminaContext)

	const [toDai, setToDai] = useState(true)

	const [fromAmount, setFromAmount] = useState("")

	const [toAmount, setToAmount] = useState("0.0")

	const [slippagePercent, setSlippagePercent] = useState<number>(1)

	// Action handlers
	const handleCalculateSwap = useCallback(
		(amount: string) => {
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
		},
		[Dex, pool, toDai, token, slippagePercent]
	)

	const swap = () => {
		Dex.send({ type: "Swap" })
	}

	useEffect(() => {
		const delayDebounceFn = setTimeout(() => {
			if (Number.parseFloat(fromAmount) && token && pool) {
				handleCalculateSwap(fromAmount)
			}
		}, 500)
		return () => clearTimeout(delayDebounceFn)
	}, [handleCalculateSwap, fromAmount, token, pool])

	useEffect(() => {
		const subscription = Dex.subscribe((snapshot) => {
			let valTo = snapshot.context.dex.swap.calculated?.amountOut || 0
			if (token) {
				valTo = valTo / 10 ** token.decimals
			}

			setToAmount(valTo.toString())
		})
		return () => subscription.unsubscribe()
	}, [Dex, token])

	return (
		<div className="flex flex-row justify-center w-full ">
			<div className="flex flex-col p-5 gap-5  items-center">
				<div className="text-xl">Swap</div>
				<div>
					<span>Slippage (%) :</span>
					<input
						type="number"
						defaultValue={slippagePercent}
						onChange={(event) => setSlippagePercent(event.target.valueAsNumber)}
					/>
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
					<button type="button" onClick={() => setToDai(!toDai)} className="w-8 bg-cyan-500 text-lg text-white rounded">
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
						<TokenMenu poolAddress={poolAddress} setToken={updateToken} setPool={updatePool} />
					)}
				</div>
				{token?.address ? (
					<div>
						Your token balance : <Balance token={token} />
					</div>
				) : (
					<div />
				)}
				<ButtonStatus onClick={swap} text={"Swap"} />
			</div>
		</div>
	)
}

export default Swap
