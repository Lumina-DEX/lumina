import { createStore } from "@xstate/store"
import * as Comlink from "comlink"
import { AccountUpdate, Bool, fetchAccount, Mina, PrivateKey, PublicKey, UInt64, UInt8 } from "o1js"

import type {
	Faucet,
	FungibleToken,
	FungibleTokenAdmin,
	Pool,
	PoolData,
	PoolFactory,
	PoolTokenHolder
} from "@lumina-dex/contracts"

import { MINA_ADDRESS } from "../constants"
import { fetchFiles, readCache } from "./cache"

// Types
type Contracts = {
	Pool: typeof Pool
	PoolData: typeof PoolData
	PoolFactory: typeof PoolFactory
	PoolTokenHolder: typeof PoolTokenHolder
	FungibleToken: typeof FungibleToken
	FungibleTokenAdmin: typeof FungibleTokenAdmin
	Faucet: typeof Faucet
}

type ZkInstances = {
	token: FungibleToken | null
	pool: Pool | null
	poolData: PoolData | null
	factory: PoolFactory | null
	holder: PoolTokenHolder | null
	faucet: Faucet | null
}

type Transaction = Mina.Transaction<false, false>
type Nullable<T> = T | null

type WorkerState = {
	readonly contracts: Contracts
	readonly zk: ZkInstances
	readonly transaction: Nullable<Transaction>
}

let LuminaAddress = ""

const getLuminaAddress = async (poolData: PoolData | null) => {
	if (LuminaAddress.length > 0) return LuminaAddress
	const la = (await poolData?.protocol.fetch())?.toBase58()
	if (!la) throw new Error("Lumina Address not found")
	LuminaAddress = la
	return la
}

// Initial state
const initialState: WorkerState = {
	contracts: {} as Contracts,
	zk: { token: null, pool: null, factory: null, poolData: null, holder: null, faucet: null },
	transaction: null
}

const workerState = createStore({
	context: initialState,
	on: {
		SetContracts: { contracts: (_, event: { contracts: Contracts }) => event.contracts },
		SetZk: { zk: (_, event: { zk: ZkInstances }) => event.zk },
		SetTransaction: { transaction: (_, event: { transaction: Transaction }) => event.transaction }
	}
})

const context = () => workerState.getSnapshot().context

// Transaction Helper
const proveTransaction = async (transaction: Transaction) => {
	workerState.send({ type: "SetTransaction", transaction })
	await transaction.prove()
	return transaction.toJSON()
}

// Contract Management
const loadContract = async () => {
	const {
		PoolFactory,
		Pool,
		PoolData,
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
			PoolData,
			PoolTokenHolder,
			FungibleToken,
			FungibleTokenAdmin,
			Faucet
		}
	})
}

const compileContract = async () => {
	const cacheFiles = await fetchFiles()
	const cache = readCache(cacheFiles)
	const contracts = context().contracts
	await Promise.all([
		contracts.FungibleTokenAdmin.compile({ cache }),
		contracts.FungibleToken.compile({ cache }),
		contracts.PoolFactory.compile({ cache }),
		contracts.PoolData.compile({ cache }),
		contracts.PoolTokenHolder.compile({ cache }),
		contracts.Pool.compile({ cache }),
		contracts.Faucet.compile({ cache })
	])
}

const fetchMinaAccountToken = async (pk: string) => {
	const publicKey = PublicKey.fromBase58(pk)
	return await fetchAccount({ publicKey, tokenId: context().zk.token?.deriveTokenId() })
}

const getZkTokenFromPool = async (pool: string) => {
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

export interface InitZkappInstance {
	pool: string
	faucet: string
	factory: string
}
const initZkappInstance = async ({ pool, faucet, factory }: InitZkappInstance) => {
	const { poolKey, zkTokenId, zkPoolTokenKey, zkToken, zkPool } = await getZkTokenFromPool(pool)

	const factoryKey = PublicKey.fromBase58(factory)
	const contracts = context().contracts

	const zkFactory = new contracts.PoolFactory(factoryKey)

	const zkHolder = new contracts.PoolTokenHolder(poolKey, zkTokenId)

	const publicKeyFaucet = PublicKey.fromBase58(faucet)
	const zkFaucet = new contracts.Faucet(publicKeyFaucet, zkTokenId)

	const poolDataPublicKey = await zkFactory.poolData.fetch()
	if (!poolDataPublicKey) throw new Error("PoolData not found")

	const zkPoolData = new contracts.PoolData(poolDataPublicKey)

	await Promise.all([
		fetchAccount({ publicKey: poolKey }),
		fetchAccount({ publicKey: zkPoolTokenKey }),
		fetchAccount({ publicKey: factoryKey }),
		fetchAccount({ publicKey: poolKey, tokenId: zkTokenId }),
		fetchAccount({ publicKey: publicKeyFaucet, tokenId: zkTokenId })
	])

	workerState.send({
		type: "SetZk",
		zk: {
			token: zkToken,
			pool: zkPool,
			poolData: zkPoolData,
			factory: zkFactory,
			holder: zkHolder,
			faucet: zkFaucet
		}
	})
}

const deployPoolInstance = async ({
	tokenA,
	tokenB,
	user
}: { user: string; tokenA: string; tokenB: string }) => {
	const poolKey = PrivateKey.random()
	console.log("pool key", poolKey.toBase58())
	console.log("pool address", poolKey.toPublicKey().toBase58())

	const zk = context().zk

	const isMinaTokenPool = tokenA === MINA_ADDRESS || tokenB === MINA_ADDRESS

	const transaction = await Mina.transaction(PublicKey.fromBase58(user), async () => {
		if (!zk.factory) throw new Error("Factory not initialized")
		AccountUpdate.fundNewAccount(PublicKey.fromBase58(user), 4)
		if (isMinaTokenPool) {
			const token = tokenA === MINA_ADDRESS ? tokenB : tokenA
			await zk.factory.createPool(poolKey.toPublicKey(), PublicKey.fromBase58(token))
		}
		if (!isMinaTokenPool) {
			await zk.factory.createPoolToken(
				poolKey.toPublicKey(),
				PublicKey.fromBase58(tokenA),
				PublicKey.fromBase58(tokenB)
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
	const tokenPrivateKey = PrivateKey.fromBase58(tokenKey)
	const tokenAdminPrivateKey = PrivateKey.fromBase58(tokenAdminKey)
	const userPublicKey = PublicKey.fromBase58(user)

	const contracts = context().contracts

	const zkToken = new contracts.FungibleToken(tokenPrivateKey.toPublicKey())
	const zkTokenAdmin = new contracts.FungibleTokenAdmin(tokenAdminPrivateKey.toPublicKey())

	const transaction = await Mina.transaction(userPublicKey, async () => {
		AccountUpdate.fundNewAccount(userPublicKey, 3)
		await zkTokenAdmin.deploy({
			adminPublicKey: userPublicKey
		})
		await zkToken.deploy({
			symbol,
			src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts"
		})
		await zkToken.initialize(tokenAdminPrivateKey.toPublicKey(), UInt8.from(9), Bool(false))
	})

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
	const tokenPublic = PublicKey.fromBase58(token)
	const userKey = PublicKey.fromBase58(user)
	const receiver = PublicKey.fromBase58(to)
	const tokenAmount = UInt64.from(amount * 10 ** 9)

	const contracts = context().contracts

	const zkToken = new contracts.FungibleToken(tokenPublic)

	const acc = await fetchAccount({
		publicKey: receiver,
		tokenId: zkToken.deriveTokenId()
	})

	const transaction = await Mina.transaction(userKey, async () => {
		AccountUpdate.fundNewAccount(userKey, acc.account ? 0 : 1)
		await zkToken.mint(receiver, tokenAmount)
	})

	return await proveTransaction(transaction)
}

const getReserves = async (pool: string) => {
	const poolAddress = PublicKey.fromBase58(pool)
	const contracts = context().contracts

	const poolInstance = new contracts.Pool(poolAddress)
	const token0 = await poolInstance.token0.fetch()
	const token1 = await poolInstance.token1.fetch()
	if (!token1 || !token0) throw new Error("Token not found")

	const token0Instance = new contracts.FungibleToken(token0)
	const token1Instance = new contracts.FungibleToken(token1)

	const [token0Account, token1Account, liquidityAccount] = await Promise.all([
		fetchAccount({ publicKey: poolAddress, tokenId: token0Instance.deriveTokenId() }),
		fetchAccount({ publicKey: poolAddress, tokenId: token1Instance.deriveTokenId() }),
		fetchAccount({ publicKey: poolAddress, tokenId: poolInstance.deriveTokenId() })
	])

	return {
		token0: {
			address: token0.toBase58(),
			amount: token0Account.account?.balance.toString()
		},
		token1: {
			address: token1.toBase58(),
			amount: token1Account.account?.balance.toString()
		},
		liquidity: liquidityAccount.account?.balance.toString()
	}
}

export interface SwapArgs {
	from: string
	pool: string
	user: string
	frontendFee: number
	frontendFeeDestination: string
	amount: number
	minOut: number
	balanceOutMin: number
	balanceInMax: number
}

const swap = async (args: SwapArgs) => {
	const { poolKey, zkTokenId } = await getZkTokenFromPool(args.pool)
	const { zk, contracts } = context()

	const zkPoolHolder = new contracts.PoolTokenHolder(poolKey, zkTokenId)

	const userKey = PublicKey.fromBase58(args.user)

	const TAX_RECEIVER = PublicKey.fromBase58(args.frontendFeeDestination)

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
			publicKey: await getLuminaAddress(zk.poolData),
			tokenId: zkTokenId
		})
	])

	const newAcc = acc.account ? 0 : 1
	const newFront = accFront.account ? 0 : 1
	const newAccProtocol = accProtocol.account ? 0 : 1

	const total = newAcc + newFront + newAccProtocol

	const transaction = await Mina.transaction(userKey, async () => {
		AccountUpdate.fundNewAccount(userKey, total)
		await zkPoolHolder[args.from === MINA_ADDRESS ? "swapFromMina" : "swapFromToken"](
			TAX_RECEIVER,
			UInt64.from(Math.trunc(args.frontendFee)),
			UInt64.from(Math.trunc(args.amount)),
			UInt64.from(Math.trunc(args.minOut)),
			UInt64.from(Math.trunc(args.balanceInMax)),
			UInt64.from(Math.trunc(args.balanceOutMin))
		)
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
	const { poolKey, zkTokenId, zkPoolTokenId, zkPoolTokenKey, zkPool } = await getZkTokenFromPool(
		args.pool
	)

	const supply = Math.trunc(args.supplyMin)

	const userKey = PublicKey.fromBase58(args.user)

	await Promise.all([
		fetchAccount({ publicKey: poolKey }),
		fetchAccount({ publicKey: poolKey, tokenId: zkTokenId }),
		fetchAccount({ publicKey: userKey }),
		fetchAccount({ publicKey: userKey, tokenId: zkTokenId })
	])

	console.log("add liquidity")

	const acc = await fetchAccount({ publicKey: userKey, tokenId: zkPoolTokenId })
	const newAccount = acc.account ? 0 : 1

	console.log("address", { poolAddress: poolKey.toBase58(), token: zkPoolTokenKey.toBase58() })

	const createSupplyLiquidity = ({
		tokenA,
		tokenB,
		supply
	}: { tokenA: LiquidityToken; tokenB: LiquidityToken; supply: number }) => {
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

	const transaction = await Mina.transaction(userKey, async () => {
		AccountUpdate.fundNewAccount(userKey, newAccount)
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
	const { poolKey, zkTokenId, zkPoolTokenId, zkToken } = await getZkTokenFromPool(args.pool)

	const contracts = context().contracts
	const zkHolder = new contracts.PoolTokenHolder(poolKey, zkTokenId)

	const userKey = PublicKey.fromBase58(args.user)

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

	const transaction = await Mina.transaction(userKey, async () => {
		await createWithdrawLiquidity({ tokenA: args.tokenA, tokenB: args.tokenB, liquidity, supply })
		await zkToken.approveAccountUpdate(zkHolder.self)
	})

	return await proveTransaction(transaction)
}

// Faucet Operations
const claim = async ({ user }: { user: string }) => {
	console.log("Network", Mina.getNetworkId())
	console.log("Graphql", Mina.activeInstance.getNetworkState)

	const zk = context().zk

	if (!zk.faucet || !zk.token) throw new Error("Faucet not initialized")

	const userKey = PublicKey.fromBase58(user)
	const zkTokenId = zk.token.deriveTokenId()
	const zkFaucetId = zk.faucet.deriveTokenId()
	await Promise.all([
		fetchAccount({ publicKey: zk.faucet.address }),
		fetchAccount({ publicKey: zk.faucet.address, tokenId: zkTokenId }),
		fetchAccount({ publicKey: userKey })
	])

	const [acc, accFau] = await Promise.all([
		fetchAccount({ publicKey: userKey, tokenId: zkTokenId }),
		fetchAccount({ publicKey: userKey, tokenId: zkFaucetId })
	])

	const newAcc = acc.account?.balance ? 0 : 1
	const newFau = accFau.account?.balance ? 0 : 1
	const total = newAcc + newFau
	const token = await zk.faucet.token.fetch()
	console.log("token", token?.toBase58())

	const transaction = await Mina.transaction(userKey, async () => {
		if (!zk.faucet || !zk.token) throw new Error("Faucet not initialized")
		AccountUpdate.fundNewAccount(userKey, total)
		await zk.faucet.claim()
		await zk.token.approveAccountUpdate(zk.faucet.self)
	})

	return await proveTransaction(transaction)
}

// Export worker API
export const luminaDexWorker = {
	// Unused
	// getBalances,
	// getSupply,
	// getTransactionJSON,
	// getDeploymentKey
	// Contract Management
	loadContract,
	compileContract,
	initZkappInstance,
	// Account & Balance Operations
	fetchMinaAccountToken,
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
	claim
}

// Shared Worker
self.addEventListener("connect", (e) => {
	Comlink.expose(luminaDexWorker, (e as MessageEvent).ports[0])
})

export type LuminaDexWorker = typeof luminaDexWorker
