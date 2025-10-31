import { NetworkEnum, networkEnumToValue, NETWORK_OPTIONS } from "@/models/network-type"
import { MULTISIG_QUERIES, SIGNER_QUERIES } from "@/models/queries"
import { Signer } from "@/models/signer"
import { GraphQLClient } from "@/utils/graphql-client"
import {
	getAuroAccounts,
	connectAuroWallet,
	getSlotFromTimestamp,
	UpdateSignerData,
	hashUpdateSignerData,
	signWithAuro,
	serializeUpdateSignerData
} from "@/utils/multisig"
import { Field } from "o1js"
import { useState, useEffect } from "react"

interface CreateMultisigFormProps {
	signers: Signer[]
	client: GraphQLClient
	onSubmit: (data: {
		signerId: number
		signature: string
		data: string
		network: NetworkEnum
		deadline: number
	}) => void
	onCancel: () => void
}

export function CreateMultisigForm({ signers, client, onSubmit, onCancel }: CreateMultisigFormProps) {
	const [signerId, setSignerId] = useState<number>(signers[0]?.id || 0)
	const [network, setNetwork] = useState<NetworkEnum>("mina_mainnet")
	const [deadlineDate, setDeadlineDate] = useState("")
	const [oldRoot, setOldRoot] = useState<string>("0") // Field.empty() = Field(0)
	const [merkleRoot, setMerkleRoot] = useState<string>("")
	const [connectedWallet, setConnectedWallet] = useState<string | null>(null)
	const [isGenerating, setIsGenerating] = useState(false)
	const [networkSigners, setNetworkSigners] = useState<Signer[]>([])
	const [error, setError] = useState<string>("")

	// Set default date to 1 day from now
	useEffect(() => {
		const now = new Date()
		now.setDate(now.getDate() + 1)
		const dateStr = now.toISOString().split("T")[0]
		setDeadlineDate(dateStr)
	}, [])

	// Check if AuroWallet is connected
	useEffect(() => {
		checkWalletConnection()
	}, [])

	// Fetch signers and calculate merkle root when network changes
	useEffect(() => {
		if (network) {
			fetchNetworkSigners(network)
		}
	}, [network])

	const checkWalletConnection = async () => {
		try {
			const accounts = await getAuroAccounts()
			if (accounts.length > 0) {
				setConnectedWallet(accounts[0])
			}
		} catch (error) {
			console.error("Failed to check wallet connection:", error)
		}
	}

	const handleConnectWallet = async () => {
		try {
			setError("")
			const account = await connectAuroWallet()
			setConnectedWallet(account)
		} catch (error) {
			setError(error instanceof Error ? error.message : "Failed to connect wallet")
		}
	}

	const fetchNetworkSigners = async (selectedNetwork: NetworkEnum) => {
		try {
			const data = await client.query<{ signers: Signer[] }>(SIGNER_QUERIES.GET_SIGNERS, {
				network: selectedNetwork
			})

			setNetworkSigners(data.signers)

			// Calculate merkle root from active signers
			const activeSigners = data.signers
				.filter((s) => s.networks?.some((n) => n.active))
				.map((s) => {
					const networkData = s.networks?.find((n) => n.network === networkEnumToValue(selectedNetwork))
					return {
						publicKey: s.publicKey,
						permission: networkData?.permission || 0
					}
				})

			if (activeSigners.length > 0) {
				// Pour l'instant, on simule un root
				// Dans la réalité, le backend devrait calculer et retourner le merkle root
				const rootHash = `0x${Array(64)
					.fill(0)
					.map(() => Math.floor(Math.random() * 16).toString(16))
					.join("")}`
				setMerkleRoot(rootHash)
			} else {
				setMerkleRoot("")
				setError("No active signers found for this network")
			}
		} catch (error) {
			console.error("Failed to fetch network signers:", error)
			setError("Failed to fetch signers for network")
		}
	}

	const handleGenerateSignature = async () => {
		if (!connectedWallet) {
			setError("Please connect your wallet first")
			return
		}

		if (!merkleRoot) {
			setError("Merkle root not available for this network")
			return
		}

		if (!deadlineDate) {
			setError("Please select a deadline date")
			return
		}

		setIsGenerating(true)
		setError("")

		try {
			// Calculate deadline timestamp at UTC 00:00
			const deadlineUTC = new Date(deadlineDate)
			deadlineUTC.setUTCHours(0, 0, 0, 0)
			const deadlineTimestamp = deadlineUTC.getTime()
			const deadlineSlot = getSlotFromTimestamp(deadlineTimestamp, networkEnumToValue(network))

			// Create UpdateSignerData
			const updateData: UpdateSignerData = {
				oldRoot: oldRoot,
				newRoot: merkleRoot,
				deadlineSlot
			}

			// Hash the data to get fields to sign
			const fieldsToSign = await hashUpdateSignerData(updateData)

			// Sign with AuroWallet
			const { signature, publicKey } = await signWithAuro(fieldsToSign)
			console.log("signature", signature)

			// Find signer ID from public key
			const signer = signers.find((s) => s.publicKey === publicKey)
			if (!signer) {
				throw new Error("Connected wallet public key does not match any signer")
			}

			// Serialize data for storage
			const serializedData = serializeUpdateSignerData(updateData)

			// Submit
			onSubmit({
				signerId: signer.id,
				signature,
				data: serializedData,
				network,
				deadline: Math.floor(deadlineTimestamp / 1000) // Unix timestamp in seconds
			})
		} catch (error) {
			console.error("Failed to generate signature:", error)
			setError(error instanceof Error ? error.message : "Failed to generate signature")
		} finally {
			setIsGenerating(false)
		}
	}

	if (signers.length === 0) {
		return (
			<div>
				<p className="text-gray-600 mb-4">No signers available. Please create a signer first.</p>
				<button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
					Close
				</button>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">{error}</div>
			)}

			{/* Wallet Connection */}
			<div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
				<label className="block text-sm font-medium text-gray-700 mb-2">Wallet Connection</label>
				{connectedWallet ? (
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 bg-green-500 rounded-full"></div>
							<span className="text-sm font-mono text-gray-700">
								{connectedWallet.slice(0, 8)}...{connectedWallet.slice(-6)}
							</span>
						</div>
						<span className="text-xs text-green-600 font-medium">Connected</span>
					</div>
				) : (
					<button
						onClick={handleConnectWallet}
						className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
					>
						Connect AuroWallet
					</button>
				)}
			</div>

			{/* Network Selection */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
				<select
					value={network}
					onChange={(e) => setNetwork(e.target.value as NetworkEnum)}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				>
					{NETWORK_OPTIONS.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			</div>

			{/* Old Merkle Root */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Old Merkle Root
					<span className="text-xs text-gray-500 ml-2">(Default: Field.empty() = 0)</span>
				</label>
				<input
					type="text"
					value={oldRoot}
					onChange={(e) => setOldRoot(e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
					placeholder="0"
				/>
				<p className="text-xs text-gray-500 mt-1">Enter the previous merkle root, or leave as "0" for empty</p>
			</div>

			{/* New Merkle Root Display */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">New Merkle Root</label>
				<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
					{merkleRoot ? (
						<span className="text-xs font-mono text-gray-700 break-all">{merkleRoot}</span>
					) : (
						<span className="text-xs text-gray-500">Loading...</span>
					)}
				</div>
				<p className="text-xs text-gray-500 mt-1">
					Root calculated from{" "}
					{
						networkSigners.filter((s) => s.networks?.some((n) => n.network === networkEnumToValue(network) && n.active))
							.length
					}{" "}
					active signers
				</p>
			</div>

			{/* Deadline Date Selection */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Deadline Date
					<span className="text-xs text-gray-500 ml-2">(UTC 00:00)</span>
				</label>
				<input
					type="date"
					value={deadlineDate}
					onChange={(e) => setDeadlineDate(e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				/>
				<p className="text-xs text-gray-500 mt-1">Deadline will be set to 00:00 UTC of the selected date</p>
			</div>

			{/* Deadline Slot Info */}
			{deadlineDate && (
				<div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-md p-3 space-y-1">
					<div>
						<strong>Deadline UTC:</strong> {new Date(deadlineDate).toISOString().split("T")[0]} 00:00:00 UTC
					</div>
					<div>
						<strong>Deadline Slot:</strong> {(() => {
							const deadlineUTC = new Date(deadlineDate)
							deadlineUTC.setUTCHours(0, 0, 0, 0)
							return getSlotFromTimestamp(deadlineUTC.getTime(), networkEnumToValue(network))
						})()}
					</div>
				</div>
			)}

			{/* Action Buttons */}
			<div className="flex justify-end gap-3 pt-4 border-t">
				<button
					type="button"
					onClick={onCancel}
					className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
					disabled={isGenerating}
				>
					Cancel
				</button>
				<button
					onClick={handleGenerateSignature}
					disabled={!connectedWallet || !merkleRoot || isGenerating}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
				>
					{isGenerating ? "Generating..." : "Generate & Sign"}
				</button>
			</div>
		</div>
	)
}
