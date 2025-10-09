"use client"
import type { LuminaPool, LuminaToken } from "@lumina-dex/sdk"
import { debounce } from "@tanstack/react-pacer"
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import CurrencyFormat from "react-currency-format"
import { mina, poolToka, tokenA } from "@/utils/addresses"
import Balance from "./Balance"
import ButtonStatus from "./ButtonStatus"
import { LuminaContext } from "./Layout"
import PoolMenu from "./PoolMenu"

const Liquidity = () => {
	const { Dex } = useContext(LuminaContext)

	const [liquidityMinted, setLiquidityMinted] = useState(0)
	const [tokenA, setTokenA] = useState<LuminaToken>(mina)
	const [tokenB, setTokenB] = useState<LuminaToken>(tokenA)
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
				const decimalsA = tokenA.decimals
				const decimalsB = tokenB.decimals
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
	}, [Dex, tokenA, tokenB])

	useEffect(() => {
		if (pool) {
			const tokenIn = minaToToken ? pool.tokens[0] : pool.tokens[1]
			const tokenOut = minaToToken ? pool.tokens[1] : pool.tokens[0]
			setTokenA(tokenIn)
			setTokenB(tokenOut)
		}
	}, [pool, minaToToken])

	const debouncedChangeSettings = useMemo(
		() =>
			debounce(
				(params: {
					fromAmount: string
					toAmount: string
					pool: LuminaPool
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
								address: minaToToken ? params.pool.tokens[0].address : params.pool.tokens[1].address,
								amount: params.fromAmount
							},
							tokenB: {
								address: minaToToken ? params.pool.tokens[1].address : params.pool.tokens[0].address,
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
		debouncedChangeSettings({ fromAmount, toAmount, pool, minaToToken, slippagePercent })
	}, [debouncedChangeSettings, fromAmount, toAmount, pool, minaToToken, slippagePercent])

	return (
		<div className="flex flex-row justify-center w-full ">
			<div className="flex flex-col p-3 gap-3 items-center">
				<div className="text-xl">Add liquidity</div>
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
						onValueChange={({ value }) => setAmountA(value)}
					/>
					<span className="w-24 text-center">{tokenA ? tokenA.symbol : "MINA"}</span>
				</div>
				{tokenA?.address && (
					<div className="flex  w-full flex-row justify-start text-xs">
						<Balance token={tokenA} />
						&nbsp;{tokenA.symbol}
					</div>
				)}
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
					<span className="w-24 text-center">{tokenB ? tokenB.symbol : "Token"}</span>
				</div>
				{tokenB?.address && (
					<div className="flex  w-full flex-row justify-start text-xs">
						<Balance token={tokenB} />
						&nbsp;{tokenB.symbol}
					</div>
				)}
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
