import type { ActorRefFromLogic, CreatePoolMachine } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import Loading from "./Loading"

const PoolCreationJob = ({ actor }: { id: string; actor: ActorRefFromLogic<CreatePoolMachine> }) => {
	const poolState = useSelector(actor, ({ value, context, matches, hasTag }) => ({
		status: value,
		context,
		exists: context.exists,
		errors: context.errors,
		matches,
		hasTag
	}))

	const getTokenNotExistsMessage = () => {
		const messages = []
		if (!poolState.exists.tokenA) {
			messages.push(`Token A (${poolState.context.tokenA}) doesn't exist on the network.`)
		}
		if (!poolState.exists.tokenB) {
			messages.push(`Token B (${poolState.context.tokenB}) doesn't exist on the network.`)
		}
		return messages.join(" ")
	}

	return (
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
	)
}

export default PoolCreationJob
