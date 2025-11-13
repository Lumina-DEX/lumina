import { poolCreationUrl } from "@lumina-dex/sdk"
import { useCallback, useEffect, useState } from "react"
import type { Multisig } from "@/models/multisig"
import type { NetworkEnum } from "@/models/network-type"
import { MULTISIG_QUERIES } from "@/models/queries"
import type { Signer } from "@/models/signer"
import { GraphQLClient } from "@/utils/graphql-client"
import { ApiConfiguration } from "../ApiConfiguration"
import { FilterBar } from "../FilterBar"
import { Modal } from "../Modal"
import { CreateMultisigForm } from "./CreateMultisigForm"
import { MultisigTable } from "./MultisigTable"

export default function MultisigManagement() {
	const [apiKey, setApiKey] = useState("")
	const [endpoint, setEndpoint] = useState(poolCreationUrl)
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
	const fetchMultisigs = useCallback(async () => {
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
	}, [client, selectedNetwork])

	// Fetch signers (for the create form)
	const fetchSigners = useCallback(async () => {
		if (!client) return

		try {
			const data = await client.query<{ signers: Signer[] }>(MULTISIG_QUERIES.GET_SIGNERS)
			setSigners(data.signers)
		} catch (err) {
			console.error("Failed to fetch signers:", err)
		}
	}, [client])

	useEffect(() => {
		if (client && selectedNetwork) {
			fetchMultisigs()
			fetchSigners()
		}
	}, [client, selectedNetwork, fetchMultisigs, fetchSigners])

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
				<ApiConfiguration
					endpoint={endpoint}
					apiKey={apiKey}
					onEndpointChange={setEndpoint}
					onApiKeyChange={setApiKey}
				/>

				{/* Filters and Actions */}
				{client && (
					<>
						<FilterBar
							selectedNetwork={selectedNetwork}
							onNetworkChange={setSelectedNetwork}
							onCreate={() => setShowCreateModal(true)}
						/>

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
							client={client!}
							onSubmit={createMultisig}
							onCancel={() => setShowCreateModal(false)}
						/>
					</Modal>
				)}
			</div>
		</div>
	)
}
