import type { ActorRefFromLogic, CreatePoolMachine } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import Loading from "./Loading"

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
				{(poolState.status === "RETRY" || poolState.status === "FAILED") && (
					<span className="w-96" style={{ overflowWrap: "break-word", wordWrap: "break-word" }}>
						An error occurred.
					</span>
				)}

				{poolState.status === "POOL_ALREADY_EXISTS" && (
					<span className="w-96" style={{ overflowWrap: "break-word", wordWrap: "break-word" }}>
						A pool already exists for this token pair.
					</span>
				)}
				{poolState.status === "COMPLETED" && <span> Pool created successfully</span>}
				{poolState.status !== "COMPLETED" &&
					poolState.status !== "RETRY" &&
					poolState.status !== "POOL_ALREADY_EXISTS" &&
					poolState.status !== "FAILED" && <Loading />}
			</div>
		</div>
	)
}

export default PoolCreationJob
