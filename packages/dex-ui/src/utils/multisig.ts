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

// Network constants pour Mina (à ajuster selon votre réseau)
const NETWORK_CONSTANTS = {
	"mina:mainnet": {
		genesisTimestamp: 1615939200000, // March 17, 2021
		slotTime: 180000 // 3 minutes en millisecondes
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

/**
 * Calcule le slot depuis un timestamp
 */
export function getSlotFromTimestamp(timestamp: number, network: keyof typeof NETWORK_CONSTANTS): number {
	const { genesisTimestamp, slotTime } = NETWORK_CONSTANTS[network]
	const slotCalculated = Math.floor((timestamp - genesisTimestamp) / slotTime)
	return slotCalculated
}

/**
 * Hash les données UpdateSignerData pour créer le message à signer
 */
export async function hashUpdateSignerData(data: UpdateSignerData): Promise<string[]> {
	// Import dynamique de o1js
	const { Field, Poseidon } = await import("o1js")

	const oldRootField = data.oldRoot === "" ? Field.from(0) : Field.from(data.oldRoot)
	const newRootField = Field.from(data.newRoot)
	const deadlineSlotField = Field.from(data.deadlineSlot)

	// Structure: [oldRoot, newRoot, deadlineSlot]
	const fields = [oldRootField, newRootField, deadlineSlotField]

	// Return fields as strings pour signature
	return fields.map((f) => f.toString())
}

/**
 * Créer les données UpdateSignerData en JSON string
 */
export function serializeUpdateSignerData(data: UpdateSignerData): string {
	return JSON.stringify(data)
}

/**
 * Demande à AuroWallet de se connecter
 */
export async function connectAuroWallet(): Promise<string | null> {
	if (!window.mina) {
		throw new Error("AuroWallet is not installed")
	}

	try {
		const accounts = await window.mina.requestAccounts()
		return accounts[0] || null
	} catch (error) {
		console.error("Failed to connect to AuroWallet:", error)
		throw error
	}
}

/**
 * Obtenir les comptes connectés
 */
export async function getAuroAccounts(): Promise<string[]> {
	if (!window.mina) {
		return []
	}

	try {
		return await window.mina.getAccounts()
	} catch (error) {
		console.error("Failed to get accounts:", error)
		return []
	}
}

/**
 * Signer des fields avec AuroWallet
 */
export async function signWithAuro(fields: string[]): Promise<{
	signature: string
	publicKey: string
}> {
	if (!window.mina) {
		throw new Error("AuroWallet is not installed")
	}

	try {
		const accounts = await window.mina.getAccounts()
		if (accounts.length === 0) {
			throw new Error("No accounts connected")
		}

		const result = await window.mina.signFields({
			message: fields
		})

		// Combiner field et scalar pour former la signature complète
		const signature = result.signature

		return {
			signature,
			publicKey: accounts[0]
		}
	} catch (error) {
		console.error("Failed to sign with AuroWallet:", error)
		throw error
	}
}

/**
 * Construire le merkle root depuis les signers (simulé côté frontend)
 * Note: Dans un cas réel, ce root devrait venir du backend
 */
export async function buildMerkleRoot(signers: { publicKey: string; permission: number }[]): Promise<string> {
	const { Field, Poseidon, PublicKey } = await import("o1js")

	// Simuler le hash des permissions (à adapter selon votre logique)
	const permissionHashes = signers.map((signer) => {
		const pk = PublicKey.fromBase58(signer.publicKey)
		const pkHash = Poseidon.hash(pk.toFields())
		// Hash de la permission (à adapter selon votre struct)
		const permissionField = Field.from(signer.permission)
		return { pkHash, permissionField }
	})

	// Pour simplifier, on retourne juste un hash
	// Dans la réalité, vous devriez construire un vrai MerkleMap
	const allFields = permissionHashes.flatMap((p) => [p.pkHash, p.permissionField])
	const root = Poseidon.hash(allFields)

	return root.toString()
}
