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
let isCompiledMainnet = false

export const compileContracts = async (network: Networks) => {
	const isMainnet = network.includes("mainnet")
	if (isCompiledForNetwork(network)) {
		logger.log("Contracts already compiled, skipping...")
		return
	}
	Mina.setActiveInstance(getNetwork(network))

	logger.log(`Compiling contracts for ${network}...`)

	const c = time("compile")
	const cache = { cache: Cache.FileSystemDefault, forceRecompile: true }

	const fta = time("FungibleTokenAdmin")
	await FungibleTokenAdmin.compile(cache)
	fta()

	const ft = time("FungibleToken")
	await FungibleToken.compile(cache)
	ft()

	const pf = time("PoolFactory")
	const vk = await PoolFactory.compile(cache)
	pf()

	logger.log("factory vk hash", vk.verificationKey.hash.toBigInt())
	c()

	if (isMainnet) {
		// todo find a solution to compile once by network
		isCompiledMainnet = true
		isCompiled = false
	} else {
		isCompiledMainnet = false
		isCompiled = true
	}
	logger.log("✅ All contracts compiled successfully")
}

export const ensureCompiled = async (network: Networks) => {
	logger.log("Check contract is compiled.")
	if (!isCompiledForNetwork(network)) {
		logger.error("Contracts were not compiled.")
		await compileContracts(network)
	}
}

function isCompiledForNetwork(network: string): boolean {
	const isMainnet = network.includes("mainnet")
	if (isMainnet) {
		return isCompiledMainnet
	}
	return isCompiled
}
