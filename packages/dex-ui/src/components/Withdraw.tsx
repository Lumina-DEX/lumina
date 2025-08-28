"use client"
import type { LuminaPool, LuminaToken } from "@lumina-dex/sdk"
import { useCallback, useContext, useEffect, useState } from "react"
import CurrencyFormat from "react-currency-format"
import { poolToka, tokenA } from "@/utils/addresses"
import Balance from "./Balance"
import ButtonStatus from "./ButtonStatus"
import { LuminaContext } from "./Layout"
import TokenMenu from "./TokenMenu"

const Withdraw = () => {
	const [poolAddress] = useState(poolToka)
	const [, setToken] = useState<LuminaToken>(tokenA)
	const [pool, setPool] = useState<LuminaPool>()
	const [fromAmount, setFromAmount] = useState("")
	const [toMina, setToMina] = useState(0)
	const [toToken, setToToken] = useState(0)
	const [slippagePercent, setSlippagePercent] = useState<number>(1)

	const { Dex } = useContext(LuminaContext)

	const getLiquidityAmount = useCallback(
		(fromAmt: string, slippagePcent: number) => {
			Dex.send({
				type: "ChangeRemoveLiquiditySettings",
				settings: {
					// The pool address
					pool: pool.address,
					lpAmount: fromAmt,
					// Maximum allowed slippage in percentage
					slippagePercent: slippagePcent
				}
			})
		},
		[Dex, pool.address]
	)

	const withdrawLiquidity = () => {
		Dex.send({ type: "RemoveLiquidity" })
	}

	function toFixedIfNecessary(value, dp) {
		return +Number.parseFloat(value).toFixed(dp)
	}

	useEffect(() => {
		const delayDebounceFn = setTimeout(() => {
			if (Number.parseFloat(fromAmount)) {
				getLiquidityAmount(fromAmount, slippagePercent)
			}
		}, 500)
		return () => clearTimeout(delayDebounceFn)
	}, [getLiquidityAmount, fromAmount, slippagePercent])

	useEffect(() => {
		const subscription = Dex.subscribe((snapshot) => {
			// simple logging
			console.log("Dex snapshot", snapshot)
			const result = snapshot.context.dex.removeLiquidity.calculated

			console.log("liquidity calculated", result)
			if (result) {
				const amountA = result.tokenA.amountOut / 10 ** 9
				const amountB = result.tokenB.amountOut / 10 ** 9
				setToToken(amountB)
				setToMina(amountA)
			}
		})
		return () => subscription.unsubscribe()
	}, [Dex])

	return (
		<div className="flex flex-row justify-center w-full ">
			<div className="flex flex-col p-5 gap-5 items-center">
				<div className="text-xl">Withdraw liquidity</div>
				<div>
					<span>Slippage (%) : </span>
					<input
						type="number"
						defaultValue={slippagePercent}
						onChange={(event) => setSlippagePercent(event.target.valueAsNumber)}
					/>
				</div>
				<div>
					Pool : <TokenMenu setToken={setToken} poolAddress={poolAddress} setPool={setPool} />
				</div>
				<div className="flex flex-row w-full">
					<CurrencyFormat
						className="w-48 border-black text-default pr-3 text-xl text-right rounded focus:outline-none "
						thousandSeparator={true}
						decimalScale={6}
						placeholder="0.0"
						value={fromAmount}
						onValueChange={({ value }) => setFromAmount(value)}
					/>
					<span className="w-24 text-center">LUM</span>
				</div>
				<div>
					<span>MINA out : {toFixedIfNecessary(toMina, 2)}</span>
				</div>
				<div>
					<span>Token out : {toFixedIfNecessary(toToken, 2)}</span>
				</div>
				<div>
					Your liquidity balance : <Balance token={pool} />
				</div>
				<ButtonStatus onClick={withdrawLiquidity} text={"Withdraw Liquidity"} />
			</div>
		</div>
	)
}

export default Withdraw
