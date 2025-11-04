import { Field, MerkleMap, Mina, Poseidon, PublicKey, Struct, UInt32 } from "o1js"

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
		genesisTimestamp: 1717545600000, // "2024-06-04T16:00:00.000000-08:00"
		slotTime: 180000 // 3 min in ms
	},
	"mina:devnet": {
		genesisTimestamp: 1712696400000, // "2024-04-09T13:00:00.000000-08:00"
		slotTime: 180000
	},
	"zeko:mainnet": {
		genesisTimestamp: 1762246260891, // "2025-11-04T08:51:00.891794Z"
		slotTime: 180000
	},
	"zeko:testnet": {
		genesisTimestamp: 1762246260891, // "2025-11-04T08:51:00.891794Z"
		slotTime: 180000
	}
}

class UpdateSignerInfo extends Struct({
	// old signer root
	oldRoot: Field,
	// new signer root
	newRoot: Field,
	// deadline to use this signature
	deadlineSlot: UInt32
}) {
	constructor(value: {
		oldRoot: Field
		newRoot: Field
		deadlineSlot: UInt32
	}) {
		super(value)
	}

	/**
	 * Data use to create the signature
	 * @returns array of field of all parameters
	 */
	toFields(): Field[] {
		return UpdateSignerInfo.toFields(this)
	}

	hash(): Field {
		return Poseidon.hashWithPrefix("UpdateSigner", this.toFields())
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

export function hashUpdateSignerData(data: UpdateSignerData): string[] {
	const updateSigner = new UpdateSignerInfo({
		oldRoot: Field.from(data.oldRoot),
		newRoot: Field.from(data.newRoot),
		deadlineSlot: UInt32.from(data.deadlineSlot)
	})

	// return an array to sign
	return updateSigner.toFields().map((f) => f.toString())
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
