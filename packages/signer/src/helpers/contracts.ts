import { FungibleToken, FungibleTokenAdmin, PoolFactory } from "@lumina-dex/contracts"
import type { Networks } from "@lumina-dex/sdk"
import type { ConsolaInstance } from "consola"
import { Cache, Mina } from "o1js"
import { getNetwork } from "./job"
import { logger } from "./utils"

const createMeasure = (l: ConsolaInstance) => (label: string) => {
	const start = performance.now()
	let done = false
	return () => {
		if (done) return
		const end = performance.now()
		l.warn(`${label}: ${end - start} ms`)
		done = true
	}
}
const time = createMeasure(logger)

let isCompiled = false
let compiledForNetwork: Networks | null = null

export const compileContracts = async (network: Networks) => {
	if (isCompiled) {
		logger.log("Contracts already compiled, skipping...")
		return
	}
	Mina.setActiveInstance(getNetwork(network))

	logger.log(`Compiling contracts for ${network}...`)

	const c = time("compile")
	const cache = Cache.FileSystem("./cache")

	const fta = time("FungibleTokenAdmin")
	await FungibleTokenAdmin.compile({ cache })
	fta()

	const ft = time("FungibleToken")
	await FungibleToken.compile({ cache })
	ft()

	const pf = time("PoolFactory")
	const vk = await PoolFactory.compile({ cache })
	pf()

	logger.log("factory vk hash", vk.verificationKey.hash.toBigInt())
	c()

	isCompiled = true
	compiledForNetwork = network
	logger.log("✅ All contracts compiled successfully")
}

export const ensureCompiled = async (network: Networks) => {
	logger.log("Check contract is compiled.")
	if (isCompiled && compiledForNetwork && compiledForNetwork !== network) {
		logger.warn(
			`⚠️ Contracts were compiled for ${compiledForNetwork} but job requests ${network}. In production each server handles a single environment. Recompilation is not supported — results may be incorrect.`
		)
	}
	if (!isCompiled) {
		logger.error("Contracts were not compiled.")
		await compileContracts(network)
	}
}
