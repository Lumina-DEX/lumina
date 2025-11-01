import { Multisig } from "@/models/multisig"

interface MultisigTableProps {
	multisigs: Multisig[]
	loading: boolean
	onDelete: (id: number) => void
}

export function MultisigTable({ multisigs, loading, onDelete }: MultisigTableProps) {
	if (loading) {
		return <div className="p-8 text-center text-gray-500">Loading...</div>
	}

	if (multisigs.length === 0) {
		return <div className="p-8 text-center text-gray-500">No multisigs found</div>
	}

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleString()
	}

	const formatDeadline = (timestamp: number) => {
		return new Date(timestamp * 1000).toLocaleString()
	}

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-50">
					<tr>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signer</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Signature
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{multisigs.map((multisig) => (
						<tr key={multisig.id}>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{multisig.id}</td>
							<td className="px-6 py-4  text-sm">
								<div className="flex flex-col">
									<span className="text-gray-900 font-medium">ID: {multisig.signerId}</span>
									{multisig.signer && (
										<span className="text-gray-500 font-mono text-xs">{multisig.signer.publicKey.slice(0, 15)}...</span>
									)}
								</div>
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm">
								<span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
									{multisig.network}
								</span>
							</td>
							<td className="px-6 py-4 text-sm">
								<div className="max-w-xs break-words whitespace-normal font-mono text-xs" title={multisig.signature}>
									{multisig.signature}
								</div>
							</td>
							<td className="px-6 py-4 text-sm">
								<div className="max-w-xs break-words whitespace-normal font-mono text-xs" title={multisig.data}>
									{multisig.data}
								</div>
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDeadline(multisig.deadline)}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
