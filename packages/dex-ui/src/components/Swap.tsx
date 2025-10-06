"use client"
import type { LuminaPool, LuminaToken } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { debounce } from "@tanstack/react-pacer"
import { useContext, useEffect, useState } from "react"
import CurrencyFormat from "react-currency-format"
import { poolToka, tokenA } from "@/utils/addresses"
import Balance from "./Balance"
import ButtonStatus from "./ButtonStatus"
import { LuminaContext } from "./Layout"
import TokenMenu from "./TokenMenu"

const Swap = () => {
	const { Dex } = useContext(LuminaContext)
	const toAmount = useSelector(Dex, (state) => state.context.dex.swap.calculated?.amountOut || 0)

	const [poolAddress, setPoolAddress] = useState(poolToka)
	const [pool, setPool] = useState<LuminaPool>()
	const [token, setToken] = useState<LuminaToken>(tokenA)
	const [toDai, setToDai] = useState(true)
	const [fromAmount, setFromAmount] = useState("")
	// const [toAmount, setToAmount] = useState("0.0")
	const [slippagePercent, setSlippagePercent] = useState(1)

	function updatePool(newPool: LuminaPool) {
		setPool(newPool)
		setPoolAddress(newPool.address)
	}

	const swap = () => {
		Dex.send({ type: "Swap" })
	}

	const format = (n: number) => n / 10 ** token.decimals

	//Debounced change settings
	useEffect(() => {
		debounce(
			() => {
				if (Number.parseFloat(fromAmount) && token && pool) {
					Dex.send({
						type: "ChangeSwapSettings",
						settings: {
							pool: pool.address,
							from: {
								address: toDai ? "MINA" : token.address,
								amount: fromAmount
							},
							to: toDai ? token.address : "MINA",
							slippagePercent: slippagePercent
						}
					})
				}
			},
			{ wait: 500 }
		)()
	}, [Dex, fromAmount, token, pool, slippagePercent, toDai])

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
						<TokenMenu poolAddress={poolAddress} setToken={setToken} setPool={updatePool} />
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
						value={format(toAmount)}
					/>
					{!toDai ? (
						<span className="w-24 text-center">MINA</span>
					) : (
						<TokenMenu poolAddress={poolAddress} setToken={setToken} setPool={updatePool} />
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
