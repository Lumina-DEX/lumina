import type { Client } from "@urql/core"
import type { ResultOf } from "gql.tada"
import { Observable } from "rxjs"
import { assign, enqueueActions, fromObservable, fromPromise, setup } from "xstate"
import { createPoolSignerClient } from "../../../graphql/clients"
import {
	ConfirmTransactionMutation,
	CreatePoolMutation,
	GetJobStatusQuery,
	PoolCreationSubscription
} from "../../../graphql/pool-signer"
import { sendTransaction } from "../../../helpers/transfer"
import type { WalletActorRef } from "../../wallet/actors"
import type { Networks } from "../../wallet/types"

// 0. Fetch job status
export const getJobStatus = fromPromise(
	async ({ input }: { input: { client: Client; jobId: string } }) => {
		console.log("Checking job status for:", input.jobId)
		const result = await input.client.query(GetJobStatusQuery, { jobId: input.jobId }).toPromise()
		if (result.error) throw new Error(result.error.message)
		return result.data?.poolCreationJob
	}
)

// 1. Create a pool creation job
export const createPoolMutation = fromPromise(
	async ({
		input
	}: {
		input: { client: Client; tokenA: string; tokenB: string; user: string; network: Networks }
	}) => {
		console.log("Creating pool with input:", input)
		const result = await input.client.mutation(CreatePoolMutation, {
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
export const checkJobStatus = fromObservable(
	({ input }: { input: { client: Client; jobId: string } }) => {
		console.log("Subscribing to job status for:", input.jobId)
		return new Observable<ResultOf<typeof PoolCreationSubscription>["poolCreation"]>((observer) => {
			const { unsubscribe } = input.client
				.subscription(PoolCreationSubscription, { jobId: input.jobId })
				.subscribe((result) => {
					if (result.error) {
						observer.error(result.error)
						return
					}

					if (result.data?.poolCreation) {
						const data = result.data.poolCreation
						if (!data) {
							observer.error(new Error("Error while processing data from subscription"))
							return
						}
						observer.next(data) // Forward the status update
						observer.complete()
					}
				})

			// On cleanup, unsubscribe from the urql subscription
			return () => {
				unsubscribe()
			}
		})
	}
)

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
	async ({ input }: { input: { client: Client; jobId: string } }) => {
		console.log("Finalizing pool creation for job:", input.jobId)
		const result = await input.client.mutation(ConfirmTransactionMutation, { jobId: input.jobId })
		console.log("Transaction confirmed:", result.data?.confirmJob || "No confirmation message")
		return { success: true }
	}
)

export const createPoolMachine = setup({
	types: {
		context: {} as {
			tokenA: string
			tokenB: string
			user: string
			network: Networks
			wallet: WalletActorRef
			client: Client
			job: {
				id: string
				status: string
				transactionJson: string
				poolPublicKey: string
			}
			transaction: {
				hash: string
				url: string
			}
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
		confirmPoolCreation,
		getJobStatus
	}
}).createMachine({
	id: "createPoolFlow",
	initial: "INIT",
	context: ({ input }) => ({
		...input,
		client: createPoolSignerClient(),
		job: {
			id: "",
			status: "",
			transactionJson: "",
			poolPublicKey: ""
		},
		transaction: {
			hash: "",
			url: ""
		}
	}),
	states: {
		INIT: {
			on: { create: { target: "CREATING" }, status: { target: "GET_STATUS" } },
			entry: enqueueActions(({ context, enqueue }) => {
				if (context.job.id.length === 0) enqueue.raise({ type: "create" })
				else enqueue.raise({ type: "status" })
			})
		},
		GET_STATUS: {
			invoke: {
				src: "getJobStatus",
				input: ({ context }) => ({ client: context.client, jobId: context.job.id }),
				onDone: [
					{
						target: "SIGNING",
						guard: ({ event }) => event.output?.status === "confirmed",
						actions: assign(({ context, event }) => ({
							job: { ...context.job, ...event.output }
						}))
					},
					{ target: "WAITING_FOR_PROOF" }
				],
				onError: { target: "FAILED" }
			}
		},
		CREATING: {
			invoke: {
				src: "createPoolMutation",
				input: ({ context }) => ({
					client: context.client,
					tokenA: context.tokenA,
					tokenB: context.tokenB,
					user: context.user,
					network: context.network
				}),
				onDone: {
					target: "WAITING_FOR_PROOF",
					actions: assign(({ context, event }) => ({
						job: { ...context.job, id: event.output.jobId }
					}))
				},
				onError: { target: "ERRORED" }
			}
		},
		WAITING_FOR_PROOF: {
			invoke: {
				src: "checkJobStatus",
				input: ({ context }) => ({ client: context.client, jobId: context.job.id }),
				onSnapshot: {
					target: "SIGNING",
					actions: assign(({ context, event }) => ({
						job: { ...context.job, ...event.snapshot?.context }
					}))
				},
				onError: { target: "ERRORED" }
			}
		},
		SIGNING: {
			invoke: {
				src: "signPoolTransaction",
				input: ({ context }) => ({
					transaction: context.job.transactionJson,
					wallet: context.wallet
				}),
				onDone: {
					target: "CONFIRMING",
					actions: assign(({ event }) => ({
						transaction: { hash: event.output.hash, url: event.output.url }
					}))
				},
				onError: { target: "ERRORED" }
			}
		},
		CONFIRMING: {
			invoke: {
				src: "confirmPoolCreation",
				input: ({ context }) => ({ client: context.client, jobId: context.job.id }),
				onDone: "COMPLETED",
				onError: { target: "ERRORED" }
			}
		},
		ERRORED: { target: "INIT" },
		COMPLETED: { type: "final" },
		FAILED: { type: "final" }
	}
})
