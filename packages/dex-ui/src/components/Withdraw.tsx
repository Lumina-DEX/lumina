"use client"
import React, { useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import { PublicKey, TokenId } from "o1js"
// @ts-ignore
import CurrencyFormat from "react-currency-format"
import TokenMenu from "./TokenMenu"
import { poolToka } from "@/utils/addresses"
import Balance from "./Balance"
import ButtonStatus from "./ButtonStatus"
import { useSelector } from "@lumina-dex/sdk/react"
import { LuminaContext } from "./Layout"

// @ts-ignore
const Withdraw = ({}) => {
	const [mina, setMina] = useState<any>()

	const [loading, setLoading] = useState(false)
	const [token, setToken] = useState({ address: "", poolAddress: "" })

	useEffect(() => {
		if (window && (window as any).mina) {
			setMina((window as any).mina)
		}
	}, [])

	const [toDai, setToDai] = useState(true)
	const [pool, setPool] = useState(poolToka)
	const [fromAmount, setFromAmount] = useState("")
	const [toMina, setToMina] = useState(0)
	const [toToken, setToToken] = useState(0)
	const [slippagePercent, setSlippagePercent] = useState<number>(1)
	const [data, setData] = useState({
		amountAOut: 0,
		amountBOut: 0,
		balanceAMin: 0,
		balanceBMin: 0,
		supplyMax: 0,
		liquidity: 0
	})

	const { Wallet, Dex } = useContext(LuminaContext)
	const dexState = useSelector(Dex, (state) => state.value)
	const walletState = useSelector(Wallet, (state) => state.value)

	useEffect(() => {
		const delayDebounceFn = setTimeout(() => {
			if (parseFloat(fromAmount)) {
				getLiquidityAmount(fromAmount, slippagePercent)
			}
		}, 500)
		return () => clearTimeout(delayDebounceFn)
	}, [fromAmount, slippagePercent])

	useEffect(() => {
		const subscription = Dex.subscribe((snapshot) => {
			// simple logging
			console.log("Dex snapshot", snapshot)
			let result = snapshot.context.dex.removeLiquidity.calculated

			console.log("liquidity calculated", result)
			if (result) {
				setData(result)

				const amountA = result.amountAOut / 10 ** 9
				const amountB = result.amountBOut / 10 ** 9
				const liquidity = result.liquidity / 10 ** 9
				setToToken(amountB)
				setToMina(amountA)
			}
			//setToAmount(valTo.toString())
		})
		return subscription.unsubscribe
	}, [Dex])

	const getLiquidityAmount = async (fromAmt, slippagePcent) => {
		console.log("getLiquidityAmount", fromAmt)
		const settings = {
			type: "ChangeRemoveLiquiditySettings",
			settings: {
				// The pool address
				pool: token.poolAddress,

				// Token A settings
				tokenA: "MINA",

				// Token B settings
				tokenB: token.address,

				liquidityAmount: fromAmount,

				// Maximum allowed slippage in percentage
				slippagePercent: slippagePercent
			}
		}

		console.log("ChangeRemoveLiquiditySettings", settings)

		Dex.send(settings)
	}

	const withdrawLiquidity = async () => {
		try {
			setLoading(true)
			Dex.send({ type: "RemoveLiquidity" })
		} catch (error) {
			console.log("swap error", error)
		} finally {
			setLoading(false)
		}
	}

	function toFixedIfNecessary(value, dp) {
		return +parseFloat(value).toFixed(dp)
	}

	return (
		<>
			<div className="flex flex-row justify-center w-full ">
				<div className="flex flex-col p-5 gap-5 items-center">
					<div className="text-xl">Withdraw liquidity</div>
					<div>
						<span>Slippage (%) : </span>
						<input
							type="number"
							defaultValue={slippagePercent}
							onChange={(event) => setSlippagePercent(event.target.valueAsNumber)}
						></input>
					</div>
					<div>
						Pool : <TokenMenu setToken={setToken} pool={pool} setPool={setPool} />
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
						Your liquidity balance : <Balance token={token} isPool={false}></Balance>
					</div>
					<ButtonStatus onClick={withdrawLiquidity} text={"Withdraw Liquidity"}></ButtonStatus>
				</div>
			</div>
		</>
	)
}

export default Withdraw
