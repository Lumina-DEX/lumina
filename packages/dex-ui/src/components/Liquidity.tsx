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
import { LuminaContext } from "./Layout"

// @ts-ignore
const Liquidity = ({}) => {
	const [liquidityMinted, setLiquidityMinted] = useState(0)
	const [token, setToken] = useState<LuminaToken>(tokenA)

	const { Wallet, Dex } = useContext(LuminaContext)

	const [poolAddress, setPoolAddress] = useState(poolToka)
	const [pool, setPool] = useState<LuminaPool>()
	const [toDai, setToDai] = useState(true)
	const [fromAmount, setFromAmount] = useState("0.0")
	const [toAmount, setToAmount] = useState("0.0")
	const [slippagePercent, setSlippagePercent] = useState<number>(1)

	useEffect(() => {
		const subscription = Dex.subscribe((snapshot) => {
			// simple logging
			let result = snapshot.context.dex.addLiquidity.calculated

			if (result) {
				const from = result.tokenA.amountIn / 10 ** 9
				const to = result.tokenB.amountIn / 10 ** 9
				const liquidity = result.liquidity / 10 ** 9
				setFromAmount(from.toFixed(2).toString())
				setToAmount(to.toFixed(2).toString())
				setLiquidityMinted(liquidity)
			}
		})
		return subscription.unsubscribe
	}, [])

	const getLiquidityAmount = async () => {
		Dex.send({
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
						Your liquidity balance : <Balance token={pool}></Balance>
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
