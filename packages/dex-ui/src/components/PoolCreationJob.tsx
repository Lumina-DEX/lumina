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
				<h5>Status : {poolState.status}</h5>
				{(poolState.status === "ERRORED" || poolState.status === "FAILED") && (
					<span>Check that the token is deployed and that no pool already exists for it</span>
				)}
				{poolState.status === "COMPLETED" && <span> Pool created successfully</span>}
				{poolState.status !== "COMPLETED" &&
					poolState.status !== "ERRORED" &&
					poolState.status !== "FAILED" && <Loading />}
			</div>
		</div>
	)
}

export default PoolCreationJob
