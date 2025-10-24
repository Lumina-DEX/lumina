import {
	Account,
	AccountUpdate,
	Bool,
	MerkleMap,
	Mina,
	Poseidon,
	PrivateKey,
	Provable,
	PublicKey,
	Signature,
	TokenId,
	UInt32,
	UInt64,
	UInt8,
	fetchAccount
} from "o1js"

console.log("Load Web Worker.")

import {
	allRight,
	deployPoolRight,
	Multisig,
	MultisigInfo,
	SignatureInfo,
	UpdateAccountInfo,
	type Faucet,
	type FungibleToken,
	type FungibleTokenAdmin,
	type Pool,
	type PoolFactory,
	type PoolTokenHolder
} from "@lumina-dex/contracts"
import { fetchFiles, readCache } from "./cache"

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>

// ---------------------------------------------------------------------------------------

const state = {
	TokenAdmin: null as null | typeof FungibleTokenAdmin,
	TokenStandard: null as null | typeof FungibleToken,
	PoolMina: null as null | typeof Pool,
	PoolFactory: null as null | typeof PoolFactory,
	PoolMinaHolder: null as null | typeof PoolTokenHolder,
	Faucet: null as null | typeof Faucet,
	zkapp: null as null | Pool,
	zkFactory: null as null | PoolFactory,
	zkHolder: null as null | PoolTokenHolder,
	zkToken: null as null | FungibleToken,
	zkFaucet: null as null | Faucet,
	transaction: null as null | Transaction,
	key: null as null | string,
	isZeko: false
}

const testPrivateKey = "EKEEHJZhoyjfJEvLoLCrRZosz29hnfn8Nx6Wfx74hgQV4xbrkCTf"
const testPublicKey = "B62qrLNBqyoECio41DRkRio2DjPsVQUkcyDitM3F9t1ajK3vp2UApja"
const frontend = PublicKey.fromBase58("B62qrUAGW6S4pSBcZko2LdbUAhtLd15zVs9KtQedScBvwuZVbcnej35")
const protocol = PublicKey.fromBase58("B62qpBKidvBH2YEWCwwkzLMFoBWa2fZknj6K5YWdqF5wAiLgoTExh42")
const frontendFee = 10

// ---------------------------------------------------------------------------------------

const functions = {
	setActiveInstanceToDevnet: async (args: {}) => {
		let currentLocation = self.location.origin
		const devnet = Mina.Network({
			networkId: "testnet",
			mina: currentLocation + "/api/proxy",
			archive: "https://api.minascan.io/archive/devnet/v1/graphql"
		})
		state.isZeko = false
		Mina.setActiveInstance(devnet)
	},
	setActiveInstanceToZeko: async (args: {}) => {
		const zeko = Mina.Network({
			networkId: "testnet",
			mina: "https://devnet.zeko.io/graphql",
			archive: "https://devnet.zeko.io/graphql"
		})
		state.isZeko = true
		Mina.setActiveInstance(zeko)
	},

	getActiveInstance: async (args: {}) => {
		return JSON.stringify({ isZeko: state.isZeko })
	},

	loadContract: async (args: {}) => {
		const { PoolFactory, Pool, PoolTokenHolder, FungibleToken, FungibleTokenAdmin, Faucet } = await import(
			"@lumina-dex/contracts"
		)
		// @ts-ignore
		state.PoolMina = Pool
		state.PoolFactory = PoolFactory
		state.PoolMinaHolder = PoolTokenHolder
		state.TokenStandard = FungibleToken
		state.TokenAdmin = FungibleTokenAdmin
		state.Faucet = Faucet
	},
	compileContract: async (args: {}) => {
		console.time("compile")
		const cacheFiles = await fetchFiles()
		const cache = readCache(cacheFiles)

		await state.TokenAdmin?.compile({ cache })
		await state.TokenStandard?.compile({ cache })
		//await state.PoolFactory!.compile({ cache });
		//await state.PoolMinaHolder!.compile({ cache });
		//await state.PoolMina!.compile({ cache });
		//await state.Faucet!.compile({ cache });

		console.timeEnd("compile")
	},
	fetchAccount: async (args: { publicKey58: string }) => {
		const publicKey = PublicKey.fromBase58(args.publicKey58)
		return await fetchAccount({ publicKey })
	},
	fetchAccountToken: async (args: { publicKey58: string }) => {
		const publicKey = PublicKey.fromBase58(args.publicKey58)
		return await fetchAccount({ publicKey, tokenId: state.zkToken?.deriveTokenId() })
	},
	getBalance: async (args: { publicKey58: string }) => {
		const publicKey = PublicKey.fromBase58(args.publicKey58)
		const balance = Mina.getBalance(publicKey)
		return JSON.stringify(balance.toJSON())
	},
	getDelegator: async () => {
		const delegator = await state.zkFactory?.getDelegator()
		Provable.log("delegator", delegator)
		return delegator.toBase58()
	},
	getBalanceToken: async (args: { publicKey58: string; tokenAddress: string }) => {
		const publicKey = PublicKey.fromBase58(args.publicKey58)
		const tokenAddress = PublicKey.fromBase58(args.tokenAddress)
		const tokenId = TokenId.derive(tokenAddress)
		console.log("tokenId", tokenId)
		const acc = await fetchAccount({ publicKey, tokenId: tokenId })
		const balance = acc?.account ? acc.account.balance : UInt64.zero
		return JSON.stringify(balance.toJSON())
	},
	initZkappInstance: async (args: { pool: string; faucet: string; factory: string }) => {
		const publicKey = PublicKey.fromBase58(args.pool)
		await fetchAccount({ publicKey })
		state.zkapp = new state.PoolMina!(publicKey)
		const token = await state.zkapp.token1.fetch()
		await fetchAccount({ publicKey: token })
		state.zkToken = new state.TokenStandard!(token)

		const factoryKey = PublicKey.fromBase58(args.factory)
		await fetchAccount({ publicKey: factoryKey })
		state.zkFactory = new state.PoolFactory!(factoryKey)

		await fetchAccount({ publicKey, tokenId: state.zkToken.deriveTokenId() })
		state.zkHolder = new state.PoolMinaHolder!(publicKey, state.zkToken.deriveTokenId())

		const publicKeyFaucet = PublicKey.fromBase58(args.faucet)
		await fetchAccount({ publicKey: publicKeyFaucet, tokenId: state.zkToken.deriveTokenId() })
		state.zkFaucet = new state.Faucet!(publicKeyFaucet, state.zkToken.deriveTokenId())
	},
	deployPoolInstance: async (args: { tokenX: string; user: string }) => {
		const poolKey = PrivateKey.random()
		console.log("appkey", poolKey.toBase58())
		console.log("pool address", poolKey.toPublicKey().toBase58())
		const tokenKey = PublicKey.fromBase58(args.tokenX)
		const userKey = PublicKey.fromBase58(args.user)

		const deployRight = deployPoolRight
		const signerPk = PrivateKey.fromBase58("EKE9dyeMmvz6deCC2jD9rBk7d8bG6ZDqVno8wRe8tAbQDussfBYi")
		const user1 = signerPk.toPublicKey()
		const merkle = getMerkle()
		const witness = merkle.getWitness(Poseidon.hash(signerPk.toPublicKey().toFields()))
		const signature = Signature.create(signerPk, poolKey.toPublicKey().toFields())

		const transaction = await Mina.transaction(userKey, async () => {
			fundNewAccount(userKey, 4)
			await state.zkFactory!.createPool(poolKey.toPublicKey(), tokenKey, user1, signature, witness, deployRight)
		})
		state.transaction = transaction
		await state.transaction!.prove()
		await state.transaction.sign([poolKey])

		state.key = poolKey.toBase58()
	},
	deployToken: async (args: { user: string; tokenKey: string; tokenAdminKey: string; symbol: string }) => {
		const tokenKey = PrivateKey.fromBase58(args.tokenKey)
		const tokenAdminKey = PrivateKey.fromBase58(args.tokenAdminKey)
		const tokenPublic = tokenKey.toPublicKey()
		const tokenAdminPublic = tokenAdminKey.toPublicKey()
		const userKey = PublicKey.fromBase58(args.user)

		let zkToken = new state.TokenStandard(tokenPublic)
		let zkTokenAdmin = new state.TokenAdmin(tokenAdminPublic)

		const transaction = await Mina.transaction(userKey, async () => {
			fundNewAccount(userKey, 3)
			await zkTokenAdmin.deploy({
				adminPublicKey: userKey
			})
			await zkToken.deploy({
				symbol: args.symbol,
				src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
				allowUpdates: true
			})
			await zkToken.initialize(tokenAdminPublic, UInt8.from(9), Bool(false))
		})
		state.transaction = transaction
		await state.transaction!.prove()
		await state.transaction.sign([tokenKey, tokenAdminKey])
	},
	mintToken: async (args: { user: string; token: string; to: string; amount: number }) => {
		const tokenPublic = PublicKey.fromBase58(args.token)
		const userKey = PublicKey.fromBase58(args.user)
		const receiver = PublicKey.fromBase58(args.to)
		const amount = UInt64.from(args.amount * 10 ** 9)

		let zkToken = new state.TokenStandard(tokenPublic)

		const acc = await fetchAccount({ publicKey: receiver, tokenId: zkToken.deriveTokenId() })
		let newAcc = acc.account ? 0 : 1

		const transaction = await Mina.transaction(userKey, async () => {
			fundNewAccount(userKey, newAcc)
			await zkToken.mint(receiver, amount)
		})
		state.transaction = transaction
		await state.transaction!.prove()
	},
	getSupply: async (args: {}) => {
		const acc = await fetchAccount({ publicKey: state.zkapp.address, tokenId: state.zkapp?.deriveTokenId() })
		return JSON.stringify(acc.account.balance.toJSON())
	},
	getBalances: async (args: { user: string }) => {
		const publicKey = PublicKey.fromBase58(args.user)
		const accMina = await fetchAccount({ publicKey })
		const acc = await fetchAccount({ publicKey, tokenId: state.zkToken?.deriveTokenId() })
		const accLiquidity = await fetchAccount({ publicKey, tokenId: state.zkapp?.deriveTokenId() })
		const bal = accMina.account ? accMina.account.balance : 0
		const balToken = acc.account ? acc.account.balance : 0
		const balLiquidity = accLiquidity.account ? accLiquidity.account.balance : 0

		return JSON.stringify({ mina: bal, token: balToken, liquidity: balLiquidity })
	},
	getReserves: async (args: { pool: string }) => {
		const poolAddress = PublicKey.fromBase58(args.pool)
		const acc = await fetchAccount({ publicKey: poolAddress })
		const zkPool = new state.PoolMina(poolAddress)
		const token = await zkPool.token1.fetch()
		const zkToken = new state.TokenStandard(token)
		const accToken = await fetchAccount({ publicKey: poolAddress, tokenId: zkToken.deriveTokenId() })
		const accLiquidity = await fetchAccount({ publicKey: poolAddress, tokenId: zkPool.deriveTokenId() })
		const amountToken = await accToken.account.balance
		const amountMina = await acc.account.balance
		const liquidity = await accLiquidity.account.balance
		return JSON.stringify({ amountToken, amountMina, liquidity })
	},
	getNetworkConstants: async (args: {}) => {
		const { genesisTimestamp, slotTime } = Mina.activeInstance.getNetworkConstants()
		return JSON.stringify({ genesisTimestamp, slotTime })
	},
	swapFromMinaTransaction: async (args: {
		pool: string
		user: string
		amt: number
		minOut: number
		balanceOutMin: number
		balanceInMax: number
	}) => {
		const poolAddress = PublicKey.fromBase58(args.pool)
		const zkPool = new state.PoolMina(poolAddress)
		const token = await zkPool.token1.fetch()
		const zkToken = new state.TokenStandard(token)
		const zkPoolHolder = new state.PoolMinaHolder(poolAddress, zkToken.deriveTokenId())

		const amtIn = Math.trunc(args.amt)
		const amtOut = Math.trunc(args.minOut)
		const balanceOut = Math.trunc(args.balanceOutMin)
		const balanceIn = Math.trunc(args.balanceInMax)

		console.log("Network", Mina.getNetworkId())
		console.log("Graphql", Mina.activeInstance.getNetworkState)

		const publicKey = PublicKey.fromBase58(args.user)
		await fetchAccount({ publicKey: poolAddress })
		await fetchAccount({ publicKey: poolAddress, tokenId: zkToken.deriveTokenId() })
		await fetchAccount({ publicKey })
		const acc = await fetchAccount({ publicKey, tokenId: zkToken.deriveTokenId() })
		const accFront = await fetchAccount({ publicKey: frontend, tokenId: zkToken.deriveTokenId() })

		let newAcc = acc.account ? 0 : 1
		let newFront = accFront.account ? 0 : 1
		let total = newAcc + newFront
		console.log("token", token?.toBase58())
		const transaction = await Mina.transaction(publicKey, async () => {
			fundNewAccount(publicKey, total)
			await zkPoolHolder!.swapFromMinaToToken(
				frontend,
				UInt64.from(frontendFee),
				UInt64.from(amtIn),
				UInt64.from(amtOut),
				UInt64.from(balanceIn),
				UInt64.from(balanceOut)
			)
			await zkToken?.approveAccountUpdate(zkPoolHolder.self)
		})
		state.transaction = transaction

		await state.transaction!.prove()
	},
	swapFromTokenTransaction: async (args: {
		pool: string
		user: string
		amt: number
		minOut: number
		balanceOutMin: number
		balanceInMax: number
	}) => {
		const poolAddress = PublicKey.fromBase58(args.pool)
		const zkPool = new state.PoolMina(poolAddress)
		const token = await zkPool.token1.fetch()
		const zkToken = new state.TokenStandard(token)

		const amtIn = Math.trunc(args.amt)
		const amtOut = Math.trunc(args.minOut)
		const balanceOut = Math.trunc(args.balanceOutMin)
		const balanceIn = Math.trunc(args.balanceInMax)

		const publicKey = PublicKey.fromBase58(args.user)

		await fetchAccount({ publicKey: poolAddress })
		await fetchAccount({ publicKey: poolAddress, tokenId: zkToken.deriveTokenId() })
		await fetchAccount({ publicKey })
		await fetchAccount({ publicKey, tokenId: zkToken?.deriveTokenId() })

		const accFront = await fetchAccount({ publicKey: frontend })

		let newFront = accFront.account ? 0 : 1
		console.log("token", token?.toBase58())
		const transaction = await Mina.transaction(publicKey, async () => {
			fundNewAccount(publicKey, newFront)
			await zkPool!.swapFromTokenToMina(
				frontend,
				UInt64.from(frontendFee),
				UInt64.from(amtIn),
				UInt64.from(amtOut),
				UInt64.from(balanceIn),
				UInt64.from(balanceOut)
			)
		})
		state.transaction = transaction

		await state.transaction!.prove()
	},
	addLiquidity: async (args: {
		pool: string
		user: string
		amtMina: number
		amtToken: number
		reserveMinaMax: number
		reserveTokenMax: number
		supplyMin: number
	}) => {
		const poolAddress = PublicKey.fromBase58(args.pool)
		const zkPool = new state.PoolMina(poolAddress)
		const token = await zkPool.token1.fetch()
		const zkToken = new state.TokenStandard(token)

		const amtMinaIn = Math.trunc(args.amtMina)
		const amtTokenIn = Math.trunc(args.amtToken)
		const reserveMina = Math.trunc(args.reserveMinaMax)
		const reserveToken = Math.trunc(args.reserveTokenMax)
		const supply = Math.trunc(args.supplyMin)

		const publicKey = PublicKey.fromBase58(args.user)

		await fetchAccount({ publicKey: poolAddress })
		await fetchAccount({ publicKey: poolAddress, tokenId: zkToken.deriveTokenId() })
		await fetchAccount({ publicKey })
		await fetchAccount({ publicKey, tokenId: zkToken.deriveTokenId() })

		console.log("add liquidity")
		const acc = await fetchAccount({ publicKey, tokenId: zkPool.deriveTokenId() })
		const accPro = await fetchAccount({ publicKey: protocol, tokenId: zkPool.deriveTokenId() })
		let newAcc = acc.account ? 0 : 1
		let newAccPro = accPro.account ? 0 : 1
		let total = newAcc + newAccPro
		console.log("total fund liquidity", total)
		console.log("address", { poolAddress: poolAddress.toBase58(), token: token.toBase58() })
		const transaction = await Mina.transaction(publicKey, async () => {
			if (supply > 0) {
				await zkPool.supplyLiquidity(
					UInt64.from(amtMinaIn),
					UInt64.from(amtTokenIn),
					UInt64.from(reserveMina),
					UInt64.from(reserveToken),
					UInt64.from(supply)
				)
			} else {
				fundNewAccount(publicKey, 1)
				await zkPool.supplyFirstLiquidities(UInt64.from(amtMinaIn), UInt64.from(amtTokenIn))
			}
		})
		state.transaction = transaction

		await state.transaction!.prove()
	},

	withdrawLiquidity: async (args: {
		pool: string
		user: string
		liquidityAmount: number
		amountMinaMin: number
		amountTokenMin: number
		reserveMinaMin: number
		reserveTokenMin: number
		supplyMax: number
	}) => {
		const poolAddress = PublicKey.fromBase58(args.pool)
		const zkPool = new state.PoolMina(poolAddress)
		const token = await zkPool.token1.fetch()
		const zkToken = new state.TokenStandard(token)
		const zkPoolHolder = new state.PoolMinaHolder(poolAddress, zkToken.deriveTokenId())

		const liquidityAmountIn = Math.trunc(args.liquidityAmount)
		const amountMinaOut = Math.trunc(args.amountMinaMin)
		const amountTokenOut = Math.trunc(args.amountTokenMin)
		const reserveMina = Math.trunc(args.reserveMinaMin)
		const reserveToken = Math.trunc(args.reserveTokenMin)
		const supply = Math.trunc(args.supplyMax)

		const publicKey = PublicKey.fromBase58(args.user)

		await fetchAccount({ publicKey: poolAddress })
		await fetchAccount({ publicKey: poolAddress, tokenId: zkToken.deriveTokenId() })
		await fetchAccount({ publicKey })
		await fetchAccount({ publicKey, tokenId: zkToken.deriveTokenId() })
		await fetchAccount({ publicKey, tokenId: zkPool.deriveTokenId() })

		console.log("withdraw liquidity")

		const transaction = await Mina.transaction(publicKey, async () => {
			await zkPoolHolder!.withdrawLiquidity(
				UInt64.from(liquidityAmountIn),
				UInt64.from(amountMinaOut),
				UInt64.from(amountTokenOut),
				UInt64.from(reserveMina),
				UInt64.from(reserveToken),
				UInt64.from(supply)
			)
			await zkToken.approveAccountUpdate(zkPoolHolder.self)
		})
		state.transaction = transaction

		await state.transaction!.prove()
	},
	claim: async (args: { user: string }) => {
		console.log("Network", Mina.getNetworkId())
		console.log("Graphql", Mina.activeInstance.getNetworkState)

		const publicKey = PublicKey.fromBase58(args.user)
		await fetchAccount({ publicKey: state.zkFaucet.address })
		await fetchAccount({ publicKey: state.zkFaucet.address, tokenId: state.zkToken.deriveTokenId() })
		await fetchAccount({ publicKey })
		const acc = await fetchAccount({ publicKey, tokenId: state.zkToken?.deriveTokenId() })
		const accFau = await fetchAccount({ publicKey, tokenId: state.zkFaucet?.deriveTokenId() })

		let newAcc = acc.account?.balance ? 0 : 1
		let newFau = accFau.account?.balance ? 0 : 1
		const total = newAcc + newFau
		const token = await state.zkFaucet?.token.fetch()
		console.log("token", token?.toBase58())
		const transaction = await Mina.transaction(publicKey, async () => {
			fundNewAccount(publicKey, total)
			await state.zkFaucet!.claim()
			await state.zkToken?.approveAccountUpdate(state.zkFaucet.self)
		})
		state.transaction = transaction

		await state.transaction!.prove()
		//await state.transaction!.sign([PrivateKey.fromBase58(testPrivateKey)]).send();
	},
	setNewDelegator: async (args: {
		user: string
		oldUser: string
		newUser: string
		deadlineSlot: number
		user1: string
		signature1: string
		user2: string
		signature2: string
		user3: string
		signature3: string
	}) => {
		console.log("setNewDelegator args", args)
		const publicKey = PublicKey.fromBase58(args.user)
		await fetchAccount({ publicKey: state.zkFactory.address })
		await fetchAccount({ publicKey })

		const merkle = getMerkle()

		const signer1 = PublicKey.fromBase58(args.user1)
		const signer2 = PublicKey.fromBase58(args.user2)
		const signer3 = PublicKey.fromBase58(args.user3)
		const sign1 = Signature.fromBase58(args.signature1)
		const sign2 = Signature.fromBase58(args.signature2)
		const sign3 = Signature.fromBase58(args.signature3)
		// we set allright by default, maybe it can be different
		const newUser = PublicKey.fromBase58(args.newUser)
		const deadlineSlot = UInt32.from(args.deadlineSlot)
		const info = new UpdateAccountInfo({
			oldUser: PublicKey.fromBase58(args.oldUser),
			newUser,
			deadlineSlot,
			right: allRight
		})
		const multi = new MultisigInfo({ approvedUpgrader: merkle.getRoot(), messageHash: info.hash(), deadlineSlot })

		const info1 = new SignatureInfo({
			user: signer1,
			witness: merkle.getWitness(Poseidon.hash(signer1.toFields())),
			signature: sign1,
			right: allRight
		})
		const info2 = new SignatureInfo({
			user: signer2,
			witness: merkle.getWitness(Poseidon.hash(signer2.toFields())),
			signature: sign2,
			right: allRight
		})
		const info3 = new SignatureInfo({
			user: signer3,
			witness: merkle.getWitness(Poseidon.hash(signer3.toFields())),
			signature: sign3,
			right: allRight
		})
		const array = [info1, info2, info3]

		const proof = new Multisig({ info: multi, signatures: array })

		const transaction = await Mina.transaction(publicKey, async () => {
			await state.zkFactory!.setNewDelegator(proof, newUser)
		})
		state.transaction = transaction

		await state.transaction!.prove()
	},
	getTransactionJSON: async (args: {}) => {
		return state.transaction!.toJSON()
	},
	getKey: async (args: {}) => {
		return state.key
	}
}

export function getMerkle(): MerkleMap {
	const ownerPublic = PublicKey.fromBase58("B62qjabhmpW9yfLbvUz87BR1u462RRqFfXgoapz8X3Fw8uaXJqGG8WH")
	const approvedSignerPublic = PublicKey.fromBase58("B62qpko6oWqKU4LwAaT7PSX3b6TYvroj6umbpyEXL5EEeBbiJTUMU5Z")
	const signer1Public = PublicKey.fromBase58("B62qrgWEGhgXQ5PnpEaeJqs1MRx4Jiw2aqSTfyxAsEVDJzqNFm9PEQt")
	const signer2Public = PublicKey.fromBase58("B62qkfpRcsJjByghq8FNkzBh3wmzLYFWJP2qP9x8gJ48ekfd6MVXngy")
	const signer3Public = PublicKey.fromBase58("B62qic5sGvm6QvFzJ92588YgkKxzqi2kFeYydnkM8VDAvY9arDgY6m6")
	const externalSigner1 = PublicKey.fromBase58("B62qkjzL662Z5QD16cB9j6Q5TH74y42ALsMhAiyrwWvWwWV1ypfcV65")
	const externalSigner2 = PublicKey.fromBase58("B62qpLxXFg4rmhce762uiJjNRnp5Bzc9PnCEAcraeaMkVWkPi7kgsWV")
	const externalSigner3 = PublicKey.fromBase58("B62qipa4xp6pQKqAm5qoviGoHyKaurHvLZiWf3djDNgrzdERm6AowSQ")

	const allRightHash = Poseidon.hash(allRight.toFields())
	const deployRightHash = Poseidon.hash(deployPoolRight.toFields())

	const merkle = new MerkleMap()
	merkle.set(Poseidon.hash(ownerPublic.toFields()), allRightHash)
	merkle.set(Poseidon.hash(signer1Public.toFields()), allRightHash)
	merkle.set(Poseidon.hash(signer2Public.toFields()), allRightHash)
	merkle.set(Poseidon.hash(signer3Public.toFields()), allRightHash)
	merkle.set(Poseidon.hash(approvedSignerPublic.toFields()), deployRightHash)
	merkle.set(Poseidon.hash(externalSigner1.toFields()), allRightHash)
	merkle.set(Poseidon.hash(externalSigner2.toFields()), allRightHash)
	merkle.set(Poseidon.hash(externalSigner3.toFields()), allRightHash)

	return merkle
}

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions

export type ZkappWorkerRequest = {
	id: number
	fn: WorkerFunctions
	args: any
}

export type ZkappWorkerReponse = {
	id: number
	data: any
	error: any
}

if (typeof window !== "undefined") {
	addEventListener("message", async (event: MessageEvent<ZkappWorkerRequest>) => {
		functions[event.data.fn](event.data.args)
			.then((x) => {
				const message: ZkappWorkerReponse = {
					id: event.data.id,
					data: x,
					error: null
				}
				postMessage(message)
			})
			.catch((x) => {
				const messageError: ZkappWorkerReponse = {
					id: event.data.id,
					data: null,
					error: x
				}
				postMessage(messageError)
			})
	})
}

console.log("Web Worker Successfully Initialized.")
function fundNewAccount(feePayer: PublicKey, numberOfAccounts: number = 1) {
	try {
		const isZeko = state.isZeko
		const accountUpdate = AccountUpdate.createSigned(feePayer)
		accountUpdate.label = "AccountUpdate.fundNewAccount()"
		const fee = (isZeko ? UInt64.from(10 ** 8) : Mina.activeInstance.getNetworkConstants().accountCreationFee).mul(
			numberOfAccounts
		)
		accountUpdate.balance.subInPlace(fee)
		return accountUpdate
	} catch (error) {
		console.error("fund new account", error)
		return AccountUpdate.fundNewAccount(feePayer, numberOfAccounts)
	}
}
