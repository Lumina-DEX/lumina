import {
	type Faucet,
	type FungibleToken,
	type FungibleTokenAdmin,
	type Pool,
	type PoolFactory,
	type PoolTokenHolder,
	SignatureRight
} from "@lumina-dex/contracts"
import { createStore } from "@xstate/store"
import * as Comlink from "comlink"
import {
	AccountUpdate,
	Bool,
	fetchAccount,
	MerkleMap,
	Mina,
	Poseidon,
	PrivateKey,
	PublicKey,
	Signature,
	UInt64,
	UInt8
} from "o1js"
import { defaultFee, MINA_ADDRESS, type NetworkUri, urls } from "../constants"
import { createMeasure, prefixedLogger } from "../helpers/debug"
import type { ContractName } from "../machines/luminadex/types"
import { fetchZippedContracts, readCache } from "./cache"

const logger = prefixedLogger("[DEX WORKER]")
const measure = createMeasure(logger)
// Types
type Contracts = {
	Pool: typeof Pool
	PoolFactory: typeof PoolFactory
	PoolTokenHolder: typeof PoolTokenHolder
	FungibleToken: typeof FungibleToken
	FungibleTokenAdmin: typeof FungibleTokenAdmin
	Faucet: typeof Faucet
}

type Transaction = Mina.Transaction<false, false>
type Nullable<T> = T | null

type WorkerState = {
	readonly contracts: Contracts
	readonly transaction: Nullable<Transaction>
	readonly network: Nullable<NetworkUri>
}

const las = new Map<string, string>()

const getLuminaAddress = async (
	factory: string
) => {
	const cache = las.get(factory)
	if (cache) return cache
	const factoryKey = PublicKey.fromBase58(factory)
	const contracts = context().contracts
	const zkFactory = new contracts.PoolFactory(factoryKey)
	// await fetchAccount({ publicKey: factoryKey }) TODO: Might be un-necessary
	const la = (await zkFactory.protocol.fetch())?.toBase58()
	if (!la) throw new Error("Lumina Address not found")
	las.set(factory, la)
	return la
}

// Initial state
const initialState: WorkerState = {
	contracts: {} as Contracts,
	transaction: null,
	network: null
}

const workerState = createStore({
	context: initialState,
	on: {
		SetContracts: { contracts: (_, event: { contracts: Contracts }) => event.contracts },
		SetTransaction: { transaction: (_, event: { transaction: Transaction }) => event.transaction },
		SetNetwork: { network: (_, event: { network: NetworkUri }) => event.network }
	}
})

const context = () => workerState.getSnapshot().context

// Transaction Helper
const proveTransaction = async (transaction: Transaction) => {
	const stop = measure("proof")
	logger.start("Proving transaction", transaction)
	workerState.send({ type: "SetTransaction", transaction })
	await transaction.prove()
	stop()
	const txjson = transaction.toJSON()
	logger.success("Transaction proved", txjson)
	return txjson
}

// Contract Management
const loadContracts = async () => {
	logger.start("Importing contracts ...")
	const {
		PoolFactory,
		Pool,
		PoolTokenHolder,
		FungibleToken,
		FungibleTokenAdmin,
		Faucet
	} = await import("@lumina-dex/contracts")

	workerState.send({
		type: "SetContracts",
		contracts: {
			PoolFactory,
			Pool,
			PoolTokenHolder,
			FungibleToken,
			FungibleTokenAdmin,
			Faucet
		}
	})
	logger.success("Loaded contracts")
}

let globalCache: ReturnType<typeof readCache>
const compileContract = async (
	{ contract, disableCache }: { contract: ContractName; disableCache: boolean }
) => {
	try {
		const contracts = context().contracts

		if (disableCache) {
			logger.start("Compiling contract without cache", contract)
			logger.warn("Cache is disabled")
			await contracts[contract].compile({})
			logger.success("Compiled contract successfully without cache", contract)
			return
		}

		if (!globalCache) {
			logger.warn("No global cache found, fetching zipped contracts")
			const cacheFiles = await fetchZippedContracts()
			globalCache = readCache(cacheFiles)
		}
		logger.start("Compiling contract with cache", contract)
		await contracts[contract].compile({ cache: globalCache })
		logger.success("Compiled contract successfully with cache", contract)
	} catch (error) {
		logger.error(`Contract compilation failed for ${contract}`, error)
		throw error
	}
}

const getZkTokenFromPool = async (pool: string) => {
	logger.start("Fetching ZKToken from pool", pool)
	const poolKey = PublicKey.fromBase58(pool)

	const contracts = context().contracts

	const zkPool = new contracts.Pool(poolKey)
	const zkPoolTokenKey = await zkPool.token1.fetch()
	if (!zkPoolTokenKey) throw new Error("ZKPool Token Key not found")

	const zkToken = new contracts.FungibleToken(zkPoolTokenKey)

	const zkPoolTokenId = zkPool.deriveTokenId()
	const zkTokenId = zkToken.deriveTokenId()

	return { zkTokenId, zkToken, poolKey, zkPool, zkPoolTokenKey, zkPoolTokenId }
}

/**
 * Use this method to pay the account creation fee for another account (or, multiple accounts using the optional second argument).
 * (Based on native o1js method)
 * Beware that you _don't_ need to specify the account that is created!
 * Instead, the protocol will automatically identify that accounts need to be created,
 * and require that the net balance change of the transaction covers the account creation fee.
 *
 * @param feePayer the address of the account that pays the fee
 * @param numberOfAccounts the number of new accounts to fund (default: 1)
 * @returns they {@link AccountUpdate} for the account which pays the fee
 */
const fundNewAccount = async (feePayer: PublicKey, numberOfAccounts = 1) => {
	try {
		const isZeko = workerState.getSnapshot().context.network?.includes("zeko")
		const accountUpdate = AccountUpdate.createSigned(feePayer)
		accountUpdate.label = "AccountUpdate.fundNewAccount()"
		const fee = (isZeko
			? UInt64.from(10 ** 8)
			: Mina.activeInstance.getNetworkConstants().accountCreationFee).mul(numberOfAccounts)
		accountUpdate.balance.subInPlace(fee)
		return accountUpdate
	} catch (error) {
		logger.error("fund new account", error)
		return AccountUpdate.fundNewAccount(feePayer, numberOfAccounts)
	}
}

const getFee = () => {
	try {
		const network = workerState.getSnapshot().context.network
		const fee = network ? defaultFee[network] : undefined
		return fee
	} catch {
		return undefined
	}
}

export interface DeployPoolArgs {
	tokenA: string
	tokenB: string
	user: string
	factory: string
	signer: string
	user0: string
}

const deployPoolInstance = async (
	{ tokenA, tokenB, user, factory, user0, signer }: DeployPoolArgs
) => {
	logger.start("Deploying pool instance", { tokenA, tokenB, user, factory, user0, signer })
	const poolKey = PrivateKey.random()
	logger.debug({ poolKey })

	const _allRight = new SignatureRight(
		Bool(true),
		Bool(true),
		Bool(true),
		Bool(true),
		Bool(true),
		Bool(true)
	)
	const deployRight = SignatureRight.canDeployPool()

	const merkle = getMerkle()
	// TODO: temporary solution for testnet
	const signerPk = PrivateKey.fromBase58(signer)
	const approvedSignerPublic = signerPk.toPublicKey()
	logger.debug({ user0, approvedSignerPublic })

	const signature = Signature.create(signerPk, poolKey.toPublicKey().toFields())
	logger.debug({ signature })
	const witness = merkle.getWitness(Poseidon.hash(approvedSignerPublic.toFields()))
	logger.debug({ witness })
	const factoryKey = PublicKey.fromBase58(factory)
	logger.debug({ factoryKey })
	const contracts = context().contracts
	const zkFactory = new contracts.PoolFactory(factoryKey)
	logger.debug({ zkFactory })
	await fetchAccount({ publicKey: factoryKey })

	const isMinaTokenPool = tokenA === MINA_ADDRESS || tokenB === MINA_ADDRESS
	logger.debug({ isMinaTokenPool })
	const transaction = await Mina.transaction({
		sender: PublicKey.fromBase58(user),
		fee: getFee()
	}, async () => {
		fundNewAccount(PublicKey.fromBase58(user), 4)
		if (isMinaTokenPool) {
			const token = tokenA === MINA_ADDRESS ? tokenB : tokenA
			await zkFactory.createPool(
				poolKey.toPublicKey(),
				PublicKey.fromBase58(token),
				approvedSignerPublic,
				signature,
				witness,
				deployRight
			)
		}
		if (!isMinaTokenPool) {
			await zkFactory.createPoolToken(
				poolKey.toPublicKey(),
				PublicKey.fromBase58(tokenA),
				PublicKey.fromBase58(tokenB),
				approvedSignerPublic,
				signature,
				witness,
				deployRight
			)
		}
	})
	transaction.sign([poolKey])
	return await proveTransaction(transaction)
}

export interface DeployToken {
	user: string
	tokenKey: string
	tokenAdminKey: string
	symbol: string
}
const deployToken = async ({ user, tokenKey, tokenAdminKey, symbol }: DeployToken) => {
	logger.start("Deploying token", { user, tokenKey, tokenAdminKey, symbol })
	const tokenPrivateKey = PrivateKey.fromBase58(tokenKey)
	const tokenAdminPrivateKey = PrivateKey.fromBase58(tokenAdminKey)
	const userPublicKey = PublicKey.fromBase58(user)
	logger.debug({ tokenPrivateKey, tokenAdminPrivateKey, userPublicKey })
	const contracts = context().contracts

	const zkToken = new contracts.FungibleToken(tokenPrivateKey.toPublicKey())
	const zkTokenAdmin = new contracts.FungibleTokenAdmin(tokenAdminPrivateKey.toPublicKey())
	logger.debug({ zkToken, zkTokenAdmin })
	const transaction = await Mina.transaction(
		{ sender: userPublicKey, fee: getFee() },
		async () => {
			fundNewAccount(userPublicKey, 3)
			await zkTokenAdmin.deploy({
				adminPublicKey: userPublicKey
			})
			await zkToken.deploy({
				symbol,
				src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
				allowUpdates: true
			})
			await zkToken.initialize(tokenAdminPrivateKey.toPublicKey(), UInt8.from(9), Bool(false))
		}
	)

	await transaction.prove()
	transaction.sign([tokenPrivateKey, tokenAdminPrivateKey])
	return transaction.toJSON()
}

export interface MintToken {
	user: string
	token: string
	to: string
	amount: number
}
const mintToken = async ({ user, token, to, amount }: MintToken) => {
	logger.start("Minting token", { user, token, to, amount })
	const tokenPublic = PublicKey.fromBase58(token)
	const userKey = PublicKey.fromBase58(user)
	const receiver = PublicKey.fromBase58(to)
	const tokenAmount = UInt64.from(amount * 10 ** 9)
	logger.debug({ tokenPublic, userKey, receiver, tokenAmount })
	const contracts = context().contracts

	const zkToken = new contracts.FungibleToken(tokenPublic)
	logger.debug({ zkToken })
	const acc = await fetchAccount({
		publicKey: receiver,
		tokenId: zkToken.deriveTokenId()
	})

	const transaction = await Mina.transaction({ sender: userKey, fee: getFee() }, async () => {
		fundNewAccount(userKey, acc.account ? 0 : 1)
		await zkToken.mint(receiver, tokenAmount)
	})

	return await proveTransaction(transaction)
}

const getReserves = async (pool: string) => {
	logger.start("Fetching reserves", pool)
	const poolAddress = PublicKey.fromBase58(pool)
	const contracts = context().contracts
	const poolInstance = new contracts.Pool(poolAddress)
	const token0 = await poolInstance.token0.fetch()
	const token1 = await poolInstance.token1.fetch()
	logger.debug({ token0, token1 })
	if (!token1 || !token0) throw new Error("Token not found")

	const token0Instance = new contracts.FungibleToken(token0)
	const token1Instance = new contracts.FungibleToken(token1)
	logger.debug({ token0Instance, token1Instance })
	const [minaAccount, token0Account, token1Account, liquidityAccount] = await Promise.all([
		fetchAccount({ publicKey: poolAddress }),
		fetchAccount({ publicKey: poolAddress, tokenId: token0Instance.deriveTokenId() }),
		fetchAccount({ publicKey: poolAddress, tokenId: token1Instance.deriveTokenId() }),
		fetchAccount({ publicKey: poolAddress, tokenId: poolInstance.deriveTokenId() })
	])

	const reserves = {
		token0: token0Account.account?.balance.toString()
			? {
				address: token0.toBase58(),
				amount: token0Account.account?.balance.toString()
			}
			: {
				address: MINA_ADDRESS,
				amount: minaAccount.account?.balance.toString()
			},
		token1: {
			address: token1.toBase58(),
			amount: token1Account.account?.balance.toString()
		},
		liquidity: liquidityAccount.account?.balance.toString()
	}
	logger.debug({ reserves })
	return reserves
}

export interface SwapArgs {
	from: string
	to: string
	pool: string
	user: string
	frontendFee: number
	frontendFeeDestination: string
	amount: number
	minOut: number
	balanceOutMin: number
	balanceInMax: number
	factory: string
}

const swap = async (args: SwapArgs) => {
	logger.start("Swap", args)
	const { poolKey, zkTokenId, zkToken } = await getZkTokenFromPool(args.pool)
	logger.debug({ poolKey, zkTokenId, zkToken })
	const contracts = context().contracts

	const userKey = PublicKey.fromBase58(args.user)
	const TAX_RECEIVER = PublicKey.fromBase58(args.frontendFeeDestination)
	logger.debug({ userKey, TAX_RECEIVER })
	await Promise.all([
		fetchAccount({ publicKey: poolKey }),
		fetchAccount({ publicKey: poolKey, tokenId: zkTokenId }),
		fetchAccount({ publicKey: userKey }),
		fetchAccount({ publicKey: userKey, tokenId: zkTokenId })
	])

	const [acc, accFront, accProtocol] = await Promise.all([
		fetchAccount({ publicKey: userKey, tokenId: zkTokenId }),
		fetchAccount({ publicKey: TAX_RECEIVER, tokenId: zkTokenId }),
		fetchAccount({
			publicKey: await getLuminaAddress(args.factory),
			tokenId: zkTokenId
		})
	])

	const newAcc = acc.account ? 0 : 1
	const newFront = accFront.account ? 0 : 1
	const newAccProtocol = accProtocol.account ? 0 : 1

	const total = newAcc + newFront + newAccProtocol
	logger.debug({ newAcc, newFront, newAccProtocol, total })

	const swapArgList = [
		TAX_RECEIVER,
		UInt64.from(Math.trunc(args.frontendFee)),
		UInt64.from(Math.trunc(args.amount)),
		UInt64.from(Math.trunc(args.minOut)),
		UInt64.from(Math.trunc(args.balanceInMax)),
		UInt64.from(Math.trunc(args.balanceOutMin))
	] as const

	const transaction = await Mina.transaction({ sender: userKey, fee: getFee() }, async () => {
		if (args.to === MINA_ADDRESS) {
			const zkPool = new contracts.Pool(poolKey)
			logger.debug({ zkPool })
			await zkPool.swapFromTokenToMina(...swapArgList)
		} else {
			fundNewAccount(userKey, total)
			const zkPoolHolder = new contracts.PoolTokenHolder(poolKey, zkTokenId)
			logger.debug({ zkPoolHolder })
			await zkPoolHolder
				[args.from === MINA_ADDRESS ? "swapFromMinaToToken" : "swapFromTokenToToken"](
					...swapArgList
				)
			await zkToken.approveAccountUpdate(zkPoolHolder.self)
		}
	})

	return await proveTransaction(transaction)
}

type LiquidityToken = {
	address: string
	amount: number
	reserve: number
}
export interface AddLiquidity {
	pool: string
	user: string
	tokenA: LiquidityToken
	tokenB: LiquidityToken
	supplyMin: number
}
const addLiquidity = async (args: AddLiquidity) => {
	logger.start("Add liquidity", args)
	const { poolKey, zkTokenId, zkPoolTokenId, zkPoolTokenKey, zkPool } = await getZkTokenFromPool(
		args.pool
	)
	logger.debug({ poolKey, zkTokenId, zkPoolTokenId, zkPoolTokenKey, zkPool })
	const supply = Math.trunc(args.supplyMin)
	const userKey = PublicKey.fromBase58(args.user)
	logger.debug({ supply, userKey })
	await Promise.all([
		fetchAccount({ publicKey: poolKey }),
		fetchAccount({ publicKey: poolKey, tokenId: zkTokenId }),
		fetchAccount({ publicKey: poolKey, tokenId: zkPoolTokenId }),
		fetchAccount({ publicKey: userKey }),
		fetchAccount({ publicKey: userKey, tokenId: zkTokenId }),
		fetchAccount({ publicKey: userKey, tokenId: zkPoolTokenId })
	])
	const acc = await fetchAccount({ publicKey: userKey, tokenId: zkPoolTokenId })
	const newAccount = acc.account ? 0 : 1
	logger.debug({ newAccount })

	const createSupplyLiquidity = ({
		tokenA,
		tokenB,
		supply
	}: { tokenA: LiquidityToken; tokenB: LiquidityToken; supply: number }) => {
		logger.debug({ tokenA, tokenB, supply })
		const isMina = tokenA.address === MINA_ADDRESS || tokenB.address === MINA_ADDRESS
		if (isMina) {
			const mina = tokenA.address === MINA_ADDRESS ? tokenA : tokenB
			const token = tokenA.address === MINA_ADDRESS ? tokenB : tokenA
			if (supply > 0) {
				return zkPool.supplyLiquidity(
					UInt64.from(Math.trunc(mina.amount)),
					UInt64.from(Math.trunc(token.amount)),
					UInt64.from(Math.trunc(mina.reserve)),
					UInt64.from(Math.trunc(token.reserve)),
					UInt64.from(supply)
				)
			}
			return zkPool.supplyFirstLiquidities(UInt64.from(mina.amount), UInt64.from(token.amount))
		}

		const tokenZero = zkPool.token0.getAndRequireEquals().toBase58()
		const token0 = tokenZero === tokenA.address ? tokenA : tokenB
		const token1 = tokenZero === tokenA.address ? tokenB : tokenA
		if (supply > 0) {
			return zkPool.supplyLiquidityToken(
				UInt64.from(Math.trunc(token0.amount)),
				UInt64.from(Math.trunc(token1.amount)),
				UInt64.from(Math.trunc(token0.reserve)),
				UInt64.from(Math.trunc(token1.reserve)),
				UInt64.from(supply)
			)
		}
		return zkPool.supplyFirstLiquiditiesToken(
			UInt64.from(token0.amount),
			UInt64.from(token1.amount)
		)
	}

	const transaction = await Mina.transaction({ sender: userKey, fee: getFee() }, async () => {
		fundNewAccount(userKey, newAccount)
		await createSupplyLiquidity({ tokenA: args.tokenA, tokenB: args.tokenB, supply })
	})

	return await proveTransaction(transaction)
}

export interface WithdrawLiquidity {
	pool: string
	user: string
	tokenA: LiquidityToken
	tokenB: LiquidityToken
	liquidityAmount: number
	supplyMax: number
}

const withdrawLiquidity = async (args: WithdrawLiquidity) => {
	logger.info("Withdraw liquidity", args)
	const { poolKey, zkTokenId, zkPoolTokenId, zkToken } = await getZkTokenFromPool(args.pool)
	logger.info({ poolKey, zkTokenId, zkPoolTokenId, zkToken })
	const contracts = context().contracts
	const zkHolder = new contracts.PoolTokenHolder(poolKey, zkTokenId)

	const userKey = PublicKey.fromBase58(args.user)
	logger.info({ userKey })
	// Fetch all relevant accounts in parallel
	await Promise.all([
		fetchAccount({ publicKey: poolKey }),
		fetchAccount({ publicKey: poolKey, tokenId: zkTokenId }),
		fetchAccount({ publicKey: userKey }),
		fetchAccount({ publicKey: userKey, tokenId: zkTokenId }),
		fetchAccount({ publicKey: userKey, tokenId: zkPoolTokenId })
	])

	const supply = Math.trunc(args.supplyMax)
	const liquidity = Math.trunc(args.liquidityAmount)
	logger.info({ supply, liquidity })

	const createWithdrawLiquidity = ({
		tokenA,
		tokenB,
		liquidity,
		supply
	}: {
		tokenA: LiquidityToken
		tokenB: LiquidityToken
		liquidity: number
		supply: number
	}) => {
		const isMina = tokenA.address === MINA_ADDRESS || tokenB.address === MINA_ADDRESS
		if (isMina) {
			const mina = tokenA.address === MINA_ADDRESS ? tokenA : tokenB
			const token = tokenA.address === MINA_ADDRESS ? tokenB : tokenA
			return zkHolder.withdrawLiquidity(
				UInt64.from(liquidity),
				UInt64.from(Math.trunc(mina.amount)),
				UInt64.from(Math.trunc(token.amount)),
				UInt64.from(Math.trunc(mina.reserve)),
				UInt64.from(Math.trunc(token.reserve)),
				UInt64.from(supply)
			)
		}

		const tokenZero = zkHolder.token0.getAndRequireEquals().toBase58()
		const token0 = tokenZero === tokenA.address ? tokenA : tokenB
		const token1 = tokenZero === tokenA.address ? tokenB : tokenA
		return zkHolder.withdrawLiquidityToken(
			UInt64.from(liquidity),
			UInt64.from(Math.trunc(token0.amount)),
			UInt64.from(Math.trunc(token1.amount)),
			UInt64.from(Math.trunc(token0.reserve)),
			UInt64.from(Math.trunc(token1.reserve)),
			UInt64.from(supply)
		)
	}

	const transaction = await Mina.transaction({ sender: userKey, fee: getFee() }, async () => {
		await createWithdrawLiquidity({ tokenA: args.tokenA, tokenB: args.tokenB, liquidity, supply })
		await zkToken.approveAccountUpdate(zkHolder.self)
	})
	logger.info("Transaction", transaction)
	return await proveTransaction(transaction)
}

export type FaucetSettings = {
	address: string
	tokenAddress: string
	tokenId: string
}

// Faucet Operations
const claim = async ({ user, faucet }: { user: string; faucet: FaucetSettings }) => {
	logger.start("Claiming", { user, faucet })
	const publicKeyFaucet = PublicKey.fromBase58(faucet.address)
	const userKey = PublicKey.fromBase58(user)
	logger.debug({ publicKeyFaucet, userKey })
	const contracts = context().contracts
	const zkToken = new contracts.FungibleToken(PublicKey.fromBase58(faucet.tokenAddress))
	logger.debug({ zkToken })
	const zkFaucet = new contracts.Faucet(publicKeyFaucet, zkToken.deriveTokenId())
	logger.debug({ zkFaucet })

	const [acc, accFau] = await Promise.all([
		fetchAccount({ publicKey: userKey, tokenId: zkToken.deriveTokenId() }),
		fetchAccount({ publicKey: userKey, tokenId: zkFaucet.deriveTokenId() }),
		fetchAccount({ publicKey: zkFaucet.address }),
		fetchAccount({ publicKey: zkFaucet.address, tokenId: faucet.tokenId }),
		fetchAccount({ publicKey: userKey })
	])

	const newAcc = acc.account?.balance ? 0 : 1
	const newFau = accFau.account?.balance ? 0 : 1
	const total = newAcc + newFau

	logger.debug({ newAcc, newFau, total })

	const transaction = await Mina.transaction({ sender: userKey, fee: getFee() }, async () => {
		fundNewAccount(userKey, total)
		await zkFaucet.claim()
		await zkToken.approveAccountUpdate(zkFaucet.self)
	})
	return await proveTransaction(transaction)
}
export function getMerkle(): MerkleMap {
	const ownerPublic = PublicKey.fromBase58(
		"B62qjabhmpW9yfLbvUz87BR1u462RRqFfXgoapz8X3Fw8uaXJqGG8WH"
	)
	const approvedSignerPublic = PublicKey.fromBase58(
		"B62qjpbiYvHwbU5ARVbE5neMcuxfxg2zt8wHjkWVKHEiD1micG92CtJ"
	)
	const signer1Public = PublicKey.fromBase58(
		"B62qrgWEGhgXQ5PnpEaeJqs1MRx4Jiw2aqSTfyxAsEVDJzqNFm9PEQt"
	)
	const signer2Public = PublicKey.fromBase58(
		"B62qkfpRcsJjByghq8FNkzBh3wmzLYFWJP2qP9x8gJ48ekfd6MVXngy"
	)
	const signer3Public = PublicKey.fromBase58(
		"B62qic5sGvm6QvFzJ92588YgkKxzqi2kFeYydnkM8VDAvY9arDgY6m6"
	)
	const externalSigner1 = PublicKey.fromBase58(
		"B62qkjzL662Z5QD16cB9j6Q5TH74y42ALsMhAiyrwWvWwWV1ypfcV65"
	)
	const externalSigner2 = PublicKey.fromBase58(
		"B62qpLxXFg4rmhce762uiJjNRnp5Bzc9PnCEAcraeaMkVWkPi7kgsWV"
	)
	const externalSigner3 = PublicKey.fromBase58(
		"B62qipa4xp6pQKqAm5qoviGoHyKaurHvLZiWf3djDNgrzdERm6AowSQ"
	)

	const allRight = new SignatureRight(
		Bool(true),
		Bool(true),
		Bool(true),
		Bool(true),
		Bool(true),
		Bool(true)
	)
	const deployRight = SignatureRight.canDeployPool()
	const merkle = new MerkleMap()
	merkle.set(Poseidon.hash(ownerPublic.toFields()), allRight.hash())
	merkle.set(Poseidon.hash(signer1Public.toFields()), allRight.hash())
	merkle.set(Poseidon.hash(signer2Public.toFields()), allRight.hash())
	merkle.set(Poseidon.hash(signer3Public.toFields()), allRight.hash())
	merkle.set(Poseidon.hash(approvedSignerPublic.toFields()), deployRight.hash())
	merkle.set(Poseidon.hash(externalSigner1.toFields()), allRight.hash())
	merkle.set(Poseidon.hash(externalSigner2.toFields()), allRight.hash())
	merkle.set(Poseidon.hash(externalSigner3.toFields()), allRight.hash())

	return merkle
}

const minaInstance = (networkUrl: NetworkUri) => {
	workerState.send({ type: "SetNetwork", network: networkUrl })
	const url = urls[networkUrl]
	Mina.setActiveInstance(Mina.Network(url))
	logger.success("Mina instance set", url)
}

// Export worker API
export const luminaDexWorker = {
	// Unused
	// getBalances,
	// getSupply,
	// getTransactionJSON,
	// getDeploymentKey
	// Contract Management
	loadContracts,
	compileContract,
	// Account & Balance Operations
	// fetchMinaAccountToken,
	getReserves,
	// Deployment Operations
	deployPoolInstance,
	deployToken,
	// Token Operations
	mintToken,
	// Swap Operations
	swap,
	// Liquidity Operations
	addLiquidity,
	withdrawLiquidity,
	// Faucet Operations
	claim,
	minaInstance
}

// Shared Worker
// self.addEventListener("connect", (e) => {
// 	Comlink.expose(luminaDexWorker, (e as MessageEvent).ports[0])
// })

// Worker
logger.info("Initializing LuminaDex Worker")
Comlink.expose(luminaDexWorker)
logger.success("Comlink exposed")

export type LuminaDexWorker = typeof luminaDexWorker
