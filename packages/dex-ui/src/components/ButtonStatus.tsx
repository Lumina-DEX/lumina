"use client"
import { LuminaContext } from "./Layout"
import { useSelector } from "@lumina-dex/sdk/react"
import { Button } from "@mui/material"
import React, { useContext, useEffect, useMemo, useState } from "react"

// @ts-ignore
const ButtonStatus = ({ onClick, text }) => {
	const [loading, setLoading] = useState(false)
	const { Wallet, Dex } = useContext(LuminaContext)
	const dexState = useSelector(Dex, (state) => state.value)
	const walletState = useSelector(Wallet, (state) => state.value)
	const poolState = useSelector(Dex, (state) => state.context.dex.createPool)

	useEffect(() => {
		const load = typeof dexState.dexSystem === "string"
		setLoading(load)
	}, [dexState])
	return (
		<>
			{!dexState?.contractSystem || dexState.contractSystem !== "IDLE" ? (
				<Button color="success" variant="contained" size="large" className="w-full" disabled>
					Contracts Loading...
				</Button>
			) : walletState === "INIT" ? (
				<Button color="success" variant="contained" size="large" className="w-full" disabled>
					Connect your wallet...
				</Button>
			) : (
				<Button
					loading={loading}
					variant="contained"
					className="w-full bg-cyan-500 text-lg text-white p-1 rounded"
					onClick={onClick}
				>
					{text}
				</Button>
			)}
		</>
	)
}

export default ButtonStatus
