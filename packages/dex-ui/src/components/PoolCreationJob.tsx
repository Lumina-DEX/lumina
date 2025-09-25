import type { ActorRefFromLogic, CreatePoolMachine } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import Loading from "./Loading"

const PoolCreationJob = ({ actor }: { id: string; actor: ActorRefFromLogic<CreatePoolMachine> }) => {
	const poolState = useSelector(actor, (state) => ({
		status: state.value,
		context: state.context,
		tokensExist: state.context.tokensExist,
		errors: state.context.errors
	}))

	const getTokenNotExistsMessage = () => {
		const messages = []
		if (!poolState.tokensExist.tokenA) {
			messages.push("This token doesn't exist on the network.")
		}
		if (!poolState.tokensExist.tokenB) {
			messages.push("This token doesn't exist on the network.")
		}
		return messages.join(" ")
	}

	return (
		<div className="flex flex-row justify-center w-96">
			<div className="flex flex-col items-center">
				{(poolState.status === "RETRY" || poolState.status === "FAILED") && (
					<div className="w-96" style={{ overflowWrap: "break-word", wordWrap: "break-word" }}>
						<span className="text-red-500">An error occurred.</span>
					</div>
				)}

				{poolState.status === "TOKEN_NOT_EXISTS" && (
					<span className="w-96 text-red-500" style={{ overflowWrap: "break-word", wordWrap: "break-word" }}>
						{getTokenNotExistsMessage()}
					</span>
				)}

				{poolState.status === "POOL_ALREADY_EXISTS" && (
					<span className="w-96" style={{ overflowWrap: "break-word", wordWrap: "break-word" }}>
						A pool already exists for this token pair.
					</span>
				)}

				{poolState.status === "COMPLETED" && <span className="text-green-500">Pool created successfully</span>}

				{poolState.status !== "COMPLETED" &&
					poolState.status !== "RETRY" &&
					poolState.status !== "POOL_ALREADY_EXISTS" &&
					poolState.status !== "TOKEN_NOT_EXISTS" &&
					poolState.status !== "FAILED" && <Loading />}
			</div>
		</div>
	)
}

export default PoolCreationJob
