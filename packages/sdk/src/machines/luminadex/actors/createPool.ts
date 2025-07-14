import type { Client } from "@urql/core"
import type { ResultOf } from "gql.tada"
import { Observable } from "rxjs"
import { assign, fromObservable, fromPromise, setup } from "xstate"
import {
	ConfirmTransactionMutation,
	CreatePoolMutation,
	PoolCreationSubscription
} from "../../../graphql/pool-signer"
import { sendTransaction } from "../../../helpers/transfer"
import type { WalletActorRef } from "../../wallet/actors"
import type { Networks } from "../../wallet/types"

const client = {} as Client // This is a placeholder. You'll need to import your actual urql client.

// 1. Call GraphQL mutation to create a pool
export const createPoolMutation = fromPromise(
	async ({
		input
	}: {
		input: { tokenA: string; tokenB: string; user: string; network: Networks }
	}) => {
		console.log("Creating pool with input:", input)
		const result = await client.mutation(CreatePoolMutation, {
			input: { ...input, network: input.network.replace(":", "_") as "mina_devnet" }
		})
		const jobId = result.data?.createPool?.id
		if (result.error || !jobId) {
			throw new Error(result.error?.message || "Failed to create pool")
		}
		return { jobId }
	}
)

// 2. Subscribe to job status updates
export const checkJobStatus = fromObservable(({ input }: { input: { jobId: string } }) => {
	console.log("Subscribing to job status for:", input.jobId)
	return new Observable<ResultOf<typeof PoolCreationSubscription>["poolCreation"]>((observer) => {
		const { unsubscribe } = client
			.subscription(PoolCreationSubscription, { jobId: input.jobId })
			.subscribe((result) => {
				if (result.error) {
					observer.error(result.error)
					return
				}

				if (result.data?.poolCreation) {
					const status = result.data.poolCreation
					if (!status) {
						observer.error(new Error("Invalid job status"))
						return
					}
					observer.next(status) // Forward the status update
					observer.complete()
				}
			})

		// On cleanup, unsubscribe from the urql subscription
		return () => {
			unsubscribe()
		}
	})
})

// 3. Sign o1js transaction
export const signPoolTransaction = fromPromise(
	async ({ input }: { input: { transaction: string; wallet: WalletActorRef } }) => {
		console.log("Signing transaction")
		const result = await sendTransaction({ tx: input.transaction, wallet: input.wallet })
		return result
	}
)

// 4. Send final GraphQL mutation
export const confirmPoolCreation = fromPromise(
	async ({ input }: { input: { jobId: string } }) => {
		console.log("Finalizing pool creation for job:", input.jobId)
		const result = await client.mutation(ConfirmTransactionMutation, { jobId: input.jobId })
		const message = result.data?.confirmJob
		console.log("Transaction confirmed:", message || "No confirmation message")
		return { success: true }
	}
)

export const createPoolMachine = setup({
	types: {
		context: {} as {
			transactionFromServer: string
			jobId: string
			hash: string
			url: string
			tokenA: string
			tokenB: string
			user: string
			network: Networks
			wallet: WalletActorRef
		},
		input: {} as {
			tokenA: string
			tokenB: string
			user: string
			network: Networks
			wallet: WalletActorRef
		}
	},
	actors: {
		createPoolMutation,
		checkJobStatus,
		signPoolTransaction,
		confirmPoolCreation
	}
}).createMachine({
	id: "createPoolFlow",
	initial: "CREATING",
	context: ({ input }) => ({
		...input,
		transactionFromServer: "",
		jobId: "",
		hash: "",
		url: ""
	}),
	states: {
		CREATING: {
			invoke: {
				src: "createPoolMutation",
				input: ({ context }) => ({
					tokenA: context.tokenA,
					tokenB: context.tokenB,
					user: context.user,
					network: context.network
				}),
				onDone: {
					target: "WAITING_FOR_PROOF",
					actions: assign({ jobId: ({ event }) => event.output.jobId })
				},
				onError: "FAILED"
			}
		},
		WAITING_FOR_PROOF: {
			invoke: {
				src: "checkJobStatus",
				input: ({ context }) => ({ jobId: context.jobId }),
				onSnapshot: {
					target: "SIGNING",
					actions: assign({
						transactionFromServer: ({ event }) =>
							JSON.stringify(event.snapshot?.context?.transactionJson)
					})
				},
				onError: "FAILED"
			}
		},
		SIGNING: {
			invoke: {
				src: "signPoolTransaction",
				input: ({ context }) => ({
					transaction: context.transactionFromServer,
					wallet: context.wallet
				}),
				onDone: {
					target: "CONFIRMING",
					actions: assign(({ event }) => ({
						hash: event.output.hash,
						url: event.output.url
					}))
				},
				onError: "FAILED"
			}
		},
		CONFIRMING: {
			invoke: {
				src: "confirmPoolCreation",
				input: ({ context }) => ({ jobId: context.jobId }),
				onDone: "COMPLETED",
				onError: "FAILED"
			}
		},
		COMPLETED: { type: "final" },
		FAILED: { type: "final" }
	}
})
