import type { Client } from "@urql/core"
import type { ResultOf } from "gql.tada"
import { produce } from "immer"
import { Poseidon, PublicKey, UInt32 } from "o1js"
import { type ActionArgs, assign, type ErrorActorEvent, type EventObject, fromPromise, setup } from "xstate"
import type { LuminaDexWorker } from "../../../dex/luminadex-worker"
import { createFactorySignerClient } from "../../../graphql/clients"
import { ConfirmTransactionMutation, CreateMultisigSignatureMutation } from "../../../graphql/factory-signer"
import { prefixedLogger } from "../../../helpers/debug"
import { type TransactionMachineOutput, transactionMachine } from "../../transaction"
import type { WalletActorRef } from "../../wallet/actors"
import type { Networks } from "../../wallet/types"

const logger = prefixedLogger("[MULTISIG SIGNATURE API]")

const addError =
	(fallbackError: Error) =>
	({ context, event }: ActionArgs<MultisigSignatureContext, ErrorActorEvent, EventObject>) => {
		const error = event.error instanceof Error ? event.error : fallbackError
		logger.error(error)
		return produce(context, (draft) => {
			draft.errors.push(error)
		})
	}

export const createMultisigSignature = fromPromise<
	{
		transactionJson: string
		signatureData: {
			witness: string
			signature: string
			right: string
		}
	},
	{
		client: Client
		user: string
		approvedUpgrader: string
		messageHash: string
		deadlineSlot: number
		network: Networks
	}
>(async ({ input }) => {
	logger.start("Creating multisig signature with input:", input)
	const { client, ...args } = input
	const result = await client
		.mutation(CreateMultisigSignatureMutation, {
			input: { ...args, network: input.network.replace(":", "_") as "mina_devnet" }
		})
		.toPromise()

	if (result.error || !result.data?.createMultisigSignature) {
		throw new Error(result.error?.message || "Failed to create multisig signature")
	}

	const data = result.data.createMultisigSignature
	logger.success("Multisig signature created successfully", data)

	return {
		transactionJson: data.transactionJson,
		signatureData: {
			witness: data.witness,
			signature: data.signature,
			right: data.right
		}
	}
})

export const confirmMultisigSignature = fromPromise<{ success: true }, { client: Client; transactionHash: string }>(
	async ({ input }) => {
		logger.start("Confirming multisig signature transaction:", input.transactionHash)
		const result = await input.client
			.mutation(ConfirmTransactionMutation, { transactionHash: input.transactionHash })
			.toPromise()
		logger.success("Multisig signature confirmed:", result.data?.confirmTransaction || "No confirmation message")
		return { success: true }
	}
)

interface MultisigSignatureContext {
	user: string
	approvedUpgrader: string
	messageHash: string
	deadlineSlot: number
	network: Networks
	wallet: WalletActorRef
	worker: LuminaDexWorker
	client: Client
	errors: Error[]
	signatureData: {
		transactionJson: string
		witness: string
		signature: string
		right: string
	}
	transaction: {
		hash: string
		url: string
	}
}

export interface MultisigSignatureInput {
	user: string
	approvedUpgrader: string
	messageHash: string
	deadlineSlot: number
	network: Networks
	wallet: WalletActorRef
	worker: LuminaDexWorker
}

export const multisigSignatureMachine = setup({
	types: {
		context: {} as MultisigSignatureContext,
		input: {} as MultisigSignatureInput,
		tags: {} as "loading"
	},
	actors: {
		createMultisigSignature,
		confirmMultisigSignature,
		transactionMachine: transactionMachine as any
	}
}).createMachine({
	id: "multisigSignatureFlow",
	initial: "CREATING_SIGNATURE",
	context: ({ input }) => ({
		...input,
		client: createFactorySignerClient(),
		signatureData: {
			transactionJson: "",
			witness: "",
			signature: "",
			right: ""
		},
		transaction: { hash: "", url: "" },
		errors: []
	}),
	states: {
		CREATING_SIGNATURE: {
			tags: ["loading"],
			invoke: {
				src: "createMultisigSignature",
				input: ({ context }) => ({
					client: context.client,
					user: context.user,
					approvedUpgrader: context.approvedUpgrader,
					messageHash: context.messageHash,
					deadlineSlot: context.deadlineSlot,
					network: context.network
				}),
				onDone: {
					target: "SIGNING",
					actions: assign(({ context, event }) =>
						produce(context, (draft) => {
							draft.signatureData = event.output
						})
					)
				},
				onError: {
					target: "RETRY",
					actions: assign(addError(new Error("Failed to create multisig signature")))
				}
			}
		},
		SIGNING: {
			tags: ["loading"],
			invoke: {
				src: "transactionMachine",
				input: ({ context }: { context: MultisigSignatureContext }) => ({
					id: `multisig-${context.user}`,
					transaction: context.signatureData.transactionJson,
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
				src: "confirmMultisigSignature",
				input: ({ context }) => ({
					client: context.client,
					transactionHash: context.transaction.hash
				}),
				onDone: "COMPLETED",
				onError: {
					target: "FAILED",
					actions: assign(addError(new Error("Signature confirmation failed")))
				}
			}
		},
		RETRY: {
			after: {
				1000: [
					{ target: "FAILED", guard: ({ context }) => context.errors.length >= 3 },
					{ target: "CREATING_SIGNATURE" }
				]
			},
			description: "An error occurred, will retry"
		},
		COMPLETED: {
			type: "final",
			description: "Multisig signature completed successfully"
		},
		FAILED: {
			type: "final",
			description: "Multisig signature failed with non-recoverable error"
		}
	}
})
