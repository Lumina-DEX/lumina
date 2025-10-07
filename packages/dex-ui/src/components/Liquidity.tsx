"use client"
import type { LuminaPool, LuminaToken } from "@lumina-dex/sdk"
import { debounce } from "@tanstack/react-pacer"
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import CurrencyFormat from "react-currency-format"
import { poolToka, tokenA } from "@/utils/addresses"
import Balance from "./Balance"
import ButtonStatus from "./ButtonStatus"
import { LuminaContext } from "./Layout"
import TokenMenu from "./TokenMenu"

const Liquidity = () => {
	const { Dex } = useContext(LuminaContext)

	const [liquidityMinted, setLiquidityMinted] = useState(0)
	const [token, setToken] = useState<LuminaToken>(tokenA)
	const [pool, setPool] = useState<LuminaPool>()
	const [poolAddress, setPoolAddress] = useState(poolToka)
	const [minaToToken, setminaToToken] = useState(true)
	const [fromAmount, setFromAmount] = useState("0.0")
	const [toAmount, setToAmount] = useState("0.0")
	const [slippagePercent, setSlippagePercent] = useState(1)

	const lastEditedField = useRef<"from" | "to" | null>(null)

	const updatePool = useCallback((newPool: LuminaPool) => {
		setPool(newPool)
		setPoolAddress(newPool.address)
		lastEditedField.current = "from"
	}, [])

	const addLiquidity = () => {
		Dex.send({ type: "AddLiquidity" })
	}

	function toFixedIfNecessary(value, dp) {
		return +Number.parseFloat(value).toFixed(dp)
	}

	const setAmountA = (value: string) => {
		setFromAmount(value)
		lastEditedField.current = "from"
	}

	const setAmountB = (value: string) => {
		setToAmount(value)
		lastEditedField.current = "to"
	}

	const changeOrder = () => {
		setminaToToken(!minaToToken)
		lastEditedField.current = "from"
	}

	//TODO: Use use selector instead of subscribe.
	useEffect(() => {
		const subscription = Dex.subscribe((snapshot) => {
			const result = snapshot.context.dex.addLiquidity.calculated

			if (result) {
				const decimalsA = minaToToken ? 9 : token.decimals
				const decimalsB = minaToToken ? token.decimals : 9
				const decimalsLiquidity = 9

				const amountA = result.tokenA.amountIn / 10 ** decimalsA
				const amountB = result.tokenB.amountIn / 10 ** decimalsB
				const liquidity = result.liquidity / 10 ** decimalsLiquidity

				if (lastEditedField.current === "from" && amountB > 0) {
					setToAmount(amountB.toFixed(2).toString())
				} else if (lastEditedField.current === "to" && amountA > 0) {
					setFromAmount(amountA.toFixed(2).toString())
				}

				setLiquidityMinted(liquidity)
				lastEditedField.current = null
			}
		})
		return subscription.unsubscribe
	}, [Dex, minaToToken, token])

	const debouncedChangeSettings = useMemo(
		() =>
			debounce(
				(params: {
					fromAmount: string
					toAmount: string
					pool: LuminaPool
					token: LuminaToken
					minaToToken: boolean
					slippagePercent: number
				}) => {
					const fromAmountNum = Number.parseFloat(params.fromAmount)
					const toAmountNum = Number.parseFloat(params.toAmount)

					if (!params.pool || !lastEditedField.current) return
					if (fromAmountNum <= 0 && toAmountNum <= 0) return

					Dex.send({
						type: "ChangeAddLiquiditySettings",
						settings: {
							pool: params.pool.address,
							tokenA: {
								address: params.minaToToken ? "MINA" : params.token.address,
								amount: params.fromAmount
							},
							tokenB: {
								address: !params.minaToToken ? "MINA" : params.token.address,
								amount: params.toAmount
							},
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
		debouncedChangeSettings({ fromAmount, toAmount, pool, token, minaToToken, slippagePercent })
	}, [debouncedChangeSettings, fromAmount, toAmount, pool, token, minaToToken, slippagePercent])

	return (
		<div className="flex flex-row justify-center w-full ">
			<div className="flex flex-col p-5 gap-5 items-center">
				<div className="text-xl">Add liquidity</div>
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
						onValueChange={({ value }) => setAmountA(value)}
					/>
					{minaToToken ? (
						<span className="w-24 text-center">MINA</span>
					) : (
						<TokenMenu setToken={setToken} poolAddress={poolAddress} setPool={updatePool} />
					)}
				</div>
				<div>
					<button type="button" onClick={changeOrder} className="w-8 bg-cyan-500 text-lg text-white rounded">
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
						onValueChange={({ value }) => setAmountB(value)}
					/>
					{!minaToToken ? (
						<span className="w-24 text-center">MINA</span>
					) : (
						<TokenMenu setToken={setToken} poolAddress={poolAddress} setPool={updatePool} />
					)}
				</div>
				<div>
					Your token balance : <Balance token={token} />
				</div>
				<div>
					Your liquidity balance : <Balance token={pool} />
				</div>
				<div>
					<span>Liquidity minted : {toFixedIfNecessary(liquidityMinted, 2)}</span>
				</div>
				<ButtonStatus onClick={addLiquidity} text={"Add Liquidity"} />
			</div>
		</div>
	)
}

export default Liquidity
