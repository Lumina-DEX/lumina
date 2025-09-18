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
import { createMeasure, prefixedLogger } from "../../../helpers/debug"
import { sendTransaction } from "../../../helpers/transfer"
import type { WalletActorRef } from "../../wallet/actors"
import type { Networks } from "../../wallet/types"
// Required imports for pool existence check
import { fetchAccount, Poseidon, Provable, PublicKey, TokenId, UInt64 } from "o1js"
import { luminadexFactories, MINA_ADDRESS } from "../../../constants"

const logger = prefixedLogger("[POOL CREATION API]")
const measure = createMeasure(logger)

// Function to check if a pool already exists
export const checkPoolExists = fromPromise(
	async ({ input }: { input: { tokenA: string; tokenB: string; network: Networks } }) => {
		logger.start("Checking if pool exists for tokens:", input.tokenA, input.tokenB)

		try {
			const factory = luminadexFactories[input.network]
			const factoryKey = PublicKey.fromBase58(factory)
			const factoryTokenId = TokenId.derive(factoryKey)

			const tokenAPublicKey = input.tokenA === MINA_ADDRESS
				? PublicKey.empty()
				: PublicKey.fromBase58(input.tokenA)
			const tokenBPublicKey = input.tokenB === MINA_ADDRESS
				? PublicKey.empty()
				: PublicKey.fromBase58(input.tokenB)

			// Order tokens as in the signer
			const tokenALower = tokenAPublicKey.x.lessThan(tokenBPublicKey.x)
			const token0 = Provable.if(
				tokenAPublicKey.isEmpty().or(tokenALower),
				tokenAPublicKey,
				tokenBPublicKey
			)
			const token1 = Provable.if(token0.equals(tokenBPublicKey), tokenAPublicKey, tokenBPublicKey)

			const isMinaTokenPool = token0.isEmpty().toBoolean()

			if (isMinaTokenPool) {
				// Check for MINA-Token pool
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
				// Check for Token-Token pool
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
					logger.info(
						"Pool already exists for Token-Token pair:",
						token0.toBase58(),
						token1.toBase58()
					)
					return { exists: true }
				}
			}

			logger.success("Pool does not exist, can proceed with creation")
			return { exists: false }
		} catch (error) {
			logger.error("Error checking pool existence:", error)
			// In case of verification error, let the process continue
			// rather than blocking completely
			throw error
		}
	}
)

// 0. Fetch job status
export const getJobStatus = fromPromise(
	async ({ input }: { input: { client: Client; jobId: string } }) => {
		logger.start("Checking job status for:", input.jobId)
		const result = await input.client.query(GetJobStatusQuery, { jobId: input.jobId }).toPromise()
		if (result.error) throw new Error(result.error.message)
		logger.success("Job status fetched successfully", result.data?.poolCreationJob)
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
		logger.start("Creating pool with input:", input)
		const { client, ...args } = input
		const result = await client.mutation(CreatePoolMutation, {
			input: { ...args, network: input.network.replace(":", "_") as "mina_devnet" }
		}).toPromise()
		const jobId = result.data?.createPool?.id
		if (result.error || !jobId) {
			throw new Error(result.error?.message || "Failed to create pool")
		}
		logger.success("Pool creation job created successfully", jobId)
		return { jobId }
	}
)

// 2. Subscribe to job status updates
export const checkJobStatus = fromObservable(
	({ input }: { input: { client: Client; jobId: string } }) => {
		logger.start("Subscribing to job status for:", input.jobId)
		const stop = measure("Pool Creation Server Side Proof")
		return new Observable<ResultOf<typeof PoolCreationSubscription>["poolCreation"]>((observer) => {
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
						observer.next(data) // Forward the status update
						logger.success("Job status update received:", data)
						observer.complete()
					}
				})

			// On cleanup, unsubscribe from the urql subscription
			return () => {
				logger.info("Unsubscribing from job status updates for:", input.jobId)
				unsubscribe()
				stop()
			}
		})
	}
)

// 3. Sign o1js transaction
export const signPoolTransaction = fromPromise(
	async ({ input }: { input: { transaction: string; wallet: WalletActorRef } }) => {
		logger.start("Signing transaction")
		const result = await sendTransaction({ tx: input.transaction, wallet: input.wallet })
		logger.success("Transaction signed successfully", result)
		return result
	}
)

// 4. Send final GraphQL mutation
export const confirmPoolCreation = fromPromise(
	async ({ input }: { input: { client: Client; jobId: string } }) => {
		logger.start("Finalizing pool creation for job:", input.jobId)
		const result = await input.client.mutation(ConfirmTransactionMutation, { jobId: input.jobId })
			.toPromise()
		logger.success("Transaction confirmed:", result.data?.confirmJob || "No confirmation message")
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
			poolCheck?: {
				exists: boolean
			}
			error?: unknown
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
		checkPoolExists,
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
		},
		error: undefined
	}),
	states: {
		INIT: {
			on: {
				create: { target: "CHECKING_POOL_EXISTS" },
				status: { target: "GET_STATUS" }
			},
			entry: enqueueActions(({ context, enqueue }) => {
				if (context.job.id.length === 0) enqueue.raise({ type: "create" })
				else enqueue.raise({ type: "status" })
			})
		},

		// New state to check pool existence
		CHECKING_POOL_EXISTS: {
			invoke: {
				src: "checkPoolExists",
				input: ({ context }) => ({
					tokenA: context.tokenA,
					tokenB: context.tokenB,
					network: context.network
				}),
				onDone: [
					{
						// If pool already exists, go to specific error state
						target: "POOL_ALREADY_EXISTS",
						guard: ({ event }) => event.output?.exists === true,
						actions: assign(({ event }) => ({
							poolCheck: event.output,
							error: new Error("Pool already exists for the specified token pair")
						}))
					},
					{
						// If pool doesn't exist, continue with creation
						target: "CREATING",
						actions: assign(({ event }) => ({
							poolCheck: event.output
						}))
					}
				],
				onError: {
					// In case of verification error, continue anyway
					// (better to try creating than blocking completely)
					target: "CREATING",
					actions: assign(({ event }) => ({
						poolCheck: { exists: false },
						error: event.error
					}))
				}
			}
		},

		// New final state for pools that already exist
		POOL_ALREADY_EXISTS: {
			type: "final",
			entry: ({ context }) => {
				logger.error("Pool creation aborted: Pool already exists", context.poolCheck)
			}
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
				onError: {
					target: "ERRORED",
					actions: assign(({ event }) => ({
						error: event.error
					}))
				}
			}
		},
		WAITING_FOR_PROOF: {
			invoke: {
				src: "checkJobStatus",
				input: ({ context }) => ({ client: context.client, jobId: context.job.id }),
				onSnapshot: {
					actions: assign(({ context, event }) => ({
						job: { ...context.job, ...event.snapshot?.context }
					}))
				},
				onDone: { target: "SIGNING" },
				onError: {
					target: "ERRORED",
					actions: assign(({ event }) => ({
						error: event.error
					}))
				}
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
				onError: { target: "FAILED" }
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
		ERRORED: { after: { 1000: { target: "INIT" } } },
		COMPLETED: { type: "final" },
		FAILED: { type: "final" }
	}
})
