import { useState, useEffect } from "react"
import { MultisigTable } from "./MultisigTable"
import { CreateMultisigForm } from "./CreateMultisigForm"
import { Multisig } from "@/models/multisig"
import { NetworkEnum, NETWORK_OPTIONS } from "@/models/network-type"
import { MULTISIG_QUERIES } from "@/models/queries"
import { GraphQLClient } from "@/utils/graphql-client"
import { Modal } from "@mui/material"

interface Signer {
	id: number
	publicKey: string
}

export default function MultisigManagement() {
	const [apiKey, setApiKey] = useState("7810")
	const [endpoint, setEndpoint] = useState("http://localhost:3001/graphql")
	const [client, setClient] = useState<GraphQLClient | null>(null)
	const [multisigs, setMultisigs] = useState<Multisig[]>([])
	const [signers, setSigners] = useState<Signer[]>([])
	const [selectedNetwork, setSelectedNetwork] = useState<NetworkEnum | "">("mina_mainnet")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")

	// Modal state
	const [showCreateModal, setShowCreateModal] = useState(false)

	// Initialize client
	useEffect(() => {
		if (apiKey && endpoint) {
			setClient(new GraphQLClient(endpoint, apiKey))
		}
	}, [apiKey, endpoint])

	// Fetch multisigs
	const fetchMultisigs = async () => {
		if (!client) return

		setLoading(true)
		setError("")
		try {
			const data = await client.query<{ multisigs: Multisig[] }>(MULTISIG_QUERIES.GET_MULTISIGS, {
				network: selectedNetwork || undefined
			})
			setMultisigs(data.multisigs)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch multisigs")
		} finally {
			setLoading(false)
		}
	}

	// Fetch signers (for the create form)
	const fetchSigners = async () => {
		if (!client) return

		try {
			const data = await client.query<{ signers: Signer[] }>(MULTISIG_QUERIES.GET_SIGNERS)
			setSigners(data.signers)
		} catch (err) {
			console.error("Failed to fetch signers:", err)
		}
	}

	useEffect(() => {
		if (client) {
			fetchMultisigs()
			fetchSigners()
		}
	}, [client, selectedNetwork])

	// Create multisig
	const createMultisig = async (input: {
		signerId: number
		signature: string
		data: string
		network: NetworkEnum
		deadline: number
	}) => {
		if (!client) return

		try {
			await client.query(MULTISIG_QUERIES.CREATE_MULTISIG, {
				input
			})
			setShowCreateModal(false)
			fetchMultisigs()
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to create multisig")
		}
	}

	// Delete multisig
	const deleteMultisig = async (id: number) => {
		if (!client) return

		try {
			await client.query(MULTISIG_QUERIES.DELETE_MULTISIG, { id })
			fetchMultisigs()
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to delete multisig")
		}
	}

	return (
		<div className="flex-1 bg-gray-50 p-8">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-900 mb-8">Multisig Management</h1>

				{/* API Configuration */}
				<div className="bg-white rounded-lg shadow p-6 mb-6">
					<h2 className="text-xl font-semibold mb-4">API Configuration</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">API Endpoint</label>
							<input
								type="text"
								value={endpoint}
								onChange={(e) => setEndpoint(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="https://your-api.com/graphql"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
							<input
								type="password"
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="Enter your API key"
							/>
						</div>
					</div>
				</div>

				{/* Filters and Actions */}
				{client && (
					<>
						<div className="bg-white rounded-lg shadow p-6 mb-6">
							<div className="flex flex-wrap items-center justify-between gap-4">
								<div className="flex items-center gap-4">
									<label className="text-sm font-medium text-gray-700">Filter by Network:</label>
									<select
										value={selectedNetwork}
										onChange={(e) => setSelectedNetwork(e.target.value as NetworkEnum | "")}
										className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									>
										<option value="">All Networks</option>
										{NETWORK_OPTIONS.map((opt) => (
											<option key={opt.value} value={opt.value}>
												{opt.label}
											</option>
										))}
									</select>
								</div>
								<button
									onClick={() => setShowCreateModal(true)}
									className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
								>
									Add Multisig
								</button>
							</div>
						</div>

						{/* Error Message */}
						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">{error}</div>
						)}

						{/* Multisig Table */}
						<div className="bg-white rounded-lg shadow overflow-auto max-h-[600px]">
							<MultisigTable multisigs={multisigs} loading={loading} onDelete={deleteMultisig} />
						</div>
					</>
				)}

				{/* Create Modal */}
				{showCreateModal && (
					<Modal onClose={() => setShowCreateModal(false)} title="Create Multisig Transaction">
						<CreateMultisigForm
							signers={signers}
							onSubmit={createMultisig}
							onCancel={() => setShowCreateModal(false)}
						/>
					</Modal>
				)}
			</div>
		</div>
	)
}
