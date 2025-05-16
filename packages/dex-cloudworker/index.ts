import { Cloud, zkCloudWorker, initBlockchain, VerificationData, blockchain } from "zkcloudworker"
import { initializeBindings } from "o1js"
import { PoolWorker } from "./src/PoolWorker"
import packageJson from "./package.json"

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
	return new PoolWorker(cloud)
}

export async function verify(chain: blockchain): Promise<VerificationData> {
	if (chain !== "devnet") throw new Error("Unsupported chain")
	return {
		contract: PoolFactory,
		programDependencies: [FungibleToken, FungibleTokenAdmin],
		contractDependencies: [],
		address: "B62qrfxeWqZF16Bm87xyb9fyXDs5APqqKuPmbMqaEsNUWj8Ju8GSRxM",
		chain: "devnet"
	} as VerificationData
}
