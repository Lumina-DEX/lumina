import { useState, useEffect } from "react"

// Types
type Network = "mina_mainnet" | "mina_devnet" | "zeko_mainnet" | "zeko_testnet"

interface SignerNetwork {
	id: number
	signerId: number
	network: Network
	permission: number
	active: boolean
	createdAt: Date
}

interface Signer {
	id: number
	publicKey: string
	createdAt: Date
	networks?: SignerNetwork[]
}

// GraphQL Client
class GraphQLClient {
	constructor(
		private endpoint: string,
		private apiKey: string
	) {}

	async query<T>(query: string, variables?: Record<string, any>): Promise<T> {
		const response = await fetch(this.endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.apiKey}`
			},
			body: JSON.stringify({ query, variables })
		})

		const result = await response.json()
		if (result.errors) {
			throw new Error(result.errors[0].message)
		}
		return result.data
	}
}

// Queries & Mutations
const QUERIES = {
	GET_SIGNERS: `
		query GetSigners($network: Network) {
			signers(network: $network) {
				id
				publicKey
				createdAt
				networks {
					id
					signerId
					network
					permission
					active
					createdAt
				}
			}
		}
	`,
	CREATE_SIGNER: `
		mutation CreateSigner($input: CreateSignerInput!) {
			createSigner(input: $input) {
				id
				publicKey
				createdAt
			}
		}
	`,
	CREATE_SIGNER_NETWORK: `
		mutation CreateSignerNetwork($input: CreateSignerNetworkInput!) {
			createSignerNetwork(input: $input) {
				id
				signerId
				network
				permission
				active
			}
		}
	`,
	UPDATE_SIGNER_NETWORK: `
		mutation UpdateSignerNetwork($signerId: Int!, $network: Network!, $input: UpdateSignerNetworkInput!) {
			updateSignerNetwork(signerId: $signerId, network: $network, input: $input) {
				id
				signerId
				network
				permission
				active
			}
		}
	`
}

// Main Component
export default function SignerManagement() {
	const [apiKey, setApiKey] = useState("")
	const [endpoint, setEndpoint] = useState("https://your-api.com/graphql")
	const [client, setClient] = useState<GraphQLClient | null>(null)
	const [signers, setSigners] = useState<Signer[]>([])
	const [selectedNetwork, setSelectedNetwork] = useState<Network | "">("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")

	// Modals state
	const [showCreateSigner, setShowCreateSigner] = useState(false)
	const [showAddNetwork, setShowAddNetwork] = useState(false)
	const [showEditNetwork, setShowEditNetwork] = useState(false)
	const [selectedSigner, setSelectedSigner] = useState<Signer | null>(null)
	const [selectedSignerNetwork, setSelectedSignerNetwork] = useState<SignerNetwork | null>(null)

	// Initialize client when API key changes
	useEffect(() => {
		if (apiKey && endpoint) {
			setClient(new GraphQLClient(endpoint, apiKey))
		}
	}, [apiKey, endpoint])

	// Fetch signers
	const fetchSigners = async () => {
		if (!client) return

		setLoading(true)
		setError("")
		try {
			const data = await client.query<{ signers: Signer[] }>(QUERIES.GET_SIGNERS, {
				network: selectedNetwork || undefined
			})
			setSigners(data.signers)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch signers")
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (client) {
			fetchSigners()
		}
	}, [client, selectedNetwork])

	// Create signer
	const createSigner = async (publicKey: string) => {
		if (!client) return

		try {
			await client.query(QUERIES.CREATE_SIGNER, {
				input: { publicKey }
			})
			setShowCreateSigner(false)
			fetchSigners()
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to create signer")
		}
	}

	// Add network to signer
	const addNetwork = async (signerId: number, network: Network, permission: number) => {
		if (!client) return

		try {
			await client.query(QUERIES.CREATE_SIGNER_NETWORK, {
				input: {
					signerId,
					network,
					permission,
					active: true
				}
			})
			setShowAddNetwork(false)
			fetchSigners()
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to add network")
		}
	}

	// Update network configuration
	const updateNetwork = async (signerId: number, network: Network, permission?: number, active?: boolean) => {
		if (!client) return

		try {
			await client.query(QUERIES.UPDATE_SIGNER_NETWORK, {
				signerId,
				network,
				input: {
					...(permission !== undefined && { permission }),
					...(active !== undefined && { active })
				}
			})
			setShowEditNetwork(false)
			fetchSigners()
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to update network")
		}
	}

	// Toggle active status
	const toggleActive = async (signerNetwork: SignerNetwork) => {
		await updateNetwork(signerNetwork.signerId, signerNetwork.network, undefined, !signerNetwork.active)
	}

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-900 mb-8">Signer Management</h1>

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
										onChange={(e) => setSelectedNetwork(e.target.value as Network | "")}
										className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									>
										<option value="">All Networks</option>
										<option value="mina_mainnet">Mina Mainnet</option>
										<option value="mina_devnet">Mina Devnet</option>
										<option value="zeko_mainnet">Zeko Mainnet</option>
										<option value="zeko_testnet">Zeko Testnet</option>
									</select>
								</div>
								<button
									onClick={() => setShowCreateSigner(true)}
									className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
								>
									Add New Signer
								</button>
							</div>
						</div>

						{/* Error Message */}
						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">{error}</div>
						)}

						{/* Signers List */}
						<div className="bg-white rounded-lg shadow overflow-hidden">
							{loading ? (
								<div className="p-8 text-center text-gray-500">Loading...</div>
							) : signers.length === 0 ? (
								<div className="p-8 text-center text-gray-500">No signers found</div>
							) : (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													ID
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Public Key
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Networks
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Actions
												</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{signers.map((signer) => (
												<tr key={signer.id}>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{signer.id}</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
														{signer.publicKey.slice(0, 20)}...
													</td>
													<td className="px-6 py-4">
														{signer.networks && signer.networks.length > 0 ? (
															<div className="space-y-2">
																{signer.networks.map((network) => (
																	<div
																		key={network.id}
																		className="flex items-center justify-between bg-gray-50 p-2 rounded"
																	>
																		<div className="flex items-center gap-3">
																			<span className="text-sm font-medium text-gray-700">{network.network}</span>
																			<span className="text-xs text-gray-500">Permission: {network.permission}</span>
																			<span
																				className={`px-2 py-1 text-xs rounded ${
																					network.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
																				}`}
																			>
																				{network.active ? "Active" : "Inactive"}
																			</span>
																		</div>
																		<div className="flex gap-2">
																			<button
																				onClick={() => {
																					setSelectedSignerNetwork(network)
																					setShowEditNetwork(true)
																				}}
																				className="text-blue-600 hover:text-blue-800 text-sm"
																			>
																				Edit
																			</button>
																			<button
																				onClick={() => toggleActive(network)}
																				className="text-gray-600 hover:text-gray-800 text-sm"
																			>
																				{network.active ? "Deactivate" : "Activate"}
																			</button>
																		</div>
																	</div>
																))}
															</div>
														) : (
															<span className="text-sm text-gray-500">No networks configured</span>
														)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm">
														<button
															onClick={() => {
																setSelectedSigner(signer)
																setShowAddNetwork(true)
															}}
															className="text-blue-600 hover:text-blue-800"
														>
															Add Network
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</>
				)}

				{/* Create Signer Modal */}
				{showCreateSigner && (
					<Modal onClose={() => setShowCreateSigner(false)} title="Create New Signer">
						<CreateSignerForm onSubmit={createSigner} onCancel={() => setShowCreateSigner(false)} />
					</Modal>
				)}

				{/* Add Network Modal */}
				{showAddNetwork && selectedSigner && (
					<Modal onClose={() => setShowAddNetwork(false)} title="Add Network to Signer">
						<AddNetworkForm
							signer={selectedSigner}
							onSubmit={(network, permission) => addNetwork(selectedSigner.id, network, permission)}
							onCancel={() => setShowAddNetwork(false)}
						/>
					</Modal>
				)}

				{/* Edit Network Modal */}
				{showEditNetwork && selectedSignerNetwork && (
					<Modal onClose={() => setShowEditNetwork(false)} title="Edit Network Configuration">
						<EditNetworkForm
							signerNetwork={selectedSignerNetwork}
							onSubmit={(permission, active) =>
								updateNetwork(selectedSignerNetwork.signerId, selectedSignerNetwork.network, permission, active)
							}
							onCancel={() => setShowEditNetwork(false)}
						/>
					</Modal>
				)}
			</div>
		</div>
	)
}

// Modal Component
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-lg max-w-md w-full p-6">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-xl font-semibold">{title}</h3>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600">
						✕
					</button>
				</div>
				{children}
			</div>
		</div>
	)
}

// Create Signer Form
function CreateSignerForm({ onSubmit, onCancel }: { onSubmit: (publicKey: string) => void; onCancel: () => void }) {
	const [publicKey, setPublicKey] = useState("")

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!publicKey.trim()) return
		onSubmit(publicKey)
	}

	return (
		<form onSubmit={handleSubmit}>
			<div className="mb-4">
				<label className="block text-sm font-medium text-gray-700 mb-2">Public Key</label>
				<input
					type="text"
					value={publicKey}
					onChange={(e) => setPublicKey(e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="Enter public key"
					required
				/>
			</div>
			<div className="flex justify-end gap-3">
				<button
					type="button"
					onClick={onCancel}
					className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
				>
					Cancel
				</button>
				<button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
					Create
				</button>
			</div>
		</form>
	)
}

// Add Network Form
function AddNetworkForm({
	signer,
	onSubmit,
	onCancel
}: {
	signer: Signer
	onSubmit: (network: Network, permission: number) => void
	onCancel: () => void
}) {
	const [network, setNetwork] = useState<Network>("mina_mainnet")
	const [permission, setPermission] = useState(0)

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		onSubmit(network, permission)
	}

	// Get available networks (not already configured)
	const configuredNetworks = signer.networks?.map((n) => n.network) || []
	const availableNetworks: Network[] = ["mina_mainnet", "mina_devnet", "zeko_mainnet", "zeko_testnet"].filter(
		(n) => !configuredNetworks.includes(n as Network)
	) as Network[]

	if (availableNetworks.length === 0) {
		return (
			<div>
				<p className="text-gray-600 mb-4">All networks are already configured for this signer.</p>
				<button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
					Close
				</button>
			</div>
		)
	}

	return (
		<form onSubmit={handleSubmit}>
			<div className="mb-4">
				<label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
				<select
					value={network}
					onChange={(e) => setNetwork(e.target.value as Network)}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{availableNetworks.map((net) => (
						<option key={net} value={net}>
							{net}
						</option>
					))}
				</select>
			</div>
			<div className="mb-4">
				<label className="block text-sm font-medium text-gray-700 mb-2">Permission Level</label>
				<input
					type="number"
					value={permission}
					onChange={(e) => setPermission(parseInt(e.target.value))}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="0"
					min="0"
					required
				/>
			</div>
			<div className="flex justify-end gap-3">
				<button
					type="button"
					onClick={onCancel}
					className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
				>
					Cancel
				</button>
				<button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
					Add Network
				</button>
			</div>
		</form>
	)
}

// Edit Network Form
function EditNetworkForm({
	signerNetwork,
	onSubmit,
	onCancel
}: {
	signerNetwork: SignerNetwork
	onSubmit: (permission: number, active: boolean) => void
	onCancel: () => void
}) {
	const [permission, setPermission] = useState(signerNetwork.permission)
	const [active, setActive] = useState(signerNetwork.active)

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		onSubmit(permission, active)
	}

	return (
		<form onSubmit={handleSubmit}>
			<div className="mb-4">
				<label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
				<input
					type="text"
					value={signerNetwork.network}
					disabled
					className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
				/>
			</div>
			<div className="mb-4">
				<label className="block text-sm font-medium text-gray-700 mb-2">Permission Level</label>
				<input
					type="number"
					value={permission}
					onChange={(e) => setPermission(parseInt(e.target.value))}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					min="0"
					required
				/>
			</div>
			<div className="mb-4">
				<label className="flex items-center">
					<input
						type="checkbox"
						checked={active}
						onChange={(e) => setActive(e.target.checked)}
						className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<span className="text-sm font-medium text-gray-700">Active</span>
				</label>
			</div>
			<div className="flex justify-end gap-3">
				<button
					type="button"
					onClick={onCancel}
					className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
				>
					Cancel
				</button>
				<button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
					Update
				</button>
			</div>
		</form>
	)
}
