import type { ZkappCommand } from "@aurowallet/mina-provider"
import type { Mina } from "o1js"
import type { ActionArgs, ActorRefFromLogic, ErrorActorEvent, EventObject } from "xstate"
import { assign, enqueueActions, fromPromise, setup } from "xstate"
import { urls } from "../constants"
import type { LuminaDexWorker } from "../dex/luminadex-worker"
import { createLogger } from "../helpers/debug"
import { type HashDb, hashDb, type SavedTransaction } from "../helpers/transfer"
import type { walletMachine } from "."
import type { Networks } from "./wallet/types"

const { act, logger } = createLogger("[TRANSACTION]")

type Wallet = ActorRefFromLogic<typeof walletMachine>

export type Result = ReturnType<HashDb["createResult"]>

type SentTransaction = { hash: string; zkAppId: string }

export type TransactionMachineOutput = Result | Error

export type TransactionMachineContext = {
	id: string
	transaction: string
	wallet: Wallet
	worker: LuminaDexWorker
	user: string
	savedTransaction: SavedTransaction | null
	signedTransaction: ZkappCommand | null
	sentTransaction: SentTransaction | null
	result: Result | null
	db: HashDb
	network: Networks
	error: Error | null
}

export type TransactionMachineInput = {
	id: string
	transaction: Mina.Transaction<false, false> | string
	wallet: Wallet
	worker: LuminaDexWorker
}

type SendSignedTxInput = {
	network: Networks
	signedTransaction: ZkappCommand
	db: HashDb
	worker: LuminaDexWorker
}

type WaitForTxInput = SentTransaction & { network: Networks; worker: LuminaDexWorker }

class TransactionMachineError extends Error {
	constructor(message = "An unknown transaction error occurred.") {
		super(message)
		this.name = this.constructor.name
	}
}

const fail = ({ event }: ActionArgs<TransactionMachineContext, ErrorActorEvent, EventObject>) => {
	const error = event.error instanceof Error ? event.error : new TransactionMachineError(String(event.error))
	logger.error(error)
	return { error }
}

export const transactionMachine = setup({
	types: {
		context: {} as TransactionMachineContext,
		input: {} as TransactionMachineInput,
		output: {} as TransactionMachineOutput
	},
	actors: {
		findUnconfirmedTransaction: fromPromise<SavedTransaction | undefined, { db: HashDb }>(({ input }) => {
			return act("findUnconfirmedTransaction", async () => {
				const { db } = input
				const transaction = await db.findUnconfirmed()
				return transaction
			})
		}),
		signTransaction: fromPromise<ZkappCommand, { transaction: string; user: string }>(({ input }) => {
			return act("signTransaction", async () => {
				const { transaction, user } = input
				const originalTransaction = JSON.parse(transaction) as ZkappCommand
				logger.info({ originalTransaction })
				// If the fee is 0, set it to 1 to avoid auro wallet error
				if (originalTransaction.feePayer.body.fee === "0") {
					originalTransaction.feePayer.body.fee = "1"
				}
				const result = await window.mina.sendTransaction({
					onlySign: true,
					transaction: JSON.stringify(originalTransaction)
				})
				if (result instanceof Error) throw result
				if ("signedData" in result) {
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					const zkappCommand = (JSON.parse(result.signedData) as any).zkappCommand as ZkappCommand
					// If the feePayer is not the user, we need to set the authorization to a dummy value
					if (zkappCommand.feePayer.body.publicKey !== user) {
						zkappCommand.feePayer.authorization =
							"7mWxjLYgbJUkZNcGouvhVj5tJ8yu9hoexb9ntvPK8t5LHqzmrL6QJjjKtf5SgmxB4QWkDw7qoMMbbNGtHVpsbJHPyTy2EzRQ"
					}
					logger.success({ zkappCommand })
					return zkappCommand
				}
				throw new Error("Couldn't find signedData")
			})
		}),
		sendSignedTransaction: fromPromise<SentTransaction, SendSignedTxInput>(({ input }) => {
			return act("sendSignedTransaction", async () => {
				const { signedTransaction: zkappCommand, db, network, worker } = input
				worker.minaInstance(network)
				const { hash, zkAppId } = await worker.sendZkAppCommand(zkappCommand)
				logger.success("Transaction sent", hash)
				await db.saveSigned({ hash, zkAppId, confirmed: network.includes("zeko"), zkappCommand })
				return { hash, zkAppId }
			})
		}),
		waitForTransaction: fromPromise<string, WaitForTxInput>(({ input }) => {
			return act("waitForTransaction", async () => {
				const { zkAppId, hash, worker, network } = input
				const transactionStatus = async (delay = 2000) => {
					const url = urls[network]
					const result = await worker.transactionStatus({ zkAppId, url })
					if (result === "PENDING") {
						await new Promise((r) => setTimeout(r, delay))
						return transactionStatus(delay)
					}
					if (result === "INCLUDED") return true
					throw new Error("Transactions status is unknown.")
				}
				await transactionStatus()
				logger.success("Transaction included:", hash)
				return hash
			})
		})
	}
}).createMachine({
	id: "transaction",
	initial: "RESUMING",
	context: ({ input: { id, transaction: tx, wallet, worker } }) => {
		const transaction = typeof tx === "string" ? tx : tx.toJSON()
		const { account, currentNetwork: network } = wallet.getSnapshot().context
		return {
			id,
			transaction,
			wallet,
			worker,
			user: account,
			savedTransaction: null,
			signedTransaction: null,
			sentTransaction: null,
			result: null,
			db: hashDb({ id, network, account, transaction }),
			network,
			error: null
		}
	},
	output: ({ context: { result, error } }) => result ?? error ?? new TransactionMachineError("Unknown error"),
	states: {
		RESUMING: {
			description: "Attempt to resume an unconfirmed transaction.",
			invoke: {
				src: "findUnconfirmedTransaction",
				input: ({ context: { db, id } }) => ({ db, id }),
				onDone: [
					{
						target: "SIGNING",
						guard: ({ event }) => event.output === undefined
					},
					{
						target: "WAITING",
						guard: ({ event }) => event.output !== undefined,
						actions: enqueueActions(({ enqueue, event }) => {
							if (event.output) {
								enqueue.assign({ savedTransaction: event.output })
							}
						})
					}
				],
				onError: { target: "FAILED", actions: assign(fail) }
			}
		},
		SIGNING: {
			description: "Sign a transaction and return the signed zkappCommand.",
			invoke: {
				src: "signTransaction",
				input: ({ context: { transaction, user } }) => ({ transaction, user }),
				onDone: {
					target: "SENDING",
					actions: assign({ signedTransaction: ({ event }) => event.output })
				},
				onError: { target: "FAILED", actions: assign(fail) }
			}
		},
		SENDING: {
			description: "Send a signed transaction with o1js, and save it to idb.",
			invoke: {
				src: "sendSignedTransaction",
				input: ({ context: { signedTransaction, db, network, worker } }) => {
					if (!signedTransaction) throw new TransactionMachineError("No signed transaction to send")
					return { signedTransaction, db, worker, network }
				},
				onDone: [
					{
						target: "WAITING",
						guard: ({ context }) => context.wallet.getSnapshot().context.currentNetwork.includes("mina"),
						actions: assign({ sentTransaction: ({ event }) => event.output })
					},
					{
						guard: ({ context }) => context.wallet.getSnapshot().context.currentNetwork.includes("zeko"),
						target: "DONE",
						actions: assign(({ context, event }) => ({
							sentTransaction: event.output,
							result: context.db.createResult({ hash: event.output.hash })
						}))
					}
				],
				onError: { target: "FAILED", actions: assign(fail) }
			}
		},
		WAITING: {
			description: "Wait for a transaction to be confirmed on L1.",
			invoke: {
				src: "waitForTransaction",
				input: ({ context: { sentTransaction, worker, network } }) => {
					if (sentTransaction) return { ...sentTransaction, worker, network }
					throw new TransactionMachineError("No sent transaction was found.")
				},
				onDone: {
					target: "DONE",
					actions: enqueueActions(({ context, event, enqueue }) => {
						const { db } = context
						enqueue.assign({ result: db.createResult({ hash: event.output }) })
						db.confirmTransaction()
					})
				},
				onError: { target: "FAILED", actions: assign(fail) }
			}
		},
		DONE: { type: "final" },
		FAILED: { type: "final" }
	}
})
