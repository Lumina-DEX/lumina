"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { useSearchParams } from "next/navigation"
import { PublicKey, TokenId } from "o1js"
// @ts-ignore
import CurrencyFormat from "react-currency-format"
import { poolToka } from "@/utils/addresses"
import TokenMenu from "./TokenMenu"
import Balance from "./Balance"

// @ts-ignore
const Liquidity = ({ accountState }) => {
	const [mina, setMina] = useState<any>()
	const [loading, setLoading] = useState(false)
	const [liquidityMinted, setLiquidityMinted] = useState(0)
	const [token, setToken] = useState({ address: "", poolAddress: "" })

	useEffect(() => {
		if (window && (window as any).mina) {
			setMina((window as any).mina)
		}
	}, [])

	const zkState = accountState
	const [pool, setPool] = useState(poolToka)
	const [toDai, setToDai] = useState(true)
	const [fromAmount, setFromAmount] = useState("")
	const [toAmount, setToAmount] = useState("0.0")
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
		const delayDebounceFn = setTimeout(() => {
			if (parseFloat(fromAmount)) {
				getLiquidityAmount(fromAmount, slippagePercent).then((x) => setData(x))
			}
		}, 500)
		return () => clearTimeout(delayDebounceFn)
	}, [fromAmount, toDai, toAmount, slippagePercent, pool])

	const getLiquidityAmount = async (fromAmt, slippagePcent) => {
		console.log("getLiquidityAmount", fromAmt)
		const { getAmountLiquidityOut, getFirstAmountLiquidityOut } = await import(
			"../../../contracts/build/src/indexmina"
		)
		const reserves = await zkState?.zkappWorkerClient?.getReserves(pool)
		console.log("reserve", reserves)
		let calcul = {
			amountAIn: 0,
			amountBIn: 0,
			balanceAMax: 0,
			balanceBMax: 0,
			supplyMin: 0,
			liquidity: 0
		}
		const slippage = slippagePcent
		if (reserves?.amountMina && reserves?.amountToken) {
			const amountMina = parseInt(reserves?.amountMina)
			const amountToken = parseInt(reserves?.amountToken)
			const liquidity = parseInt(reserves?.liquidity)
			if (liquidity > 0) {
				let amt = parseFloat(fromAmt) * 10 ** 9
				console.log("amtIn", amt)
				if (!toDai) {
					calcul = getAmountLiquidityOut(amt, amountToken, amountMina, liquidity, slippage)
					console.log("calcul from dai", calcul)
					let amtOut = calcul.amountBIn / 10 ** 9
					setToAmount(amtOut.toString())
					let liq = calcul.liquidity / 10 ** 9
					setLiquidityMinted(liq)
				} else {
					calcul = getAmountLiquidityOut(amt, amountMina, amountToken, liquidity, slippage)
					console.log("calcul from mina", calcul)
					let amtOut = calcul.amountBIn / 10 ** 9
					setToAmount(amtOut.toString())
					let liq = calcul.liquidity / 10 ** 9
					setLiquidityMinted(liq)
				}
			} else {
				let amtA = parseFloat(fromAmt) * 10 ** 9
				let amtB = parseFloat(toAmount) * 10 ** 9
				if (!toDai) {
					calcul = getFirstAmountLiquidityOut(amtB, amtA)
					console.log("calcul from dai", calcul)
					let liq = calcul.liquidity / 10 ** 9
					setLiquidityMinted(liq)
				} else {
					calcul = getFirstAmountLiquidityOut(amtA, amtB)
					console.log("calcul from mina", calcul)
					let liq = calcul.liquidity / 10 ** 9
					setLiquidityMinted(liq)
				}
			}
		}
		return calcul
	}

	const addLiquidity = async () => {
		try {
			setLoading(true)
			console.log("infos", { fromAmount, toAmount })

			if (mina) {
				console.log("zkState", zkState)
				const user: string = (await mina.requestAccounts())[0]
				if (!toDai) {
					await zkState.zkappWorkerClient?.addLiquidity(
						pool,
						user,
						data.amountBIn,
						data.amountAIn,
						data.balanceBMax,
						data.balanceAMax,
						data.supplyMin
					)
				} else {
					await zkState.zkappWorkerClient?.addLiquidity(
						pool,
						user,
						data.amountAIn,
						data.amountBIn,
						data.balanceAMax,
						data.balanceBMax,
						data.supplyMin
					)
				}
				const json = await zkState.zkappWorkerClient?.getTransactionJSON()
				await mina.sendTransaction({ transaction: json })
			}
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
							onValueChange={({ value }) => setFromAmount(value)}
						/>
						{toDai ? (
							<span className="w-24 text-center">MINA</span>
						) : (
							<TokenMenu setToken={setToken} pool={pool} setPool={setPool} />
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
							onValueChange={({ value }) => setToAmount(value)}
						/>
						{!toDai ? (
							<span className="w-24 text-center">MINA</span>
						) : (
							<TokenMenu setToken={setToken} pool={pool} setPool={setPool} />
						)}
					</div>
					<div>
						Your token balance : <Balance tokenAddress={token.address}></Balance>
					</div>
					<div>
						Your liquidity balance : <Balance tokenAddress={token.poolAddress}></Balance>
					</div>
					<div>
						<span>Liquidity minted : {toFixedIfNecessary(liquidityMinted, 2)}</span>
					</div>
					<button
						onClick={addLiquidity}
						className="w-full bg-cyan-500 text-lg text-white p-1 rounded"
					>
						Add Liquidity
					</button>
					{loading && <p>Creating transaction ...</p>}
				</div>
			</div>
		</>
	)
}

export default Liquidity
