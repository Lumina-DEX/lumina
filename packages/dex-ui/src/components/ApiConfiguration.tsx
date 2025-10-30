interface ApiConfigurationProps {
	endpoint: string
	apiKey: string
	onEndpointChange: (value: string) => void
	onApiKeyChange: (value: string) => void
}

export function ApiConfiguration({ endpoint, apiKey, onEndpointChange, onApiKeyChange }: ApiConfigurationProps) {
	return (
		<div className="bg-white rounded-lg shadow p-6 mb-6">
			<h2 className="text-xl font-semibold mb-4">API Configuration</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">API Endpoint</label>
					<input
						type="text"
						value={endpoint}
						onChange={(e) => onEndpointChange(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="https://your-api.com/graphql"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
					<input
						type="password"
						value={apiKey}
						onChange={(e) => onApiKeyChange(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Enter your API key"
					/>
				</div>
			</div>
		</div>
	)
}
