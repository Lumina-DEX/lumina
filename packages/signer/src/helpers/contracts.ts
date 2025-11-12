import {
	FungibleToken,
	FungibleTokenAdmin,
	poolDataMainnet,
	poolDataTestnet,
	PoolFactory,
	poolHashMainnet,
	poolHashTestnet,
	poolTokenHolderDataMainnet,
	poolTokenHolderDataTestnet,
	poolTokenHolderHashMainnet,
	poolTokenHolderHashTestnet
} from "@lumina-dex/contracts"
import type { ConsolaInstance } from "consola"
import { Cache, Mina, VerificationKey } from "o1js"
import { logger } from "./utils"
import { Networks } from "@lumina-dex/sdk"
import { getNetwork } from "./job"

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
	if ((!isCompiled && !isMainnet) || (!isCompiledMainnet && isMainnet)) {
		logger.log("Contracts already compiled, skipping...")
		return
	}
	Mina.setActiveInstance(getNetwork(network))

	if (isMainnet) {
		logger.log("Compiling contracts for mainnet...")
	} else {
		logger.log("Compiling contracts for testnet/devnet...")
	}

	// setNumberOfWorkers(4)
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
	const isMainnet = network.includes("mainnet")
	if ((!isCompiled && !isMainnet) || (!isCompiledMainnet && isMainnet)) {
		logger.error("Contracts were not compiled.")
		await compileContracts(network)
	}
}
