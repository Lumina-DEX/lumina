import {
	FungibleToken,
	FungibleTokenAdmin,
	poolDataMainnet,
	PoolFactory,
	poolHashMainnet,
	poolTokenHolderDataMainnet,
	poolTokenHolderHashMainnet
} from "@lumina-dex/contracts"
import type { ConsolaInstance } from "consola"
import { Cache, Mina, VerificationKey } from "o1js"
import { logger } from "./utils"
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

export const compileContracts = async () => {
	if (isCompiled) {
		logger.log("Contracts already compiled, skipping...")
		return
	}
	logger.log("Compiling contracts...")
	// setNumberOfWorkers(4)
	const Network = getNetwork("mina:mainnet")
	Mina.setActiveInstance(Network)

	PoolFactory.vkPool = new VerificationKey({ data: poolDataMainnet, hash: poolHashMainnet })
	PoolFactory.vkPoolTokenHolder = new VerificationKey({
		data: poolTokenHolderDataMainnet,
		hash: poolTokenHolderHashMainnet
	})
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

	isCompiled = true
	logger.log("✅ All contracts compiled successfully")
}

export const ensureCompiled = async () => {
	if (!isCompiled) {
		logger.error("Contracts were not compiled.")
		await compileContracts()
	}
}
