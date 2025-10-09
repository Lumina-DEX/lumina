"use client"
import type { LuminaPool, LuminaToken } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { debounce } from "@tanstack/react-pacer"
import { useContext, useEffect, useMemo, useState } from "react"
import CurrencyFormat from "react-currency-format"
import { poolToka as poolAddress, tokenA } from "@/utils/addresses"
import Balance from "./Balance"
import ButtonStatus from "./ButtonStatus"
import { LuminaContext } from "./Layout"
import PoolMenu from "./PoolMenu"

const Withdraw = () => {
	const [pool, setPool] = useState<LuminaPool>()
	const [fromAmount, setFromAmount] = useState("")
	const [slippagePercent, setSlippagePercent] = useState<number>(1)

	const { Dex } = useContext(LuminaContext)

	const toMina = useSelector(Dex, (state) => state.context.dex.removeLiquidity.calculated?.tokenA.amountOut ?? 0)
	const toToken = useSelector(Dex, (state) => state.context.dex.removeLiquidity.calculated?.tokenB.amountOut ?? 0)

	const withdrawLiquidity = () => {
		Dex.send({ type: "RemoveLiquidity" })
	}

	function formatToken(value: number) {
		return (value / 10 ** 9).toFixed(2)
	}

	const debouncedChangeSettings = useMemo(
		() =>
			debounce(
				(params: { fromAmount: string; pool: LuminaPool; slippagePercent: number }) => {
					if (!Number.parseFloat(params.fromAmount) || !params.pool) return

					Dex.send({
						type: "ChangeRemoveLiquiditySettings",
						settings: {
							pool: params.pool.address,
							lpAmount: params.fromAmount,
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
		debouncedChangeSettings({ fromAmount, pool, slippagePercent })
	}, [debouncedChangeSettings, fromAmount, slippagePercent, pool])

	return (
		<div className="flex flex-row justify-center w-full ">
			<div className="flex flex-col p-5 gap-5 items-center">
				<div className="text-xl">Withdraw liquidity</div>
				<div>
					<span>Slippage (%) :</span>
					<input
						type="number"
						defaultValue={slippagePercent}
						onChange={(event) => setSlippagePercent(event.target.valueAsNumber)}
					/>
				</div>
				<div className="flex flex-row items-center">
					Pool : <PoolMenu poolAddress={poolAddress} setPool={setPool} />
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
					<span>
						{pool ? pool.tokens[0].symbol : "MINA"} out : {formatToken(toMina)}
					</span>
				</div>
				<div>
					<span>
						{pool ? pool.tokens[1].symbol : "Token"} out : {formatToken(toToken)}
					</span>
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
