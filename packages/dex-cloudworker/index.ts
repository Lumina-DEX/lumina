import { Cloud, zkCloudWorker, initBlockchain, VerificationData, blockchain } from "zkcloudworker"
import { initializeBindings } from "o1js"
import { AddWorker } from "./src/worker"
import packageJson from "./package.json"
import { AddContract, AddProgram } from "./src/contract"

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
		contract: AddContract,
		programDependencies: [AddProgram],
		contractDependencies: [],
		address: "B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD",
		chain: "devnet"
	} as VerificationData
}
