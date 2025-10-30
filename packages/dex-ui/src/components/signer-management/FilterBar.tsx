import { NetworkEnum, NETWORK_OPTIONS } from "@/models/network-type"

interface FilterBarProps {
	selectedNetwork: NetworkEnum | ""
	onNetworkChange: (network: NetworkEnum | "") => void
	onCreateSigner: () => void
}

export function FilterBar({ selectedNetwork, onNetworkChange, onCreateSigner }: FilterBarProps) {
	return (
		<div className="bg-white rounded-lg shadow p-6 mb-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<label className="text-sm font-medium text-gray-700">Filter by Network:</label>
					<select
						value={selectedNetwork}
						onChange={(e) => onNetworkChange(e.target.value as NetworkEnum | "")}
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
					onClick={onCreateSigner}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
				>
					Add New Signer
				</button>
			</div>
		</div>
	)
}
