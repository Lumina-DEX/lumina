import { AccountUpdate, Field, Mina, PublicKey, type Types } from "o1js"
import type { WalletActorRef } from "../machines/wallet/actors"
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

export const sendTransaction = async (
	{ tx, wallet }: { tx: Mina.Transaction<false, false> | string; wallet: WalletActorRef }
) => {
	const transaction = typeof tx === "string" ? tx : tx.toJSON()
	const updateResult = await window.mina.sendTransaction({ onlySign: false, transaction })
	if (updateResult instanceof Error) {
		logger.error("Transaction failed", updateResult)
		throw updateResult
	}
	if ("hash" in updateResult) {
		const timestamp = Date.now()
		const { currentNetwork, account } = wallet.getSnapshot().context
		const hash = updateResult.hash
		const storageKey = `lumina-sdk-tx-${timestamp}-${currentNetwork}-${account}-${hash}`
		localStorage.setItem(
			storageKey,
			JSON.stringify({ timestamp, currentNetwork, account, hash, transaction })
		)
		logger.success("Transaction sent and saved to localStorage", updateResult)
		return {
			hash: updateResult.hash,
			url: `https://zekoscan.io/testnet/account/${updateResult.hash}/zk-txs`
		}
	}
	logger.warn("An unexpected transaction result was received", updateResult)
	return { hash: "", url: "" }
}
