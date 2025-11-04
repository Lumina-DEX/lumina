import { NetworkEnum, networkEnumToValue, NETWORK_OPTIONS } from "@/models/network-type"
import { MULTISIG_QUERIES, SIGNER_QUERIES, FACTORY_QUERIES } from "@/models/queries"
import { Signer } from "@/models/signer"
import { GraphQLClient } from "@/utils/graphql-client"
import {
	getSlotFromTimestamp,
	UpdateSignerData,
	hashUpdateSignerData,
	signWithAuro,
	serializeUpdateSignerData,
	buildMerkleRoot
} from "@/utils/multisig"
import { useSelector } from "@lumina-dex/sdk/react"
import { useState, useEffect, useContext, useEffectEvent } from "react"
import { LuminaContext } from "../Layout"

interface DeployFactoryFormProps {
	signers: Signer[]
	client: GraphQLClient
	onSuccess: (jobId: string) => void
	onCancel: () => void
}

export function DeployFactoryForm({ signers, client, onSuccess, onCancel }: DeployFactoryFormProps) {
	const [network, setNetwork] = useState<NetworkEnum>("mina_mainnet")
	const [deadlineDate, setDeadlineDate] = useState("")
	const [oldRoot, setOldRoot] = useState<string>("0")
	const [merkleRoot, setMerkleRoot] = useState<string>("")
	const [protocol, setProtocol] = useState<string>("B62qpBKidvBH2YEWCwwkzLMFoBWa2fZknj6K5YWdqF5wAiLgoTExh42")
	const [delegator, setDelegator] = useState<string>("B62qmibKL59uByUjbWmXYBPLhhs5GbUYSBWGThsEqkHkdNcU7FCdfYy")
	const [isDeploying, setIsDeploying] = useState(false)
	const [networkSigners, setNetworkSigners] = useState<Signer[]>([])
	const [error, setError] = useState<string>("")
	const { Wallet } = useContext(LuminaContext)
	const walletState = useSelector(Wallet, (state) => state.value)
	const walletContext = useSelector(Wallet, (state) => state.context)

	// Set default date to 1 day from now
	useEffect(() => {
		const now = new Date()
		now.setDate(now.getDate() + 1)
		const dateStr = now.toISOString().split("T")[0]
		setDeadlineDate(dateStr)
	}, [])

	// Fetch signers and calculate merkle root when network changes
	useEffect(() => {
		if (network) {
			fetchNetworkSigners(network)
		}
	}, [network])

	const handleConnectWallet = useEffectEvent(() => {
		Wallet.send({ type: "Connect" })
	})

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
				const rootHash = buildMerkleRoot(activeSigners)
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

	const validateInputs = (): boolean => {
		if (walletState === "INIT") {
			setError("Please connect your wallet first")
			return false
		}

		if (!merkleRoot) {
			setError("Merkle root not available for this network")
			return false
		}

		if (!deadlineDate) {
			setError("Please select a deadline date")
			return false
		}

		if (!protocol.trim()) {
			setError("Please enter the protocol address")
			return false
		}

		if (!delegator.trim()) {
			setError("Please enter the delegator address")
			return false
		}

		// Validate Mina addresses (basic validation)
		const addressRegex = /^B62[1-9A-HJ-NP-Za-km-z]{52}$/
		if (!addressRegex.test(protocol)) {
			setError("Invalid protocol address format")
			return false
		}

		if (!addressRegex.test(delegator)) {
			setError("Invalid delegator address format")
			return false
		}

		return true
	}

	const handleDeployFactory = async () => {
		if (!validateInputs()) {
			return
		}

		setIsDeploying(true)
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
			const fieldsToSign = hashUpdateSignerData(updateData)

			// Sign with AuroWallet
			const signature = await signWithAuro(fieldsToSign)

			// Find signer ID from public key
			const signer = signers.find((s) => s.publicKey === walletContext.account)
			if (!signer) {
				throw new Error("Connected wallet public key does not match any signer")
			}

			// Serialize data for storage
			const serializedData = serializeUpdateSignerData(updateData)

			// 1. Create the multisig signature in database
			const multisigResponse = await client.query<{ createMultisig: { id: number } }>(
				MULTISIG_QUERIES.CREATE_MULTISIG,
				{
					input: {
						signerId: signer.id,
						signature,
						data: serializedData,
						network,
						deadline: Math.floor(deadlineTimestamp / 1000)
					}
				}
			)

			console.log("Multisig created:", multisigResponse.createMultisig.id)

			// 2. Deploy the factory
			const factoryResponse = await client.query<{ deployFactory: { id: string; status: string } }>(
				FACTORY_QUERIES.DEPLOY_FACTORY,
				{
					input: {
						deployer: walletContext.account,
						network,
						protocol,
						delegator,
						data: serializedData
					}
				}
			)

			console.log("Factory deployment job created:", factoryResponse.deployFactory.id)

			// Success callback with job ID
			onSuccess(factoryResponse.deployFactory.id)
		} catch (error) {
			console.error("Failed to deploy factory:", error)
			setError(error instanceof Error ? error.message : "Failed to deploy factory")
		} finally {
			setIsDeploying(false)
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
				<label className="block text-sm font-medium text-gray-700 mb-2">Deployer Wallet</label>
				{walletState === "READY" ? (
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 bg-green-500 rounded-full"></div>
							<span className="text-sm font-mono text-gray-700">
								{walletContext.account.slice(0, 8)}...{walletContext.account.slice(-6)}
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

			{/* Protocol Address */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">Protocol Address</label>
				<input
					type="text"
					value={protocol}
					onChange={(e) => setProtocol(e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
					placeholder="B62q..."
					required
				/>
				<p className="text-xs text-gray-500 mt-1">The protocol fee recipient address</p>
			</div>

			{/* Delegator Address */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">Delegator Address</label>
				<input
					type="text"
					value={delegator}
					onChange={(e) => setDelegator(e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
					placeholder="B62q..."
					required
				/>
				<p className="text-xs text-gray-500 mt-1">The delegator address for the factory</p>
			</div>

			<div className="border-t pt-4">
				<h3 className="text-sm font-semibold text-gray-900 mb-3">Multisig Configuration</h3>

				{/* Old Merkle Root */}
				<div className="mb-4">
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
				</div>

				{/* New Merkle Root Display */}
				<div className="mb-4">
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
							networkSigners.filter((s) =>
								s.networks?.some((n) => n.network === networkEnumToValue(network) && n.active)
							).length
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
				</div>

				{/* Deadline Slot Info */}
				{deadlineDate && (
					<div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-md p-3 space-y-1 mt-3">
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
			</div>

			{/* Action Buttons */}
			<div className="flex justify-end gap-3 pt-4 border-t">
				<button
					type="button"
					onClick={onCancel}
					className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
					disabled={isDeploying}
				>
					Cancel
				</button>
				<button
					onClick={handleDeployFactory}
					disabled={walletState !== "READY" || !merkleRoot || isDeploying}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
				>
					{isDeploying ? "Deploying..." : "Deploy Factory"}
				</button>
			</div>
		</div>
	)
}
