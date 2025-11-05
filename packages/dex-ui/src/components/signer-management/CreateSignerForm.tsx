import { useState } from "react"

interface CreateSignerFormProps {
	onSubmit: (publicKey: string) => void
	onCancel: () => void
}

export function CreateSignerForm({ onSubmit, onCancel }: CreateSignerFormProps) {
	const [publicKey, setPublicKey] = useState("")

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!publicKey.trim()) return
		onSubmit(publicKey)
	}

	return (
		<form onSubmit={handleSubmit}>
			<div className="mb-4">
				<span className="block text-sm font-medium text-gray-700 mb-2">Public Key</span>
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
