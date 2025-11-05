"use client"
import type { LuminaPool } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { debounce } from "@tanstack/react-pacer"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import CurrencyFormat from "react-currency-format"
import { mina, poolToka, tokenA } from "@/utils/addresses"
import Balance from "./Balance"
import ButtonStatus from "./ButtonStatus"
import { LuminaContext } from "./Layout"
import PoolMenu from "./PoolMenu"

const Swap = () => {
	const { Dex } = useContext(LuminaContext)
	const toAmount = useSelector(Dex, (state) => state.context.dex.swap.calculated?.amountOut || 0)

	const [poolAddress, setPoolAddress] = useState(poolToka)
	const [pool, setPool] = useState<LuminaPool>()
	const [minaToToken, setMinaToToken] = useState(true)
	const [fromAmount, setFromAmount] = useState("")
	const [slippagePercent, setSlippagePercent] = useState(1)

	const tokenIn = (minaToToken ? pool?.tokens[0] : pool?.tokens[1]) ?? mina
	const tokenOut = (minaToToken ? pool?.tokens[1] : pool?.tokens[0]) ?? tokenA

	const updatePool = useCallback((newPool: LuminaPool) => {
		setPool(newPool)
		setPoolAddress(newPool.address)
	}, [])

	const swap = () => {
		Dex.send({ type: "Swap" })
	}

	const format = (n: number) => n / 10 ** tokenOut.decimals

	const debouncedChangeSettings = useMemo(
		() =>
			debounce(
				(params: { fromAmount: string; pool: LuminaPool; minaToToken: boolean; slippagePercent: number }) => {
					if (!Number.parseFloat(params.fromAmount) || !params.pool) return

					Dex.send({
						type: "ChangeSwapSettings",
						settings: {
							pool: params.pool.address,
							from: {
								address: params.minaToToken ? params.pool.tokens[0].address : params.pool.tokens[1].address,
								amount: params.fromAmount
							},
							to: params.minaToToken ? params.pool.tokens[1].address : params.pool.tokens[0].address,
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
		debouncedChangeSettings({ fromAmount, pool, minaToToken, slippagePercent })
	}, [debouncedChangeSettings, fromAmount, minaToToken, pool, slippagePercent])

	return (
		<div className="flex flex-row justify-center w-full ">
			<div className="flex flex-col p-3 gap-3  items-center">
				<div className="text-xl">Swap</div>
				<div>
					<span>Slippage (%) :</span>
					<input
						type="number"
						defaultValue={slippagePercent}
						onChange={(event) => setSlippagePercent(event.target.valueAsNumber)}
					/>
				</div>
				<div className="flex flex-row items-center">
					Pool : <PoolMenu poolAddress={poolAddress} setPool={updatePool} />
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
					<span className="w-24 text-center">{tokenIn ? tokenIn.symbol : "MINA"}</span>
				</div>
				{tokenIn?.address && (
					<div className="flex  w-full flex-row justify-start text-xs">
						<Balance token={tokenIn} />
						&nbsp;{tokenIn.symbol}
					</div>
				)}
				<div>
					<button
						type="button"
						onClick={() => setMinaToToken(!minaToToken)}
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
					<span className="w-24 text-center">{tokenOut ? tokenOut.symbol : "Token"}</span>
				</div>
				{tokenOut?.address && (
					<div className="flex  w-full flex-row justify-start text-xs">
						<Balance token={tokenOut} />
						&nbsp;{tokenOut.symbol}
					</div>
				)}
				<ButtonStatus onClick={swap} text={"Swap"} />
			</div>
		</div>
	)
}

export default Swap
