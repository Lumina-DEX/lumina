"use client"
import { LuminaContext } from "@/pages/_app.page"
import { useSelector } from "@lumina-dex/sdk/react"
import { Button } from "@mui/material"
import React, { useContext, useEffect, useMemo, useState } from "react"

// @ts-ignore
const ButtonStatus = ({ onClick, text }) => {
	const [loading, setLoading] = useState(false)
	const { Wallet, Dex } = useContext(LuminaContext)
	const dexState = useSelector(Dex, (state) => state.value)
	const walletState = useSelector(Wallet, (state) => state.value)

	useEffect(() => {
		const load = typeof dexState.dexSystem === "string"
		setLoading(load)
	}, [dexState])
	return (
		<>
			{!dexState?.contractSystem || dexState.contractSystem !== "CONTRACTS_READY" ? (
				<Button color="success" variant="contained" size="large" disabled>
					Contracts Loading...
				</Button>
			) : walletState === "INIT" ? (
				<Button color="success" variant="contained" size="large" disabled>
					Connect your wallet...
				</Button>
			) : (
				<Button
					loading={loading}
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
