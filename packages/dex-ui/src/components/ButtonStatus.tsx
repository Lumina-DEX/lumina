"use client"
import { useSelector } from "@lumina-dex/sdk/react"
import { Button } from "@mui/material"
import { useContext } from "react"
import { LuminaContext } from "./Layout"

const ButtonStatus = ({ onClick, text }) => {
	const { Wallet, Dex } = useContext(LuminaContext)
	const dexState = useSelector(Dex, (state) => state.value)
	const walletState = useSelector(Wallet, (state) => state.value)

	const loading = typeof dexState.dexSystem === "string"
	return (
		<>
			{!dexState?.contractSystem || dexState.contractSystem !== "READY" ? (
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
