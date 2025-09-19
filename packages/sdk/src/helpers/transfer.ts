import type { ZkappCommand } from "@aurowallet/mina-provider"
import { type DBSchema, openDB } from "idb"
import { hash } from "ohash"
import type { Networks } from "../machines/wallet/types"

const baseUrl = {
	"mina:devnet": "https://minascan.io/devnet",
	"mina:mainnet": "https://minascan.io/mainnet",
	"zeko:testnet": "https://zekoscan.io/testnet",
	"zeko:mainnet": "https://zekoscan.io/mainnet"
} as const

export interface SavedTransaction {
	timestamp: number
	confirmed: boolean
	network: Networks
	account: string
	transaction: string
	zkappCommand: ZkappCommand
	hash: string
	zkAppId: string
	id: string
}

interface LuminaDexDB extends DBSchema {
	transactions: {
		value: SavedTransaction
		key: string
		indexes: { "by-id": string }
	}
}

export const createDb = () =>
	openDB<LuminaDexDB>("Lumina-Dex", 1, {
		upgrade(db) {
			const store = db.createObjectStore("transactions", { keyPath: "id" })
			store.createIndex("by-id", "id")
		}
	})

export const hashDb = ({
	network,
	account,
	transaction,
	db = createDb()
}: {
	db?: ReturnType<typeof createDb>
	network: Networks
	account: string
	transaction: string
}) => {
	const id = hash(transaction)
	const findUnconfirmed = async () => {
		const transactions = await (await db).getAllFromIndex("transactions", "by-id", id)
		return transactions.find((t) => t.confirmed === false)
	}

	const saveSigned = async ({
		hash,
		confirmed,
		zkAppId,
		zkappCommand
	}: { hash: string; confirmed: boolean; zkAppId: string; zkappCommand: ZkappCommand }) => {
		const toStore = {
			id,
			timestamp: Date.now(),
			network,
			account,
			hash,
			zkAppId,
			zkappCommand,
			transaction
		}
		await (await db).put("transactions", { ...toStore, confirmed })
		console.log(`Transaction confirmed:${confirmed} saved.`, toStore)
	}

	const confirmTransaction = async () => {
		const DB = await db
		const tx = await DB.get("transactions", id)
		if (!tx) throw new Error("Transaction not found")
		tx.confirmed = true
		await DB.put("transactions", tx)
	}

	const createResult = ({ hash }: { hash: string }) => {
		return { hash, url: createExplorerUrl({ network, hash }) }
	}
	return { saveSigned, confirmTransaction, findUnconfirmed, createResult }
}

export const createExplorerUrl = ({ network, hash }: { network: Networks; hash: string }) =>
	`${baseUrl[network]}/account/${hash}/zk-txs` as const

export type HashDb = ReturnType<typeof hashDb>
