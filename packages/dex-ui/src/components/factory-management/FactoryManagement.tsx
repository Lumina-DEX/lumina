import { poolCreationUrl } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { useCallback, useContext, useEffect, useState } from "react"
import { FACTORY_QUERIES, SIGNER_QUERIES } from "@/models/queries"
import type { Signer } from "@/models/signer"
import { GraphQLClient } from "@/utils/graphql-client"
import { sendTransactionWithAuro } from "@/utils/multisig"
import { ApiConfiguration } from "../ApiConfiguration"
import { LuminaContext } from "../Layout"
import { Modal } from "../Modal"
import { DeployFactoryForm } from "./DeployFactoryForm"

interface FactoryJob {
	id: string
	status: string
	factoryPublicKey?: string
	transactionJson?: string
	completedAt?: Date
}

export default function FactoryManagement() {
	const [apiKey, setApiKey] = useState("")
	const [endpoint, setEndpoint] = useState(poolCreationUrl)
	const [client, setClient] = useState<GraphQLClient | null>(null)
	const [signers, setSigners] = useState<Signer[]>([])
	const [error, setError] = useState("")
	const [hash, setHash] = useState("")
	const { Wallet } = useContext(LuminaContext)
	const walletContext = useSelector(Wallet, (state) => state.context)

	// Modal state
	const [showDeployModal, setShowDeployModal] = useState(false)

	// Job tracking
	const [currentJob, setCurrentJob] = useState<FactoryJob | null>(null)
	const [showJobStatus, setShowJobStatus] = useState(false)

	// Initialize client
	useEffect(() => {
		if (apiKey && endpoint) {
			setClient(new GraphQLClient(endpoint, apiKey))
		}
	}, [apiKey, endpoint])

	// Fetch signers
	const fetchSigners = useCallback(async () => {
		if (!client) return

		try {
			const data = await client.query<{ signers: Signer[] }>(SIGNER_QUERIES.GET_SIGNERS)
			setSigners(data.signers)
		} catch (err) {
			console.error("Failed to fetch signers:", err)
		}
	}, [client])

	useEffect(() => {
		if (client) {
			fetchSigners()
		}
	}, [client, fetchSigners])

	useEffect(() => {
		if (currentJob?.status === "completed" && currentJob?.transactionJson) {
			sendTransactionWithAuro(currentJob.transactionJson).then((x) => setHash(x))
		}
	}, [currentJob])

	const handleDeploySuccess = (jobId: string) => {
		setCurrentJob({ id: jobId, status: "created" })
		setShowDeployModal(false)
		setShowJobStatus(true)
		pollJobStatus(jobId)
	}

	function getTransactionScanUrl(hash: string): string {
		const scanUrls: Record<string, string> = {
			"mina:mainnet": `https://minascan.io/mainnet/tx/${hash}`,
			"mina:devnet": `https://minascan.io/devnet/tx/${hash}`,
			"zeko:mainnet": `https://zeko-scan.io/mainnet/tx/${hash}`,
			"zeko:testnet": `https://zeko-scan.io/testnet/tx/${hash}`
		}
		const network = walletContext.currentNetwork || "mina:mainnet"

		return scanUrls[network]
	}

	const pollJobStatus = async (jobId: string) => {
		if (!client) return

		const interval = setInterval(async () => {
			try {
				const data = await client.query<{ factoryDeploymentJob: FactoryJob }>(FACTORY_QUERIES.GET_FACTORY_JOB, {
					jobId
				})

				setCurrentJob(data.factoryDeploymentJob)

				if (data.factoryDeploymentJob.status === "completed" || data.factoryDeploymentJob.status === "failed") {
					clearInterval(interval)
				}
			} catch (err) {
				setCurrentJob({ ...currentJob, status: "failed" })
				console.error("Failed to poll job status:", err)
				clearInterval(interval)
			}
		}, 3000) // Poll every 3 seconds

		// Stop polling after 5 minutes
		setTimeout(() => clearInterval(interval), 300000)
	}

	return (
		<div className="flex-1 bg-gray-50 p-8">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-900 mb-8">Factory Management</h1>

				{/* API Configuration */}
				<div className="bg-white rounded-lg shadow p-6 mb-6">
					<h2 className="text-xl font-semibold mb-4">API Configuration</h2>
					<ApiConfiguration
						endpoint={endpoint}
						apiKey={apiKey}
						onEndpointChange={setEndpoint}
						onApiKeyChange={setApiKey}
					/>
				</div>

				{/* Deploy Action */}
				{client && (
					<>
						<div className="bg-white rounded-lg shadow p-6 mb-6">
							<div className="flex items-center justify-between">
								<div>
									<h2 className="text-xl font-semibold mb-1">Deploy Factory</h2>
									<p className="text-sm text-gray-600">Deploy a new factory contract with multisig authorization</p>
								</div>
								<button
									type="button"
									onClick={() => setShowDeployModal(true)}
									className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
								>
									Deploy Factory
								</button>
							</div>
						</div>

						{/* Error Message */}
						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">{error}</div>
						)}

						{/* Current Job Status */}
						{showJobStatus && currentJob && (
							<div className="bg-white rounded-lg shadow p-6">
								<h2 className="text-xl font-semibold mb-4">Deployment Status</h2>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-gray-700">Job ID:</span>
										<span className="text-sm font-mono text-gray-900">{currentJob.id}</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-gray-700">Status:</span>
										<span
											className={`px-3 py-1 text-xs font-medium rounded-full ${
												currentJob.status === "completed"
													? "bg-green-100 text-green-800"
													: currentJob.status === "failed"
														? "bg-red-100 text-red-800"
														: "bg-yellow-100 text-yellow-800"
											}`}
										>
											{currentJob.status}
										</span>
									</div>
									{hash && (
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-gray-700">Transaction:</span>
											<a
												href={getTransactionScanUrl(hash)}
												target="_blank"
												rel="noopener noreferrer"
												className="text-sm font-mono text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
											>
												{hash.slice(0, 10)}...{hash.slice(-8)}
											</a>
										</div>
									)}
									{currentJob.factoryPublicKey && (
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-gray-700">Factory Address:</span>
											<span className="text-sm font-mono text-gray-900">{currentJob.factoryPublicKey}</span>
										</div>
									)}
									{currentJob.status === "completed" && (
										<div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
											<p className="text-sm text-green-800 font-medium">✓ Factory generated!</p>
										</div>
									)}
									{currentJob.status === "failed" && (
										<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
											<p className="text-sm text-red-800 font-medium">✗ Factory deployment failed</p>
										</div>
									)}
								</div>
							</div>
						)}
					</>
				)}

				{/* Deploy Modal */}
				{showDeployModal && client && (
					<Modal onClose={() => setShowDeployModal(false)} title="Deploy Factory">
						<DeployFactoryForm
							signers={signers}
							client={client}
							onSuccess={handleDeploySuccess}
							onCancel={() => setShowDeployModal(false)}
						/>
					</Modal>
				)}
			</div>
		</div>
	)
}
