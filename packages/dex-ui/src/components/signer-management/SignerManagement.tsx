import type { Networks } from "@lumina-dex/sdk"
import { useEffect, useState } from "react"
import { type NetworkEnum, networkValueToEnum } from "@/models/network-type"
import { SIGNER_QUERIES } from "@/models/queries"
import type { Signer, SignerNetwork } from "@/models/signer"
import { GraphQLClient } from "@/utils/graphql-client"
import { ApiConfiguration } from "../ApiConfiguration"
import { FilterBar } from "../FilterBar"
import { Modal } from "../Modal"
import { AddNetworkForm } from "./AddNetworkForm"
import { CreateSignerForm } from "./CreateSignerForm"
import { EditNetworkForm } from "./EditNetworkForm"
import { SignersTable } from "./SignersTable"

export default function SignerManagement() {
	const [apiKey, setApiKey] = useState("7810")
	const [endpoint, setEndpoint] = useState("http://localhost:3001/graphql")
	const [client, setClient] = useState<GraphQLClient | null>(null)
	const [signers, setSigners] = useState<Signer[]>([])
	const [selectedNetwork, setSelectedNetwork] = useState<NetworkEnum | "">("mina_mainnet")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")

	// Modals state
	const [showCreateSigner, setShowCreateSigner] = useState(false)
	const [showAddNetwork, setShowAddNetwork] = useState(false)
	const [showEditNetwork, setShowEditNetwork] = useState(false)
	const [selectedSigner, setSelectedSigner] = useState<Signer | null>(null)
	const [selectedSignerNetwork, setSelectedSignerNetwork] = useState<SignerNetwork | null>(null)

	// Editing permission state
	const [editingPermission, setEditingPermission] = useState<{ networkId: number; value: number } | null>(null)

	// Initialize client
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
			const data = await client.query<{ signers: Signer[] }>(SIGNER_QUERIES.GET_SIGNERS, {
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
			await client.query(SIGNER_QUERIES.CREATE_SIGNER, {
				input: { publicKey }
			})
			setShowCreateSigner(false)
			fetchSigners()
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to create signer")
		}
	}

	// Add network to signer
	const addNetwork = async (signerId: number, network: NetworkEnum, permission: number) => {
		if (!client) return

		try {
			await client.query(SIGNER_QUERIES.CREATE_SIGNER_NETWORK, {
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
	const updateNetwork = async (signerId: number, network: Networks, permission?: number, active?: boolean) => {
		if (!client) return

		try {
			const networkEnum = networkValueToEnum(network)

			await client.query(SIGNER_QUERIES.UPDATE_SIGNER_NETWORK, {
				signerId,
				network: networkEnum,
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

	// Handlers
	const handleToggleActive = async (signerNetwork: SignerNetwork) => {
		await updateNetwork(signerNetwork.signerId, signerNetwork.network, undefined, !signerNetwork.active)
	}

	const handleSavePermission = async (signerNetwork: SignerNetwork, newPermission: number) => {
		if (newPermission === signerNetwork.permission) {
			setEditingPermission(null)
			return
		}
		await updateNetwork(signerNetwork.signerId, signerNetwork.network, newPermission, undefined)
		setEditingPermission(null)
	}

	const handleEditNetwork = (network: SignerNetwork) => {
		setSelectedSignerNetwork(network)
		setShowEditNetwork(true)
	}

	const handleAddNetwork = (signer: Signer) => {
		setSelectedSigner(signer)
		setShowAddNetwork(true)
	}

	return (
		<div className="flex-1 bg-gray-50 p-8">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-900 mb-8">Signer Management</h1>

				<ApiConfiguration
					endpoint={endpoint}
					apiKey={apiKey}
					onEndpointChange={setEndpoint}
					onApiKeyChange={setApiKey}
				/>

				{client && (
					<>
						<FilterBar
							selectedNetwork={selectedNetwork}
							onNetworkChange={setSelectedNetwork}
							onCreate={() => setShowCreateSigner(true)}
						/>

						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">{error}</div>
						)}

						<div className="bg-white rounded-lg shadow overflow-auto max-h-[600px]">
							<SignersTable
								signers={signers}
								loading={loading}
								editingPermission={editingPermission}
								onEditPermission={(networkId, currentPermission) =>
									setEditingPermission({ networkId, value: currentPermission })
								}
								onSavePermission={handleSavePermission}
								onCancelEdit={() => setEditingPermission(null)}
								onPermissionChange={(value) => setEditingPermission((prev) => (prev ? { ...prev, value } : null))}
								onToggleActive={handleToggleActive}
								onEditNetwork={handleEditNetwork}
								onAddNetwork={handleAddNetwork}
							/>
						</div>
					</>
				)}

				{/* Modals */}
				{showCreateSigner && (
					<Modal onClose={() => setShowCreateSigner(false)} title="Create New Signer">
						<CreateSignerForm onSubmit={createSigner} onCancel={() => setShowCreateSigner(false)} />
					</Modal>
				)}

				{showAddNetwork && selectedSigner && (
					<Modal onClose={() => setShowAddNetwork(false)} title="Add Network to Signer">
						<AddNetworkForm
							signer={selectedSigner}
							onSubmit={(network, permission) => addNetwork(selectedSigner.id, network, permission)}
							onCancel={() => setShowAddNetwork(false)}
						/>
					</Modal>
				)}

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
