import { useState } from "react"
import type { SignerNetwork } from "@/models/signer"

interface EditNetworkFormProps {
	signerNetwork: SignerNetwork
	onSubmit: (permission: number, active: boolean) => void
	onCancel: () => void
}

export function EditNetworkForm({ signerNetwork, onSubmit, onCancel }: EditNetworkFormProps) {
	const [permission, setPermission] = useState(signerNetwork.permission)
	const [active, setActive] = useState(signerNetwork.active)

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		onSubmit(permission, active)
	}

	return (
		<form onSubmit={handleSubmit}>
			<div className="mb-4">
				<span className="block text-sm font-medium text-gray-700 mb-2">Network</span>
				<input
					type="text"
					value={signerNetwork.network}
					disabled
					className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
				/>
			</div>
			<div className="mb-4">
				<span className="block text-sm font-medium text-gray-700 mb-2">Permission Level</span>
				<input
					type="number"
					name="permission"
					value={permission}
					onChange={(e) => setPermission(Number.parseInt(e.target.value))}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					min="0"
					required
				/>
			</div>
			<div className="mb-4">
				<span className="flex items-center">
					<input
						type="checkbox"
						checked={active}
						onChange={(e) => setActive(e.target.checked)}
						className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<span className="text-sm font-medium text-gray-700">Active</span>
				</span>
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
