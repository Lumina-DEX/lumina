import * as Comlink from "comlink"
import { create } from "mutative"
import { AccountUpdate, Bool, Mina, PrivateKey, PublicKey, UInt8, UInt64, fetchAccount } from "o1js"

import type {
	Faucet,
	FungibleToken,
	FungibleTokenAdmin,
	Pool,
	PoolData,
	PoolFactory,
	PoolTokenHolder
} from "@lumina/contracts"

import { fetchFiles, readCache } from "./cache"

// Types
type Contracts = {
	Pool: typeof Pool
	PoolData: typeof PoolData
	PoolFactory: typeof PoolFactory
	PoolMinaHolder: typeof PoolTokenHolder
	TokenStandard: typeof FungibleToken
	TokenAdmin: typeof FungibleTokenAdmin
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
	readonly deployKey: Nullable<string>
}

// Constants
const TAX_RECEIVER = PublicKey.fromBase58("B62qoSZbMLJSP7dHLqe8spFPFSsUoENnMSHJN8i5bS1X4tdGpAZuwAC")
const TAX_FEE_FRONTEND = 0
const LUMINA_KEY = PublicKey.fromBase58("B62qk7R5wo6WTwYSpBHPtfikGvkuasJGEv4ZsSA2sigJdqJqYsWUzA1")

let LuminaAddress = ""

// Initial state
const initialState: WorkerState = {
	contracts: {} as Contracts,
	zk: { token: null, pool: null, factory: null, poolData: null, holder: null, faucet: null },
	transaction: null,
	deployKey: null
}

let workerState = create(initialState, () => {})

// Transaction Helper
const proveTransaction = async (transaction: Transaction) => {
	workerState = create(workerState, (draft) => {
		//@ts-ignore infinite instantiation
		draft.transaction = transaction
	})
	await transaction.prove()
	return transaction.toJSON()
}

// Contract Management
const loadContract = async () => {
	const {
		PoolFactory,
		Pool,
		PoolData,
		PoolTokenHolder: PoolMinaHolder,
		FungibleToken: TokenStandard,
		FungibleTokenAdmin: TokenAdmin,
		Faucet
		//@ts-ignore TODO: fix import
	} = await import("@lumina/contracts")

	workerState = create(workerState, (draft) => {
		draft.contracts = {
			PoolFactory,
			Pool,
			PoolData,
			PoolMinaHolder,
			TokenStandard,
			TokenAdmin,
			Faucet
		}
	})
}

const compileContract = async () => {
	const cacheFiles = await fetchFiles()
	const cache = readCache(cacheFiles)

	await Promise.all([
		workerState.contracts.TokenAdmin.compile({ cache }),
		workerState.contracts.TokenStandard.compile({ cache }),
		workerState.contracts.PoolFactory.compile({ cache }),
		workerState.contracts.PoolData.compile({ cache }),
		workerState.contracts.PoolMinaHolder.compile({ cache }),
		workerState.contracts.Pool.compile({ cache }),
		workerState.contracts.Faucet.compile({ cache })
	])
}

const fetchMinaAccountToken = async (pk: string) => {
	const publicKey = PublicKey.fromBase58(pk)
	return await fetchAccount({ publicKey, tokenId: workerState.zk.token?.deriveTokenId() })
}

const getZkTokenFromPool = async (pool: string) => {
	const poolKey = PublicKey.fromBase58(pool)

	const zkPool = new workerState.contracts.Pool(poolKey)
	const zkPoolTokenKey = await zkPool.token1.fetch()
	if (!zkPoolTokenKey) throw new Error("ZKPool Token Key not found")

	const zkToken = new workerState.contracts.TokenStandard(zkPoolTokenKey)

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
	const zkFactory = new workerState.contracts.PoolFactory(factoryKey)

	const zkHolder = new workerState.contracts.PoolMinaHolder(poolKey, zkTokenId)

	const publicKeyFaucet = PublicKey.fromBase58(faucet)
	const zkFaucet = new workerState.contracts.Faucet(publicKeyFaucet, zkTokenId)

	const poolDataPublicKey = await zkFactory.poolData.fetch()
	if (!poolDataPublicKey) throw new Error("PoolData not found")

	const zkPoolData = new workerState.contracts.PoolData(poolDataPublicKey)
	const la = (await zkPoolData.protocol.fetch())?.toBase58()
	if (!la) throw new Error("Lumina Address not found")

	LuminaAddress = la

	await Promise.all([
		fetchAccount({ publicKey: poolKey }),
		fetchAccount({ publicKey: zkPoolTokenKey }),
		fetchAccount({ publicKey: factoryKey }),
		fetchAccount({ publicKey: poolKey, tokenId: zkTokenId }),
		fetchAccount({ publicKey: publicKeyFaucet, tokenId: zkTokenId })
	])

	workerState = create(workerState, (draft) => {
		const zk = {
			token: zkToken,
			pool: zkPool,
			poolData: zkPoolData,
			factory: zkFactory,
			holder: zkHolder,
			faucet: zkFaucet
		}
		//@ts-ignore infinite instantiation
		draft.zk = zk
	})
}

const deployPoolInstance = async ({
	tokenAddress,
	tokenA,
	tokenB = "minaAddress",
	user
}: { tokenAddress: string; user: string; tokenA: string; tokenB?: string }) => {
	const poolKey = PrivateKey.random()
	console.log("pool key", poolKey.toBase58())
	console.log("pool address", poolKey.toPublicKey().toBase58())
	const deployedKey = poolKey.toBase58()
	workerState = create(workerState, (draft) => {
		draft.deployKey = deployedKey
	})

	const isPoolToken = tokenB !== "minaAddress"

	const transaction = await Mina.transaction(PublicKey.fromBase58(user), async () => {
		AccountUpdate.fundNewAccount(PublicKey.fromBase58(user), 4)
		if (!workerState.zk.factory) throw new Error("Factory not initialized")
		//TODO: isPoolToken
		await workerState.zk.factory.createPool(
			poolKey.toPublicKey(),
			PublicKey.fromBase58(tokenAddress)
		)
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

	const zkToken = new workerState.contracts.TokenStandard(tokenPrivateKey.toPublicKey())
	const zkTokenAdmin = new workerState.contracts.TokenAdmin(tokenAdminPrivateKey.toPublicKey())

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

	const zkToken = new workerState.contracts.TokenStandard(tokenPublic)

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

	const poolInstance = new workerState.contracts.Pool(poolAddress)
	const token = await poolInstance.token1.fetch()
	if (!token) throw new Error("Token not found")

	const tokenInstance = new workerState.contracts.TokenStandard(token)

	const [baseAccount, tokenAccount, liquidityAccount] = await Promise.all([
		fetchAccount({ publicKey: poolAddress }),
		fetchAccount({
			publicKey: poolAddress,
			tokenId: tokenInstance.deriveTokenId()
		}),
		fetchAccount({
			publicKey: poolAddress,
			tokenId: poolInstance.deriveTokenId()
		})
	])

	return {
		amountToken: tokenAccount.account?.balance.toString(),
		amountMina: baseAccount.account?.balance.toString(),
		liquidity: liquidityAccount.account?.balance.toString()
	}
}

export interface Swap {
	from: string
	to: string
	pool: string
	user: string
	amount: number
	minOut: number
	balanceOutMin: number
	balanceInMax: number
}

// TODO : Universal Swap
const swap = async (args: Swap) => {
	//IF Mina
	// swapFromMinaToToken(args)
	// OR ELSE
	// SwapFromTokenToToke(args)
	// OR ELSE
	// SwapFromTokenToMina(args)
}

export interface SwapFrom {
	pool: string
	user: string
	amount: number
	minOut: number
	balanceOutMin: number
	balanceInMax: number
}

const swapFromMina = async (args: SwapFrom) => {
	const poolAddress = PublicKey.fromBase58(args.pool)
	const zkPool = new workerState.contracts.Pool(poolAddress)
	const token = await zkPool.token1.fetch()
	if (!token) throw new Error("Token not found")
	const zkToken = new workerState.contracts.TokenStandard(token)
	const zkPoolHolder = new workerState.contracts.PoolMinaHolder(
		poolAddress,
		zkToken.deriveTokenId()
	)

	const amountIn = Math.trunc(args.amount)
	const amountOut = Math.trunc(args.minOut)
	const balanceOut = Math.trunc(args.balanceOutMin)
	const balanceIn = Math.trunc(args.balanceInMax)

	console.log("Network", Mina.getNetworkId())
	console.log("Graphql", Mina.activeInstance.getNetworkState)

	const publicKey = PublicKey.fromBase58(args.user)

	await Promise.all([
		fetchAccount({ publicKey: poolAddress }),
		fetchAccount({ publicKey: poolAddress, tokenId: zkToken.deriveTokenId() }),
		fetchAccount({ publicKey })
	])

	const acc = await fetchAccount({ publicKey, tokenId: zkToken.deriveTokenId() })
	const accFront = await fetchAccount({ publicKey: TAX_RECEIVER, tokenId: zkToken.deriveTokenId() })
	const accProtocol = await fetchAccount({
		publicKey: LuminaAddress,
		tokenId: zkToken.deriveTokenId()
	})

	const newAcc = acc.account ? 0 : 1
	const newFront = accFront.account ? 0 : 1
	const newAccProtocol = accProtocol.account ? 0 : 1

	const total = newAcc + newFront + newAccProtocol

	console.log("token", token?.toBase58())

	const transaction = await Mina.transaction(publicKey, async () => {
		AccountUpdate.fundNewAccount(publicKey, total)
		await zkPoolHolder.swapFromMina(
			TAX_RECEIVER,
			//TODO: Add validation 0-15
			UInt64.from(TAX_FEE_FRONTEND),
			UInt64.from(amountIn),
			UInt64.from(amountOut),
			UInt64.from(balanceIn),
			UInt64.from(balanceOut)
		)
		await zkToken?.approveAccountUpdate(zkPoolHolder.self)
	})
	return await proveTransaction(transaction)
}

const swapFromToken = async (args: SwapFrom) => {
	const { poolKey, zkTokenId, zkPoolTokenKey, zkPool } = await getZkTokenFromPool(args.pool)

	const amounts = {
		in: Math.trunc(args.amount),
		out: Math.trunc(args.minOut),
		balanceOut: Math.trunc(args.balanceOutMin),
		balanceIn: Math.trunc(args.balanceInMax)
	}

	const userKey = PublicKey.fromBase58(args.user)

	await Promise.all([
		fetchAccount({ publicKey: poolKey }),
		fetchAccount({ publicKey: poolKey, tokenId: zkTokenId }),
		fetchAccount({ publicKey: userKey }),
		fetchAccount({ publicKey: userKey, tokenId: zkTokenId })
	])

	const accFront = await fetchAccount({ publicKey: TAX_RECEIVER })
	const newFront = accFront.account ? 0 : 1
	const accProtocol = await fetchAccount({ publicKey: LUMINA_KEY })
	const newAccProtocol = accProtocol.account ? 0 : 1

	const total = newFront + newAccProtocol

	console.log("token", zkPoolTokenKey?.toBase58())

	const transaction = await Mina.transaction(userKey, async () => {
		AccountUpdate.fundNewAccount(userKey, total)
		await zkPool.swapTokenForMina(
			TAX_RECEIVER,
			//TODO: Add validation 0-15
			UInt64.from(TAX_FEE_FRONTEND),
			UInt64.from(amounts.in),
			UInt64.from(amounts.out),
			UInt64.from(amounts.balanceIn),
			UInt64.from(amounts.balanceOut)
		)
	})

	return await proveTransaction(transaction)
}

//TODO: Allow token/token
export interface AddLiquidity {
	pool: string
	user: string
	amountMina: number
	amountToken: number
	reserveMinaMax: number
	reserveTokenMax: number
	supplyMin: number
}
const addLiquidity = async (args: AddLiquidity) => {
	const { poolKey, zkTokenId, zkPoolTokenId, zkPoolTokenKey, zkPool } = await getZkTokenFromPool(
		args.pool
	)

	const amounts = {
		minaIn: Math.trunc(args.amountMina),
		tokenIn: Math.trunc(args.amountToken),
		reserveMina: Math.trunc(args.reserveMinaMax),
		reserveToken: Math.trunc(args.reserveTokenMax),
		supply: Math.trunc(args.supplyMin)
	}

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

	const transaction = await Mina.transaction(userKey, async () => {
		AccountUpdate.fundNewAccount(userKey, newAccount)
		//TODO: If Mina
		if (amounts.supply > 0) {
			await zkPool.supplyLiquidity(
				UInt64.from(amounts.minaIn),
				UInt64.from(amounts.tokenIn),
				UInt64.from(amounts.reserveMina),
				UInt64.from(amounts.reserveToken),
				UInt64.from(amounts.supply)
			)
		} else {
			await zkPool.supplyFirstLiquidities(UInt64.from(amounts.minaIn), UInt64.from(amounts.tokenIn))
		}
		//TODO: If not mina
	})

	return await proveTransaction(transaction)
}

//TODO: Allow token/token
export interface WithdrawLiquidity {
	pool: string
	user: string
	liquidityAmount: number
	amountMinaMin: number
	amountTokenMin: number
	reserveMinaMin: number
	reserveTokenMin: number
	supplyMax: number
}
const withdrawLiquidity = async (args: WithdrawLiquidity) => {
	const { poolKey, zkTokenId, zkPoolTokenId, zkToken } = await getZkTokenFromPool(args.pool)

	const zkHolder = new workerState.contracts.PoolMinaHolder(poolKey, zkTokenId)

	const amounts = {
		liquidityIn: Math.trunc(args.liquidityAmount),
		minaOut: Math.trunc(args.amountMinaMin),
		tokenOut: Math.trunc(args.amountTokenMin),
		reserveMina: Math.trunc(args.reserveMinaMin),
		reserveToken: Math.trunc(args.reserveTokenMin),
		supply: Math.trunc(args.supplyMax)
	}

	const userKey = PublicKey.fromBase58(args.user)

	// Fetch all relevant accounts in parallel
	await Promise.all([
		fetchAccount({ publicKey: poolKey }),
		fetchAccount({ publicKey: poolKey, tokenId: zkTokenId }),
		fetchAccount({ publicKey: userKey }),
		fetchAccount({ publicKey: userKey, tokenId: zkTokenId }),
		fetchAccount({ publicKey: userKey, tokenId: zkPoolTokenId })
	])

	const transaction = await Mina.transaction(userKey, async () => {
		//TODO: Add if Mina
		await zkHolder.withdrawLiquidity(
			UInt64.from(amounts.liquidityIn),
			UInt64.from(amounts.minaOut),
			UInt64.from(amounts.tokenOut),
			UInt64.from(amounts.reserveMina),
			UInt64.from(amounts.reserveToken),
			UInt64.from(amounts.supply)
		)
		await zkToken.approveAccountUpdate(zkHolder.self)
	})

	return await proveTransaction(transaction)
}

// Faucet Operations
const claim = async ({ user }: { user: string }) => {
	console.log("Network", Mina.getNetworkId())
	console.log("Graphql", Mina.activeInstance.getNetworkState)

	if (!workerState.zk.faucet || !workerState.zk.token) throw new Error("Faucet not initialized")

	const userKey = PublicKey.fromBase58(user)
	const zkTokenId = workerState.zk.token.deriveTokenId()
	const zkFaucetId = workerState.zk.faucet.deriveTokenId()
	await Promise.all([
		fetchAccount({ publicKey: workerState.zk.faucet.address }),
		fetchAccount({ publicKey: workerState.zk.faucet.address, tokenId: zkTokenId }),
		fetchAccount({ publicKey: userKey })
	])

	const [acc, accFau] = await Promise.all([
		fetchAccount({ publicKey: userKey, tokenId: zkTokenId }),
		fetchAccount({ publicKey: userKey, tokenId: zkFaucetId })
	])

	const newAcc = acc.account?.balance ? 0 : 1
	const newFau = accFau.account?.balance ? 0 : 1
	const total = newAcc + newFau
	const token = await workerState.zk.faucet.token.fetch()
	console.log("token", token?.toBase58())

	const transaction = await Mina.transaction(userKey, async () => {
		if (!workerState.zk.faucet || !workerState.zk.token) throw new Error("Faucet not initialized")
		AccountUpdate.fundNewAccount(userKey, total)
		await workerState.zk.faucet.claim()
		await workerState.zk.token.approveAccountUpdate(workerState.zk.faucet.self)
	})

	return await proveTransaction(transaction)
}

// Export worker API
export const luminaDexWorker = {
	//Unused
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
	swapFromMina,
	swapFromToken,
	// Liquidity Operations
	addLiquidity,
	withdrawLiquidity,
	// Faucet Operations
	claim
}

Comlink.expose(luminaDexWorker)

export type LuminaDexWorker = typeof luminaDexWorker

//SetActiveInstanceToDevenet
//SetActiveInstanceToZeko
//GetActiveInstance
// async function fetchMinaAccount({ publicKey58 }: PublicKey58Args) {
//     return await fetchAccount({ publicKey: PublicKey.fromBase58(publicKey58) })
// }
// const getBalance = async (publicKey58: string) => {
// 	const publicKey = PublicKey.fromBase58(publicKey58)
// 	const balance = Mina.getBalance(publicKey)
// 	return balance.toJSON()
// }

// const getBalanceToken = async (publicKey58: string, tokenAddress: string) => {
// 	const publicKey = PublicKey.fromBase58(publicKey58)
// 	const address = PublicKey.fromBase58(tokenAddress)
// 	const tokenId = TokenId.derive(address)

// 	const account = await fetchAccount({ publicKey, tokenId })
// 	const balance = account?.account ? account.account.balance : UInt64.zero
// 	return balance.toJSON()
// }

// const getSupply = async () => {
// 	const pool = workerState.zk.pool
// 	if (!pool) throw new Error("Zkapp not initialized")
// 	const publicKey = pool.address
// 	const tokenId = pool.deriveTokenId()
// 	const acc = await fetchAccount({ publicKey, tokenId })
// 	return acc.account?.balance.toJSON()
// }

// const getBalances = async (user: string) => {
// 	const { zk } = workerState
// 	if (!zk.token || !zk.pool) throw new Error("Instances not initialized")

// 	const publicKey = PublicKey.fromBase58(user)

// 	const [accMina, accToken, accLiquidity] = await Promise.all([
// 		fetchAccount({ publicKey }),
// 		fetchAccount({ publicKey, tokenId: zk.token.deriveTokenId() }),
// 		fetchAccount({ publicKey, tokenId: zk.pool.deriveTokenId() })
// 	])

// 	return {
// 		mina: accMina.account?.balance.toString() ?? "0",
// 		token: accToken.account?.balance.toString() ?? "0",
// 		liquidity: accLiquidity.account?.balance.toString() ?? "0"
// 	}
// }

// const getTransactionJSON = () => workerState.transaction?.toJSON()

// const getDeploymentKey = () => workerState.deployKey
