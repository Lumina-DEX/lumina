import {
	Cloud,
	zkCloudWorker,
	initBlockchain,
	VerificationData,
	blockchain,
	FungibleToken,
	FungibleTokenAdmin
} from "zkcloudworker"
import { initializeBindings } from "o1js"
import { PoolWorker } from "./src/PoolWorker"
import packageJson from "./package.json"
import { PoolFactory } from "./src/pool/PoolFactory"

export async function zkcloudworker(cloud: Cloud): Promise<zkCloudWorker> {
	console.log(
		`starting worker example version ${packageJson.version ?? "unknown"} on chain ${cloud.chain}`
	)
	await initializeBindings()
	await initBlockchain(cloud.chain)
	return new PoolWorker(cloud)
}

export async function verify(chain: blockchain): Promise<VerificationData> {
	if (chain !== "devnet") throw new Error("Unsupported chain")
	return {
		contract: PoolFactory,
		programDependencies: [FungibleToken, FungibleTokenAdmin],
		contractDependencies: [],
		address: "B62qp6x4PfXbqhL3rWgshwkfS2sHTzPDYWBmgTxBsBGSPihJaNEEUXv",
		chain: "devnet"
	} as unknown as VerificationData
}
