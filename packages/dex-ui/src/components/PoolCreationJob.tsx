import type { ActorRefFromLogic, CreatePoolMachine } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import Loading from "./Loading"
import { useEffect } from "react"

const PoolCreationJob = ({
	actor
}: { id: string; actor: ActorRefFromLogic<CreatePoolMachine> }) => {
	const poolState = useSelector(actor, (state) => ({
		status: state.value,
		context: state.context
	}))

	return (
		<div className="flex flex-row justify-center w-96">
			<div className="flex flex-col items-center">
				<h5>Status : {poolState.status}</h5>
				{(poolState.status === "ERRORED" ||
					poolState.status === "FAILED" ||
					poolState.status === "POOL_ALREADY_EXISTS") && (
					<span className="w-96" style={{ overflowWrap: "break-word", wordWrap: "break-word" }}>
						{poolState.context.error?.toString()}
					</span>
				)}
				{poolState.status === "COMPLETED" && <span> Pool created successfully</span>}
				{poolState.status !== "COMPLETED" &&
					poolState.status !== "ERRORED" &&
					poolState.status !== "POOL_ALREADY_EXISTS" &&
					poolState.status !== "FAILED" && <Loading />}
			</div>
		</div>
	)
}

export default PoolCreationJob
