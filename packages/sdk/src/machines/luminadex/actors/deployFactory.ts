import type { Client } from "@urql/core"
import type { ResultOf } from "gql.tada"
import { produce } from "immer"
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
import type { LuminaDexWorker } from "../../../dex/luminadex-worker"
import { createFactorySignerClient } from "../../../graphql/clients"
import {
	ConfirmTransactionMutation,
	DeployFactoryMutation,
	GetJobStatusQuery,
	FactoryDeploymentSubscription
} from "../../../graphql/factory-signer"
import { createMeasure, prefixedLogger } from "../../../helpers/debug"
import { type TransactionMachineOutput, transactionMachine } from "../../transaction"
import type { WalletActorRef } from "../../wallet/actors"
import type { Networks } from "../../wallet/types"

const logger = prefixedLogger("[DEPLOY FACTORY API]")
const measure = createMeasure(logger)

const addError =
	(fallbackError: Error) =>
	({ context, event }: ActionArgs<DeployFactoryContext, ErrorActorEvent, EventObject>) => {
		const error = event.error instanceof Error ? event.error : fallbackError
		logger.error(error)
		return produce(context, (draft) => {
			draft.errors.push(error)
		})
	}

export const deployFactoryMutation = fromPromise<
	{ jobId: string },
	{
		client: Client
		deployer: string
		initialOwner: string
		network: Networks
	}
>(async ({ input }) => {
	logger.start("Deploying factory with input:", input)
	const { client, ...args } = input
	const result = await client
		.mutation(DeployFactoryMutation, {
			input: { ...args, network: input.network.replace(":", "_") as "mina_devnet" }
		})
		.toPromise()
	const jobId = result.data?.deployFactory?.id
	if (result.error || !jobId) {
		throw new Error(result.error?.message || "Failed to deploy factory")
	}
	logger.success("Factory deployment job created successfully", jobId)
	return { jobId }
})

export const checkFactoryDeploymentStatus = fromObservable<
	ResultOf<typeof GetJobStatusQuery>["factoryDeploymentJob"],
	{ client: Client; jobId: string }
>(({ input }) => {
	logger.start("Subscribing to factory deployment status for:", input.jobId)
	const stop = measure("Factory Deployment Server Side Proof")
	return new Observable((observer) => {
		const { unsubscribe } = input.client
			.subscription(FactoryDeploymentSubscription, { jobId: input.jobId })
			.subscribe((result) => {
				logger.info("Received subscription result:", result)
				if (result.error) {
					observer.error(result.error.message)
					return
				}

				if (result.data?.factoryDeployment) {
					const data = result.data.factoryDeployment
					if (!data) {
						observer.error(new Error("Error while processing data from subscription"))
						return
					}
					observer.next(data)
					logger.success("Factory deployment status update received:", data)
					observer.complete()
				}
			})

		return () => {
			logger.info("Unsubscribing from factory deployment status updates for:", input.jobId)
			unsubscribe()
			stop()
		}
	})
})

export const confirmFactoryDeployment = fromPromise<{ success: true }, { client: Client; jobId: string }>(
	async ({ input }) => {
		logger.start("Finalizing factory deployment for job:", input.jobId)
		const result = await input.client.mutation(ConfirmTransactionMutation, { jobId: input.jobId }).toPromise()
		logger.success("Factory deployment confirmed:", result.data?.confirmJob || "No confirmation message")
		return { success: true }
	}
)

export const getJobStatus = fromPromise<
	ResultOf<typeof GetJobStatusQuery>["factoryDeploymentJob"],
	{ client: Client; jobId: string }
>(async ({ input }) => {
	logger.start("Checking job status for:", input.jobId)
	const result = await input.client.query(GetJobStatusQuery, { jobId: input.jobId }).toPromise()
	if (result.error) throw new Error(result.error.message)
	if (!result.data) throw new Error("No data received from job status query")
	logger.success("Job status fetched successfully", result.data.factoryDeploymentJob)
	return result.data.factoryDeploymentJob
})

interface DeployFactoryContext {
	deployer: string
	initialOwner: string
	network: Networks
	wallet: WalletActorRef
	worker: LuminaDexWorker
	client: Client
	errors: Error[]
	job: {
		id: string
		status: string
		transactionJson: string
		factoryPublicKey: string
	}
	transaction: {
		hash: string
		url: string
	}
}

const clientAndJob = ({ context }: { context: DeployFactoryContext }) => ({
	client: context.client,
	jobId: context.job.id
})

export interface DeployFactoryInput {
	deployer: string
	initialOwner: string
	network: Networks
	wallet: WalletActorRef
	worker: LuminaDexWorker
}

export const deployFactoryMachine = setup({
	types: {
		context: {} as DeployFactoryContext,
		input: {} as DeployFactoryInput,
		tags: {} as "loading"
	},
	actors: {
		deployFactoryMutation,
		checkFactoryDeploymentStatus,
		confirmFactoryDeployment,
		getJobStatus,
		transactionMachine: transactionMachine as any
	}
}).createMachine({
	id: "deployFactoryFlow",
	initial: "INIT",
	context: ({ input }) => ({
		...input,
		client: createFactorySignerClient(),
		job: { id: "", status: "", transactionJson: "", factoryPublicKey: "" },
		transaction: { hash: "", url: "" },
		errors: []
	}),
	states: {
		INIT: {
			on: {
				deploy: "DEPLOYING",
				status: { target: "GET_STATUS" }
			},
			entry: enqueueActions(({ context, enqueue }) => {
				if (context.job.id) enqueue.raise({ type: "status" })
				else enqueue.raise({ type: "deploy" })
			})
		},
		GET_STATUS: {
			tags: ["loading"],
			description: "Retrieve job status when jobId is already known",
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
		DEPLOYING: {
			tags: ["loading"],
			invoke: {
				src: "deployFactoryMutation",
				input: ({ context }) => ({
					client: context.client,
					deployer: context.deployer,
					initialOwner: context.initialOwner,
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
					actions: assign(addError(new Error("Failed to deploy factory")))
				}
			}
		},
		WAITING_FOR_PROOF: {
			tags: ["loading"],
			invoke: {
				src: "checkFactoryDeploymentStatus",
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
			tags: ["loading"],
			invoke: {
				src: "transactionMachine",
				input: ({ context }: { context: DeployFactoryContext }) => ({
					id: context.job.id,
					transaction: context.job.transactionJson,
					wallet: context.wallet,
					worker: context.worker
				}),
				onDone: [
					{
						target: "CONFIRMING",
						guard: ({ event }) => !(event.output instanceof Error),
						actions: assign(({ context, event }) =>
							produce(context, (draft) => {
								const output = event.output as TransactionMachineOutput
								if (!(output instanceof Error)) {
									draft.transaction = output
								}
							})
						)
					},
					{
						target: "FAILED",
						guard: ({ event }) => event.output instanceof Error,
						actions: assign(({ context, event }) =>
							produce(context, (draft) => {
								const output = event.output as TransactionMachineOutput
								if (output instanceof Error) {
									draft.errors.push(output)
								}
							})
						)
					}
				],
				onError: {
					target: "FAILED",
					actions: assign(addError(new Error("Transaction signing failed")))
				}
			}
		},
		CONFIRMING: {
			tags: ["loading"],
			invoke: {
				src: "confirmFactoryDeployment",
				input: clientAndJob,
				onDone: "COMPLETED",
				onError: {
					target: "FAILED",
					actions: assign(addError(new Error("Factory deployment confirmation failed")))
				}
			}
		},
		RETRY: {
			after: {
				1000: [{ target: "FAILED", guard: ({ context }) => context.errors.length >= 3 }, { target: "INIT" }]
			},
			description: "An error occurred, will retry"
		},
		COMPLETED: {
			type: "final",
			description: "Factory deployment completed successfully"
		},
		FAILED: {
			type: "final",
			description: "Factory deployment failed with non-recoverable error"
		}
	}
})
