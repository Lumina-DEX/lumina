import { NetworkEnum, NETWORK_OPTIONS } from "@/models/network-type"
import { useState, useEffect } from "react"

interface Signer {
	id: number
	publicKey: string
}

interface CreateMultisigFormProps {
	signers: Signer[]
	onSubmit: (data: {
		signerId: number
		signature: string
		data: string
		network: NetworkEnum
		deadline: number
	}) => void
	onCancel: () => void
}

export function CreateMultisigForm({ signers, onSubmit, onCancel }: CreateMultisigFormProps) {
	const [signerId, setSignerId] = useState<number>(signers[0]?.id || 0)
	const [signature, setSignature] = useState("")
	const [data, setData] = useState("")
	const [network, setNetwork] = useState<NetworkEnum>("mina_mainnet")
	const [deadlineDate, setDeadlineDate] = useState("")
	const [deadlineTime, setDeadlineTime] = useState("")

	// Set default datetime to 1 hour from now
	useEffect(() => {
		const now = new Date()
		now.setHours(now.getHours() + 1)
		const dateStr = now.toISOString().split("T")[0]
		const timeStr = now.toTimeString().slice(0, 5)
		setDeadlineDate(dateStr)
		setDeadlineTime(timeStr)
	}, [])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		// Convert date and time to Unix timestamp
		const deadline = Math.floor(new Date(`${deadlineDate}T${deadlineTime}`).getTime() / 1000)

		onSubmit({
			signerId,
			signature,
			data,
			network,
			deadline
		})
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
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">Signer</label>
				<select
					value={signerId}
					onChange={(e) => setSignerId(parseInt(e.target.value))}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				>
					{signers.map((signer) => (
						<option key={signer.id} value={signer.id}>
							ID: {signer.id} - {signer.publicKey.slice(0, 20)}...
						</option>
					))}
				</select>
			</div>

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

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">Signature</label>
				<textarea
					value={signature}
					onChange={(e) => setSignature(e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
					placeholder="Enter signature"
					rows={3}
					required
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
				<textarea
					value={data}
					onChange={(e) => setData(e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
					placeholder="Enter transaction data"
					rows={4}
					required
				/>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Deadline Date</label>
					<input
						type="date"
						value={deadlineDate}
						onChange={(e) => setDeadlineDate(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Deadline Time</label>
					<input
						type="time"
						value={deadlineTime}
						onChange={(e) => setDeadlineTime(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>
			</div>

			<div className="flex justify-end gap-3 pt-4">
				<button
					type="button"
					onClick={onCancel}
					className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
				>
					Cancel
				</button>
				<button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
					Create Multisig
				</button>
			</div>
		</form>
	)
}
