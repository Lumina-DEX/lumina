import type { Signer, SignerNetwork } from "@/models/signer"
import { NetworkRow } from "./NetworkRow"

interface SignersTableProps {
	signers: Signer[]
	loading: boolean
	editingPermission: { networkId: number; value: number } | null
	onEditPermission: (networkId: number, currentPermission: number) => void
	onSavePermission: (network: SignerNetwork, newPermission: number) => void
	onCancelEdit: () => void
	onPermissionChange: (value: number) => void
	onToggleActive: (network: SignerNetwork) => void
	onEditNetwork: (network: SignerNetwork) => void
	onAddNetwork: (signer: Signer) => void
}

export function SignersTable({
	signers,
	loading,
	editingPermission,
	onEditPermission,
	onSavePermission,
	onCancelEdit,
	onPermissionChange,
	onToggleActive,
	onEditNetwork,
	onAddNetwork
}: SignersTableProps) {
	if (loading) {
		return <div className="p-8 text-center text-gray-500">Loading...</div>
	}

	if (signers.length === 0) {
		return <div className="p-8 text-center text-gray-500">No signers found</div>
	}

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-50">
					<tr>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Public Key
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Networks</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{signers.map((signer) => (
						<tr key={signer.id}>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{signer.id}</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
								{signer.publicKey.slice(0, 10)}...{signer.publicKey.slice(-10)}
							</td>
							<td className="px-6 py-4">
								{signer.networks && signer.networks.length > 0 ? (
									<div className="space-y-2">
										{signer.networks.map((network) => (
											<NetworkRow
												key={network.id}
												network={network}
												isEditingPermission={editingPermission?.networkId === network.id}
												editingValue={editingPermission?.value || network.permission}
												onEditPermission={() => onEditPermission(network.id, network.permission)}
												onSavePermission={() => onSavePermission(network, editingPermission?.value || 0)}
												onCancelEdit={onCancelEdit}
												onPermissionChange={onPermissionChange}
												onToggleActive={() => onToggleActive(network)}
												onEdit={() => onEditNetwork(network)}
											/>
										))}
									</div>
								) : (
									<span className="text-sm text-gray-500">No networks configured</span>
								)}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm">
								<button onClick={() => onAddNetwork(signer)} className="text-blue-600 hover:text-blue-800">
									Add Network
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
