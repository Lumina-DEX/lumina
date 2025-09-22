import type { Client } from "@urql/core"
import type { ResultOf } from "gql.tada"
import { produce } from "immer"
import { fetchAccount, Poseidon, Provable, PublicKey, TokenId, UInt64 } from "o1js"
import { Observable } from "rxjs"
import {
	type ActionArgs,
	assign,
	type ErrorActorEvent,
	type EventObject,
	enqueueActions,
	fromObservable,
	fromPromise,
	setup
} from "xstate"
import { luminadexFactories, MINA_ADDRESS } from "../../../constants"
import type { LuminaDexWorker } from "../../../dex/luminadex-worker"
import { createPoolSignerClient } from "../../../graphql/clients"
import {
	ConfirmTransactionMutation,
	CreatePoolMutation,
	GetJobStatusQuery,
	PoolCreationSubscription
} from "../../../graphql/pool-signer"
import { createMeasure, prefixedLogger } from "../../../helpers/debug"
import { transactionMachine } from "../../transaction"
import type { WalletActorRef } from "../../wallet/actors"
import type { Networks } from "../../wallet/types"

const logger = prefixedLogger("[POOL CREATION API]")
const measure = createMeasure(logger)

const addError =
	(fallbackError: Error) =>
	({ context, event }: ActionArgs<CreatePoolContext, ErrorActorEvent, EventObject>) => {
		const error = event.error instanceof Error ? event.error : fallbackError
		logger.error(error)
		return produce(context, (draft) => {
			draft.errors.push(error)
		})
	}

export const checkPoolExists = fromPromise<{ exists: boolean }, { tokenA: string; tokenB: string; network: Networks }>(
	async ({ input }) => {
		logger.start("Checking if pool exists for tokens:", input.tokenA, input.tokenB)

		try {
			const factory = luminadexFactories[input.network]
			const factoryKey = PublicKey.fromBase58(factory)
			const factoryTokenId = TokenId.derive(factoryKey)

			const tokenAPublicKey = input.tokenA === MINA_ADDRESS ? PublicKey.empty() : PublicKey.fromBase58(input.tokenA)
			const tokenBPublicKey = input.tokenB === MINA_ADDRESS ? PublicKey.empty() : PublicKey.fromBase58(input.tokenB)

			const tokenALower = tokenAPublicKey.x.lessThan(tokenBPublicKey.x)
			const token0 = Provable.if(tokenAPublicKey.isEmpty().or(tokenALower), tokenAPublicKey, tokenBPublicKey)
			const token1 = Provable.if(token0.equals(tokenBPublicKey), tokenAPublicKey, tokenBPublicKey)

			const isMinaTokenPool = token0.isEmpty().toBoolean()

			if (isMinaTokenPool) {
				const tokenAccount = await fetchAccount({
					publicKey: token1,
					tokenId: factoryTokenId
				})
				const balancePool = tokenAccount?.account?.balance || UInt64.from(0n)
				const poolExists = balancePool.toBigInt() > 0n

				if (poolExists) {
					logger.info("Pool already exists for MINA-Token pair:", token1.toBase58())
					return { exists: true }
				}
			} else {
				const fields = token0.toFields().concat(token1.toFields())
				const hash = Poseidon.hashToGroup(fields)
				const pairPublickey = PublicKey.fromGroup(hash)
				const tokenAccount = await fetchAccount({
					publicKey: pairPublickey,
					tokenId: factoryTokenId
				})
				const balancePool = tokenAccount?.account?.balance || UInt64.from(0n)
				const poolExists = balancePool.toBigInt() > 0n

				if (poolExists) {
					logger.info("Pool already exists for Token-Token pair:", token0.toBase58(), token1.toBase58())
					return { exists: true }
				}
			}

			logger.success("Pool does not exist, can proceed with creation")
			return { exists: false }
		} catch (error) {
			logger.error("Error checking pool existence:", error)
			throw error
		}
	}
)

export const getJobStatus = fromPromise<
	ResultOf<typeof GetJobStatusQuery>["poolCreationJob"],
	{ client: Client; jobId: string }
>(async ({ input }) => {
	logger.start("Checking job status for:", input.jobId)
	const result = await input.client.query(GetJobStatusQuery, { jobId: input.jobId }).toPromise()
	if (result.error) throw new Error(result.error.message)
	if (!result.data) throw new Error("No data received from job status query")
	logger.success("Job status fetched successfully", result.data.poolCreationJob)
	return result.data.poolCreationJob
})

export const createPoolMutation = fromPromise<
	{ jobId: string },
	{ client: Client; tokenA: string; tokenB: string; user: string; network: Networks }
>(async ({ input }) => {
	logger.start("Creating pool with input:", input)
	const { client, ...args } = input
	const result = await client
		.mutation(CreatePoolMutation, {
			input: { ...args, network: input.network.replace(":", "_") as "mina_devnet" }
		})
		.toPromise()
	const jobId = result.data?.createPool?.id
	if (result.error || !jobId) {
		throw new Error(result.error?.message || "Failed to create pool")
	}
	logger.success("Pool creation job created successfully", jobId)
	return { jobId }
})

export const checkJobStatus = fromObservable<
	ResultOf<typeof GetJobStatusQuery>["poolCreationJob"],
	{ client: Client; jobId: string }
>(({ input }) => {
	logger.start("Subscribing to job status for:", input.jobId)
	const stop = measure("Pool Creation Server Side Proof")
	return new Observable((observer) => {
		const { unsubscribe } = input.client
			.subscription(PoolCreationSubscription, { jobId: input.jobId })
			.subscribe((result) => {
				logger.info("Received subscription result:", result)
				if (result.error) {
					observer.error(result.error.message)
					return
				}

				if (result.data?.poolCreation) {
					const data = result.data.poolCreation
					if (!data) {
						observer.error(new Error("Error while processing data from subscription"))
						return
					}
					observer.next(data)
					logger.success("Job status update received:", data)
					observer.complete()
				}
			})

		return () => {
			logger.info("Unsubscribing from job status updates for:", input.jobId)
			unsubscribe()
			stop()
		}
	})
})

// 3. Send final GraphQL mutation
export const confirmPoolCreation = fromPromise<{ success: true }, { client: Client; jobId: string }>(
	async ({ input }) => {
		logger.start("Finalizing pool creation for job:", input.jobId)
		const result = await input.client.mutation(ConfirmTransactionMutation, { jobId: input.jobId }).toPromise()
		logger.success("Transaction confirmed:", result.data?.confirmJob || "No confirmation message")
		return { success: true }
	}
)

interface CreatePoolContext {
	tokenA: string
	tokenB: string
	user: string
	network: Networks
	wallet: WalletActorRef
	worker: LuminaDexWorker
	client: Client
	errors: Error[]
	poolExist: boolean
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
}

const clientAndJob = ({ context }: { context: CreatePoolContext }) => ({
	client: context.client,
	jobId: context.job.id
})

export interface CreatePoolInput {
	tokenA: string
	tokenB: string
	user: string
	network: Networks
	wallet: WalletActorRef
	worker: LuminaDexWorker
}

export const createPoolMachine = setup({
	types: {
		context: {} as CreatePoolContext,
		input: {} as CreatePoolInput
	},
	actors: {
		checkPoolExists,
		createPoolMutation,
		checkJobStatus,
		confirmPoolCreation,
		getJobStatus,
		transactionMachine
	}
}).createMachine({
	id: "createPoolFlow",
	initial: "INIT",
	context: ({ input }) => ({
		...input,
		client: createPoolSignerClient(),
		job: { id: "", status: "", transactionJson: "", poolPublicKey: "" },
		transaction: { hash: "", url: "" },
		poolExist: false,
		errors: []
	}),
	states: {
		INIT: {
			on: {
				create: [
					{ target: "CREATING", guard: ({ context }) => context.poolExist === true },
					{ target: "CHECKING_POOL_EXISTS", guard: ({ context }) => context.poolExist === false }
				],
				status: { target: "GET_STATUS" }
			},
			entry: enqueueActions(({ context, enqueue }) => {
				if (context.job.id) enqueue.raise({ type: "status" })
				else enqueue.raise({ type: "create" })
			})
		},
		CHECKING_POOL_EXISTS: {
			invoke: {
				src: "checkPoolExists",
				input: ({ context: { tokenA, tokenB, network } }) => ({ tokenA, tokenB, network }),
				onDone: [
					{
						target: "POOL_ALREADY_EXISTS",
						guard: ({ event }) => event.output.exists === true,
						actions: assign({ poolExist: true })
					},
					{ target: "CREATING" }
				],
				onError: {
					target: "CREATING",
					actions: assign(addError(new Error("Pool check failed")))
				}
			}
		},
		GET_STATUS: {
			// TODO: Implement SDK helpers for persistence.
			description: "This only happens if the jobId is already known, e.g. on error or if the user refreshes the page.",
			invoke: {
				src: "getJobStatus",
				input: clientAndJob,
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
				onError: {
					target: "FAILED",
					actions: assign(addError(new Error("Failed to get job status")))
				}
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
					actions: assign(({ context, event }) =>
						produce(context, (draft) => {
							draft.job.id = event.output.jobId
						})
					)
				},
				onError: {
					target: "RETRY",
					actions: assign(addError(new Error("Failed to create pool")))
				}
			}
		},
		WAITING_FOR_PROOF: {
			invoke: {
				src: "checkJobStatus",
				input: clientAndJob,
				onSnapshot: {
					actions: assign(({ context, event }) => ({
						job: { ...context.job, ...event.snapshot?.context }
					}))
				},
				onDone: { target: "SIGNING" },
				onError: {
					target: "RETRY",
					actions: assign(addError(new Error("Error waiting for proof")))
				}
			}
		},
		SIGNING: {
			invoke: {
				src: "transactionMachine",
				input: ({ context: { wallet, worker, job } }) => ({
					id: job.id,
					transaction: job.transactionJson,
					wallet,
					worker
				}),
				onDone: [
					{
						target: "RETRY",
						guard: ({ event }) => event.output.result instanceof Error,
						actions: assign(({ context, event }) =>
							produce(context, (draft) => {
								if (event.output.result instanceof Error) {
									draft.errors.push(event.output.result)
								}
							})
						)
					},
					{
						target: "CONFIRMING",
						actions: assign(({ context, event }) =>
							produce(context, (draft) => {
								if (!(event.output.result instanceof Error)) {
									draft.transaction = event.output.result
								}
							})
						)
					}
				],
				onError: {
					target: "RETRY",
					actions: assign(addError(new Error("Transaction signing failed")))
				}
			}
		},
		CONFIRMING: {
			invoke: {
				src: "confirmPoolCreation",
				input: clientAndJob,
				onDone: "COMPLETED",
				onError: {
					target: "RETRY",
					actions: assign(addError(new Error("Transaction confirmation failed")))
				}
			}
		},
		RETRY: {
			after: { 1000: [{ target: "FAILED", guard: ({ context }) => context.errors.length >= 3 }, { target: "INIT" }] },
			description: "An error occurred, will retry"
		},
		COMPLETED: {
			type: "final",
			description: "Pool creation completed successfully"
		},
		POOL_ALREADY_EXISTS: {
			type: "final",
			description: "Pool already exists for the specified token pair."
		},
		FAILED: {
			type: "final",
			description: "Pool creation failed with non-recoverable error"
		}
	}
})
