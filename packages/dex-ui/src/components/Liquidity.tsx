"use client"
import React, { useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import { PublicKey, TokenId } from "o1js"
// @ts-ignore
import CurrencyFormat from "react-currency-format"
import { poolToka, tokenA } from "@/utils/addresses"
import TokenMenu from "./TokenMenu"
import Balance from "./Balance"
import { useActor, useSelector } from "@lumina-dex/sdk/react"
import { dexMachine, LuminaPool, LuminaToken, walletMachine } from "@lumina-dex/sdk"
import ButtonStatus from "./ButtonStatus"
import { mina } from "@/lib/wallet"
import { LuminaContext } from "./Layout"

// @ts-ignore
const Liquidity = ({}) => {
	const [loading, setLoading] = useState(false)
	const [liquidityMinted, setLiquidityMinted] = useState(0)
	const [token, setToken] = useState<LuminaToken>(tokenA)

	const { Wallet, Dex } = useContext(LuminaContext)
	const dexState = useSelector(Dex, (state) => state.value)
	const walletState = useSelector(Wallet, (state) => state.value)

	const [poolAddress, setPoolAddress] = useState(poolToka)
	const [pool, setPool] = useState<LuminaPool>()
	const [toDai, setToDai] = useState(true)
	const [fromAmount, setFromAmount] = useState("0.0")
	const [toAmount, setToAmount] = useState("0.0")
	const [updateAmount, setUpdateAmount] = useState("0")
	const [slippagePercent, setSlippagePercent] = useState<number>(1)
	const [data, setData] = useState({
		amountAIn: 0,
		amountBIn: 0,
		balanceAMax: 0,
		balanceBMax: 0,
		supplyMin: 0,
		liquidity: 0
	})

	useEffect(() => {
		const subscription = Dex.subscribe((snapshot) => {
			// simple logging
			console.log("Dex snapshot", snapshot)
			let result = snapshot.context.dex.addLiquidity.calculated

			console.log("liquidity calculated", result)
			if (result) {
				setData(result)

				const from = result.tokenA.amountIn / 10 ** 9
				const to = result.tokenB.amountIn / 10 ** 9
				const liquidity = result.liquidity / 10 ** 9
				setFromAmount(from.toFixed(2).toString())
				setToAmount(to.toFixed(2).toString())
				setLiquidityMinted(liquidity)
			}
			//setToAmount(valTo.toString())
		})
		return subscription.unsubscribe
	}, [Dex])
	const getLiquidityAmount = async () => {
		console.log("getLiquidityAmount")

		const settings = {
			type: "ChangeAddLiquiditySettings",
			settings: {
				// The pool address
				pool: pool.address,

				// Token A settings
				tokenA: {
					address: "MINA",
					amount: fromAmount
				},

				// Token B settings
				tokenB: {
					address: token.address, // Native MINA token
					amount: toAmount
				},

				// Maximum allowed slippage in percentage
				slippagePercent: slippagePercent
			}
		}

		console.log("ChangeAddLiquiditySettings", settings)

		Dex.send(settings)
	}

	const addLiquidity = async () => {
		try {
			setLoading(true)
			Dex.send({ type: "AddLiquidity" })
		} catch (error) {
			console.log("swap error", error)
		} finally {
			setLoading(false)
		}
	}

	const calculateLiquidity = async () => {
		try {
			setLoading(true)
			await getLiquidityAmount()
		} catch (error) {
			console.log("swap error", error)
		} finally {
			setLoading(false)
		}
	}

	function toFixedIfNecessary(value, dp) {
		return +parseFloat(value).toFixed(dp)
	}

	const setAmountA = (value: string) => {
		setFromAmount(value)
		//setUpdateAmount(value);
	}

	const setAmountB = (value: string) => {
		setToAmount(value)
		//setUpdateAmount(value);
	}

	return (
		<>
			<div className="flex flex-row justify-center w-full ">
				<div className="flex flex-col p-5 gap-5 items-center">
					<div className="text-xl">Add liquidity</div>
					<div>
						<span>Slippage (%) : </span>
						<input
							type="number"
							defaultValue={slippagePercent}
							onChange={(event) => setSlippagePercent(event.target.valueAsNumber)}
						></input>
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
							<TokenMenu setToken={setToken} poolAddress={poolAddress} setPool={setPool} />
						)}
					</div>
					<div>
						<button
							onClick={() => setToDai(!toDai)}
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
							value={toAmount}
							onValueChange={({ value }) => setAmountB(value)}
						/>
						{!toDai ? (
							<span className="w-24 text-center">MINA</span>
						) : (
							<TokenMenu setToken={setToken} poolAddress={poolAddress} setPool={setPool} />
						)}
					</div>
					<div>
						Your token balance : <Balance token={token}></Balance>
					</div>
					<div>
						Your liquidity balance : <Balance token={token} pool={pool}></Balance>
					</div>
					<div>
						<span>Liquidity minted : {toFixedIfNecessary(liquidityMinted, 2)}</span>
					</div>
					<ButtonStatus onClick={calculateLiquidity} text={"Calculate Liquidity"}></ButtonStatus>
					<ButtonStatus onClick={addLiquidity} text={"Add Liquidity"}></ButtonStatus>
				</div>
			</div>
		</>
	)
}

export default Liquidity
