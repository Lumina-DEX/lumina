import { Field, MerkleMap, Poseidon, PublicKey } from "o1js"

declare global {
	interface Window {
		mina?: {
			requestAccounts: () => Promise<string[]>
			signFields: (args: { message: string[] }) => Promise<{
				signature: string
			}>
			getAccounts: () => Promise<string[]>
		}
	}
}

const NETWORK_CONSTANTS = {
	"mina:mainnet": {
		genesisTimestamp: 1615939200000, // March 17, 2021
		slotTime: 180000 // 3 min in ms
	},
	"mina:devnet": {
		genesisTimestamp: 1615939200000,
		slotTime: 180000
	},
	"zeko:mainnet": {
		genesisTimestamp: 1615939200000,
		slotTime: 180000
	},
	"zeko:testnet": {
		genesisTimestamp: 1615939200000,
		slotTime: 180000
	}
}

export interface UpdateSignerData {
	oldRoot: string
	newRoot: string
	deadlineSlot: number
}

export function getSlotFromTimestamp(timestamp: number, network: keyof typeof NETWORK_CONSTANTS): number {
	const { genesisTimestamp, slotTime } = NETWORK_CONSTANTS[network]
	const slotCalculated = Math.floor((timestamp - genesisTimestamp) / slotTime)
	return slotCalculated
}

export async function hashUpdateSignerData(data: UpdateSignerData): Promise<string[]> {
	const oldRootField = data.oldRoot === "" ? Field.from(0) : Field.from(data.oldRoot)
	const newRootField = Field.from(data.newRoot)
	const deadlineSlotField = Field.from(data.deadlineSlot)

	// Structure: [oldRoot, newRoot, deadlineSlot]
	const fields = [oldRootField, newRootField, deadlineSlotField]

	// Return fields as strings pour signature
	return fields.map((f) => f.toString())
}

export function serializeUpdateSignerData(data: UpdateSignerData): string {
	return JSON.stringify(data)
}

export async function signWithAuro(fields: string[]): Promise<string> {
	if (!window.mina) {
		throw new Error("AuroWallet is not installed")
	}

	try {
		const result = await window.mina.signFields({
			message: fields
		})

		return result.signature
	} catch (error) {
		console.error("Failed to sign with AuroWallet:", error)
		throw error
	}
}

export function buildMerkleRoot(signers: { publicKey: string; permission: number }[]): string {
	const merkle = new MerkleMap()

	signers.forEach((x) => {
		const rightHash = Poseidon.hash(Field(x.permission).toFields())
		const pubKey = PublicKey.fromBase58(x.publicKey)
		merkle.set(Poseidon.hash(pubKey.toFields()), rightHash)
	})

	return merkle.getRoot().toString()
}
