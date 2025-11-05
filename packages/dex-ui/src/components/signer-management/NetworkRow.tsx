import type { SignerNetwork } from "@/models/signer"

interface NetworkRowProps {
	network: SignerNetwork
	isEditingPermission: boolean
	editingValue: number
	onEditPermission: () => void
	onSavePermission: () => void
	onCancelEdit: () => void
	onPermissionChange: (value: number) => void
	onToggleActive: () => void
	onEdit: () => void
}

export function NetworkRow({
	network,
	isEditingPermission,
	editingValue,
	onEditPermission,
	onSavePermission,
	onCancelEdit,
	onPermissionChange,
	onToggleActive,
	onEdit
}: NetworkRowProps) {
	return (
		<div className="flex items-center justify-between bg-gray-50 p-3 rounded">
			<div className="flex items-center gap-3 flex-1">
				<span className="text-sm font-medium text-gray-700 min-w-[120px]">{network.network}</span>

				{/* Inline Permission Editor */}
				{isEditingPermission ? (
					<div className="flex items-center gap-2">
						<input
							type="number"
							value={editingValue}
							onChange={(e) => onPermissionChange(Number.parseInt(e.target.value) || 0)}
							className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
							min="0"
							autoFocus
						/>
						<button
							onClick={onSavePermission}
							className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
						>
							Save
						</button>
						<button
							onClick={onCancelEdit}
							className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
						>
							Cancel
						</button>
					</div>
				) : (
					<div className="flex items-center gap-2">
						<span className="text-xs text-gray-500">Permission: {network.permission}</span>
						<button onClick={onEditPermission} className="text-xs text-blue-600 hover:text-blue-800">
							✏️
						</button>
					</div>
				)}

				<span
					className={`px-2 py-1 text-xs rounded ${
						network.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
					}`}
				>
					{network.active ? "Active" : "Inactive"}
				</span>
			</div>
			<div className="flex gap-2 ml-3">
				<button onClick={onEdit} className="text-blue-600 hover:text-blue-800 text-sm">
					Edit
				</button>
				<button onClick={onToggleActive} className="text-gray-600 hover:text-gray-800 text-sm">
					{network.active ? "Deactivate" : "Activate"}
				</button>
			</div>
		</div>
	)
}
