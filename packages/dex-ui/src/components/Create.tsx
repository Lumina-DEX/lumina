"use client"
import type { ActorRefFromLogic, CreatePoolMachine } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { useContext, useState } from "react"
import ButtonStatus from "./ButtonStatus"
import { LuminaContext } from "./Layout"
import PoolCreationJob from "./PoolCreationJob"

const Create = () => {
	const [tokenAddress, setTokenAddress] = useState("")
	const { Dex } = useContext(LuminaContext)
	const createPoolActor = useSelector(Dex, (state) => state.context.dex.createPool)

	const creatingPools = Object.entries(createPoolActor.pools)
		.map(([poolId, p]) => {
			const poolActor = p as ActorRefFromLogic<CreatePoolMachine>
			return { id: poolId, actor: poolActor }
		})
		.at(-1)

	const createPool = async () => {
		Dex.send({ type: "DeployPool", settings: { tokenA: "MINA", tokenB: tokenAddress } })
	}

	return (
		<div className="flex flex-row justify-center w-full ">
			<div className="flex flex-col p-5 gap-5 items-center">
				<div className="text-xl">Create Pool</div>
				<div>
					<span>Token address :</span>{" "}
					<input type="text" defaultValue={tokenAddress} onChange={(event) => setTokenAddress(event.target.value)} />
				</div>
				<ButtonStatus onClick={createPool} text={"Create Pool"} />
				{creatingPools && <PoolCreationJob key={creatingPools.id} id={creatingPools.id} actor={creatingPools.actor} />}
			</div>
		</div>
	)
}

export default Create
