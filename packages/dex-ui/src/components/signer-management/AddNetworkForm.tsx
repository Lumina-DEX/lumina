import { useState } from "react"
import { NETWORK_OPTIONS, type NetworkEnum, networkValueToEnum } from "@/models/network-type"
import type { Signer } from "@/models/signer"

interface AddNetworkFormProps {
	signer: Signer
	onSubmit: (network: NetworkEnum, permission: number) => void
	onCancel: () => void
}

export function AddNetworkForm({ signer, onSubmit, onCancel }: AddNetworkFormProps) {
	const [network, setNetwork] = useState<NetworkEnum>("mina_mainnet")
	const [permission, setPermission] = useState(0)

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		onSubmit(network, permission)
	}

	// Get available networks (not already configured)
	const configuredNetworks = signer.networks?.map((n) => networkValueToEnum(n.network)) || []
	const availableNetworks = NETWORK_OPTIONS.filter((opt) => !configuredNetworks.includes(opt.value))

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
					onChange={(e) => setNetwork(e.target.value as NetworkEnum)}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{availableNetworks.map((net) => (
						<option key={net.value} value={net.value}>
							{net.label}
						</option>
					))}
				</select>
			</div>
			<div className="mb-4">
				<label className="block text-sm font-medium text-gray-700 mb-2">Permission Level</label>
				<input
					type="number"
					value={permission}
					onChange={(e) => setPermission(Number.parseInt(e.target.value))}
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
