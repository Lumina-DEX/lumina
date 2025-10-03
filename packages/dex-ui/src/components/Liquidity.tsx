"use client"
import type { LuminaPool, LuminaToken } from "@lumina-dex/sdk"
import { useContext, useEffect, useState, useRef } from "react"
import CurrencyFormat from "react-currency-format"
import { poolToka, tokenA } from "@/utils/addresses"
import Balance from "./Balance"
import ButtonStatus from "./ButtonStatus"
import { LuminaContext } from "./Layout"
import TokenMenu from "./TokenMenu"

const Liquidity = () => {
	const [liquidityMinted, setLiquidityMinted] = useState(0)
	const [token, setToken] = useState<LuminaToken>(tokenA)

	const { Dex } = useContext(LuminaContext)

	const [poolAddress, setPoolAddress] = useState(poolToka)
	const [pool, setPool] = useState<LuminaPool>()
	const [toDai, setToDai] = useState(true)
	const [fromAmount, setFromAmount] = useState("0.0")
	const [toAmount, setToAmount] = useState("0.0")
	const [slippagePercent, setSlippagePercent] = useState<number>(1)

	const lastEditedField = useRef<"from" | "to" | null>(null)
	const debounceTimer = useRef<NodeJS.Timeout | null>(null)

	function updatePool(newPool: LuminaPool) {
		setPool(newPool)
		setPoolAddress(newPool.address)
		lastEditedField.current = "from"
	}

	useEffect(() => {
		const subscription = Dex.subscribe((snapshot) => {
			const result = snapshot.context.dex.addLiquidity.calculated

			if (result) {
				const decimalsA = toDai ? 9 : token.decimals
				const decimalsB = toDai ? token.decimals : 9
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
	}, [Dex, toDai, token])

	useEffect(() => {
		if (debounceTimer.current) {
			clearTimeout(debounceTimer.current)
		}

		if (!pool || !lastEditedField.current) return

		const fromAmountNum = parseFloat(fromAmount)
		const toAmountNum = parseFloat(toAmount)

		if (fromAmountNum > 0 || toAmountNum > 0) {
			debounceTimer.current = setTimeout(() => {
				calculateLiquidity()
			}, 500)
		}

		return () => {
			if (debounceTimer.current) {
				clearTimeout(debounceTimer.current)
			}
		}
	}, [fromAmount, toAmount, pool, toDai])

	const getLiquidityAmount = async () => {
		Dex.send({
			type: "ChangeAddLiquiditySettings",
			settings: {
				pool: pool.address,
				tokenA: {
					address: toDai ? "MINA" : token.address,
					amount: fromAmount
				},
				tokenB: {
					address: !toDai ? "MINA" : token.address,
					amount: toAmount
				},
				slippagePercent: slippagePercent
			}
		})
	}

	const addLiquidity = async () => {
		try {
			Dex.send({ type: "AddLiquidity" })
		} catch (error) {
			console.log("swap error", error)
		}
	}

	const calculateLiquidity = async () => {
		try {
			await getLiquidityAmount()
		} catch (error) {
			console.log("swap error", error)
		}
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
		setToDai(!toDai)
		lastEditedField.current = "from"
	}

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
					{toDai ? (
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
					{!toDai ? (
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
