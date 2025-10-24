"use client"
import { useSelector } from "@lumina-dex/sdk/react"
import { Button } from "@mui/material"
import { useContext, useState } from "react"
import { LuminaContext } from "./Layout"
import Loading from "./Loading"

const Create = () => {
	const { Dex } = useContext(LuminaContext)
	const poolActorRef = useSelector(Dex, (state) => Object.values(state.context.dex.createPool.pools).at(-1))
	const poolState = useSelector(poolActorRef, (state) => state)
	const [tokenAddress, setTokenAddress] = useState("")

	const createPool = () => {
		Dex.send({ type: "DeployPool", settings: { tokenA: "MINA", tokenB: tokenAddress } })
	}

	const getTokenNotExistsMessage = () => {
		const messages = []
		if (!poolState.context.exists?.tokenA) {
			messages.push(`Token A (${poolState.context.tokenA}) doesn't exist on the network.`)
		}
		if (!poolState.context.exists?.tokenB) {
			messages.push(`Token B (${poolState.context.tokenB}) doesn't exist on the network.`)
		}
		return messages.join(" ")
	}

	return (
		<div className="flex flex-row justify-center w-full ">
			<div className="flex flex-col p-5 gap-5 items-center">
				<div className="text-xl">Create Pool</div>
				<div>
					<span>Token address :</span>{" "}
					<input type="text" defaultValue={tokenAddress} onChange={(event) => setTokenAddress(event.target.value)} />
				</div>
				<Button
					loading={poolState?.hasTag("loading")}
					variant="contained"
					className="w-full bg-cyan-500 text-lg text-white p-1 rounded"
					onClick={createPool}
				>
					Create Pool
				</Button>
				{poolState && (
					<div className="flex flex-row justify-center w-96">
						<div className="flex flex-col items-center">
							{(poolState.matches("RETRY") || poolState.matches("FAILED")) && (
								<div className="w-96" style={{ overflowWrap: "break-word", wordWrap: "break-word" }}>
									<span className="text-red-500">An error occurred.</span>
								</div>
							)}

							{poolState.matches("TOKEN_NOT_EXISTS") && (
								<span className="w-96 text-red-500" style={{ overflowWrap: "break-word", wordWrap: "break-word" }}>
									{getTokenNotExistsMessage()}
								</span>
							)}

							{poolState.matches("POOL_ALREADY_EXISTS") && (
								<span className="w-96" style={{ overflowWrap: "break-word", wordWrap: "break-word" }}>
									A pool already exists for this token pair.
								</span>
							)}

							{poolState.matches("COMPLETED") && <span className="text-green-500">Pool created successfully</span>}

							{poolState.hasTag("loading") && <Loading />}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default Create
