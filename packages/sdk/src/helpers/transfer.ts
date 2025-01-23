import { AccountUpdate, Field, Mina, PublicKey, type Types } from "o1js"
import { logger } from "./logs"

export const l1NodeUrl = "https://api.minascan.io/node/devnet/v1/graphql"

export const l1ArchiveUrl = "https://api.minascan.io/archive/devnet/v1/graphql"

const outerBridgePublicKey = PublicKey.fromBase58(
	"B62qpuhMDp748xtE77iBXRRaipJYgs6yumAeTzaM7zS9dn8avLPaeFF"
)

export const innerBridgePublicKey = PublicKey.fromBase58(
	"B62qjDedeP9617oTUeN8JGhdiqWg4t64NtQkHaoZB9wyvgSjAyupPU1"
)

export type Direction = "DEPOSIT" | "WITHDRAW"

type Action = {
	actions: string[][]
	hash: string
}
export const actionsToTransfer = (actions: Action[]) => {
	return actions.flat().map(({ actions, hash }) => {
		const [amount, x, yParity] = actions[0]
		return {
			amount,
			pk: PublicKey.from({ x: Field.from(x), isOdd: yParity === "1" }),
			actionState: Field.from(hash),
			json: actions
		}
	})
}

/**
 * We should find a better way to find the transfer.
 */
export const findTransfer = async (pk: PublicKey, amount: number) => {
	const actions = await Mina.fetchActions(outerBridgePublicKey)

	if ("error" in actions) throw new Error(JSON.stringify(actions))

	const transfer = actionsToTransfer(actions.reverse()).find(
		(action) => action.amount === amount.toString() && action.pk.equals(pk)
	)

	if (transfer === undefined) throw new Error("No matching transfer found")

	return transfer
}

export type Transfer = Awaited<ReturnType<typeof findTransfer>>

export const fetchTransfersExtension = async (actionState: Field) => {
	const actions = await Mina.fetchActions(outerBridgePublicKey, { fromActionState: actionState })

	if ("error" in actions) throw new Error(JSON.stringify(actions))

	return actionsToTransfer(actions)
}

export type After = Awaited<ReturnType<typeof fetchTransfersExtension>>

export const applyAccountUpdates = (tx: Mina.Transaction<false, false>, accountUpdates: string) => {
	// Append proved account update to the command
	for (const accountUpdate of JSON.parse(accountUpdates) as Types.Json.AccountUpdate[]) {
		const au = AccountUpdate.fromJSON(accountUpdate)
		logger.info({ accountUpdate, au })
		tx.transaction.accountUpdates.push(au)
	}
	return tx
}

export const sendTransaction = async (tx: Mina.Transaction<false, false> | string) => {
	const transaction = typeof tx === "string" ? tx : tx.toJSON()
	// Sign the transaction with the wallet
	const updateResult = await window.mina.sendTransaction({
		onlySign: false, // only sign zkCommond, not broadcast.
		transaction
	})
	// TODO: Save the hash in localStorage to track the state
	logger.success("Transaction sent", updateResult)
	return updateResult
}
