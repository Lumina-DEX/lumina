import { Cloud, zkCloudWorker, initBlockchain, VerificationData, blockchain } from "zkcloudworker"
import { initializeBindings } from "o1js"
import { AddWorker } from "./src/worker"
import packageJson from "./package.json"
import { AddContract, AddProgram } from "./src/contract"
import {
	FungibleToken,
	FungibleTokenAdmin,
	Pool,
	PoolFactory,
	PoolTokenHolder
} from "@lumina-dex/contracts"

export async function zkcloudworker(cloud: Cloud): Promise<zkCloudWorker> {
	console.log(
		`starting worker example version ${packageJson.version ?? "unknown"} on chain ${cloud.chain}`
	)
	await initializeBindings()
	await initBlockchain(cloud.chain)
	return new AddWorker(cloud)
}

export async function verify(chain: blockchain): Promise<VerificationData> {
	if (chain !== "devnet") throw new Error("Unsupported chain")
	return {
		contract: Pool,
		programDependencies: [PoolFactory, PoolTokenHolder, FungibleToken, FungibleTokenAdmin],
		contractDependencies: [],
		address: "B62qp71rC3GU4bzoB6DfhrydBwkZ94R91JmfLevffMxBipRNcTxeYvh",
		chain: "devnet"
	} as VerificationData
}
