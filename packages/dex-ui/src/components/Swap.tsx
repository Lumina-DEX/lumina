"use client"
import type { LuminaPool, LuminaToken } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { debounce } from "@tanstack/react-pacer"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"
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
	const [minaToToken, setminaToToken] = useState(true)
	const [fromAmount, setFromAmount] = useState("")
	// const [toAmount, setToAmount] = useState("0.0")
	const [slippagePercent, setSlippagePercent] = useState(1)

	const updatePool = useCallback((newPool: LuminaPool) => {
		setPool(newPool)
		setPoolAddress(newPool.address)
	}, [])

	const swap = () => {
		Dex.send({ type: "Swap" })
	}

	const format = (n: number) => n / 10 ** token.decimals

	const debouncedChangeSettings = useMemo(
		() =>
			debounce(
				(params: {
					fromAmount: string
					pool: LuminaPool
					token: LuminaToken
					minaToToken: boolean
					slippagePercent: number
				}) => {
					if (!Number.parseFloat(params.fromAmount) || !params.token || !params.pool) return

					Dex.send({
						type: "ChangeSwapSettings",
						settings: {
							pool: params.pool.address,
							from: {
								address: params.minaToToken ? "MINA" : params.token.address,
								amount: params.fromAmount
							},
							to: params.minaToToken ? params.token.address : "MINA",
							slippagePercent: params.slippagePercent
						}
					})
				},
				{ wait: 500 }
			),
		[Dex]
	)

	// Debounced change settings
	useEffect(() => {
		debouncedChangeSettings({ fromAmount, pool, token, minaToToken, slippagePercent })
	}, [debouncedChangeSettings, fromAmount, token, pool, slippagePercent, minaToToken])

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
					{minaToToken ? (
						<span className="w-24 text-center">MINA</span>
					) : (
						<TokenMenu poolAddress={poolAddress} setToken={setToken} setPool={updatePool} />
					)}
				</div>
				<div>
					<button
						type="button"
						onClick={() => setminaToToken(!minaToToken)}
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
						value={format(toAmount)}
					/>
					{!minaToToken ? (
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
