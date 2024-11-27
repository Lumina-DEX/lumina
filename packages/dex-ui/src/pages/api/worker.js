import { parentPort, workerData } from "worker_threads"
import {
	Account,
	AccountUpdate,
	Bool,
	Cache,
	Mina,
	PrivateKey,
	PublicKey,
	UInt32,
	UInt64,
	fetchAccount
} from "o1js"

console.log("Load Web Worker.")

import {
	PoolFactory,
	PoolMina,
	PoolTokenHolder,
	FungibleToken,
	FungibleTokenAdmin,
	Faucet
} from "../../../../contracts/build/src/indexmina.js"

// ---------------------------------------------------------------------------------------

const state = {
	TokenAdmin: null,
	TokenStandard: null,
	PoolMina: null,
	PoolFactory: null,
	PoolMinaHolder: null,
	Faucet: null,
	zkapp: null,
	zkFactory: null,
	zkHolder: null,
	zkToken: null,
	zkFaucet: null,
	transaction: null,
	key: null,
	isZeko: false
}

const testPrivateKey = "EKEEHJZhoyjfJEvLoLCrRZosz29hnfn8Nx6Wfx74hgQV4xbrkCTf"
const testPublicKey = "B62qrLNBqyoECio41DRkRio2DjPsVQUkcyDitM3F9t1ajK3vp2UApja"
const frontend = PublicKey.fromBase58("B62qoSZbMLJSP7dHLqe8spFPFSsUoENnMSHJN8i5bS1X4tdGpAZuwAC")
const protocol = PublicKey.fromBase58("B62qk7R5wo6WTwYSpBHPtfikGvkuasJGEv4ZsSA2sigJdqJqYsWUzA1")

// ---------------------------------------------------------------------------------------

const functions = {
	setActiveInstanceToDevnet: async (args) => {
		let currentLocation = self.location.origin
		const devnet = Mina.Network({
			networkId: "testnet",
			mina: "https://api.minascan.io/node/devnet/v1/graphql",
			archive: "https://api.minascan.io/archive/devnet/v1/graphql"
		})
		state.isZeko = false
		Mina.setActiveInstance(devnet)
	},
	setActiveInstanceToZeko: async (args) => {
		const zeko = Mina.Network({
			networkId: "testnet",
			mina: "https://devnet.zeko.io/graphql"
			//archive: 'https://api.minascan.io/archive/devnet/v1/graphql'
		})
		state.isZeko = true
		Mina.setActiveInstance(zeko)
	},

	getActiveInstance: async (args) => {
		return JSON.stringify({ isZeko: state.isZeko })
	},

	loadContract: async (args) => {
		const { PoolFactory, PoolMina, PoolTokenHolder, FungibleToken, FungibleTokenAdmin, Faucet } =
			await import("../../../../contracts/build/src/indexmina")
		// @ts-ignore
		state.PoolMina = PoolMina
		state.PoolFactory = PoolFactory
		state.PoolMinaHolder = PoolTokenHolder
		state.TokenStandard = FungibleToken
		state.TokenAdmin = FungibleTokenAdmin
		state.Faucet = Faucet
	},
	compileContract: async (args) => {
		console.time("compile")
		const cache = Cache.FileSystem("./cache")

		await state.TokenAdmin?.compile({ cache })
		await state.TokenStandard?.compile({ cache })
		await state.PoolFactory?.compile({ cache })
		await state.PoolMinaHolder?.compile({ cache })
		await state.PoolMina?.compile({ cache })
		await state.Faucet?.compile({ cache })

		console.timeEnd("compile")
	},
	fetchAccount: async (args) => {
		const publicKey = PublicKey.fromBase58(args.publicKey58)
		return await fetchAccount({ publicKey })
	},
	fetchAccountToken: async (args) => {
		const publicKey = PublicKey.fromBase58(args.publicKey58)
		return await fetchAccount({ publicKey, tokenId: state.zkToken?.deriveTokenId() })
	},
	getBalance: async (args) => {
		const publicKey = PublicKey.fromBase58(args.publicKey58)
		const balance = Mina.getBalance(publicKey)
		return JSON.stringify(balance.toJSON())
	},
	initZkappInstance: async (args) => {
		const publicKey = PublicKey.fromBase58(args.pool)
		await fetchAccount({ publicKey })
		state.zkapp = new state.PoolMina(publicKey)
		const token = await state.zkapp.token.fetch()
		await fetchAccount({ publicKey: token })
		state.zkToken = new state.TokenStandard(token)

		const factoryKey = PublicKey.fromBase58(args.factory)
		await fetchAccount({ publicKey: factoryKey })
		state.zkFactory = new state.PoolFactory(factoryKey)

		await fetchAccount({ publicKey, tokenId: state.zkToken.deriveTokenId() })
		state.zkHolder = new state.PoolMinaHolder(publicKey, state.zkToken.deriveTokenId())

		const publicKeyFaucet = PublicKey.fromBase58(args.faucet)
		await fetchAccount({ publicKey: publicKeyFaucet, tokenId: state.zkToken.deriveTokenId() })
		state.zkFaucet = new state.Faucet(publicKeyFaucet, state.zkToken.deriveTokenId())
	},
	deployPoolInstance: async (args) => {
		const poolKey = PrivateKey.random()
		console.log("appkey", poolKey.toBase58())
		console.log("pool address", poolKey.toPublicKey().toBase58())
		const tokenKey = PublicKey.fromBase58(args.tokenX)
		const userKey = PublicKey.fromBase58(args.user)

		const transaction = await Mina.transaction(userKey, async () => {
			AccountUpdate.fundNewAccount(userKey, 4)
			await state.zkFactory?.createPool(poolKey.toPublicKey(), tokenKey)
		})
		state.transaction = transaction
		await state.transaction?.prove()
		await state.transaction.sign([poolKey])

		state.key = poolKey.toBase58()
	},
	getSupply: async (args) => {
		const acc = await fetchAccount({
			publicKey: state.zkapp.address,
			tokenId: state.zkapp?.deriveTokenId()
		})
		return JSON.stringify(acc.account.balance.toJSON())
	},
	getBalances: async (args) => {
		const publicKey = PublicKey.fromBase58(args.user)
		const accMina = await fetchAccount({ publicKey })
		const acc = await fetchAccount({ publicKey, tokenId: state.zkToken?.deriveTokenId() })
		const accLiquidity = await fetchAccount({ publicKey, tokenId: state.zkapp?.deriveTokenId() })
		const bal = accMina.account ? accMina.account.balance : 0
		const balToken = acc.account ? acc.account.balance : 0
		const balLiquidity = accLiquidity.account ? accLiquidity.account.balance : 0

		return JSON.stringify({ mina: bal, token: balToken, liquidity: balLiquidity })
	},
	getReserves: async (args) => {
		const poolAddress = PublicKey.fromBase58(args.pool)
		const acc = await fetchAccount({ publicKey: poolAddress })
		const zkPool = new state.PoolMina(poolAddress)
		const token = await zkPool.token.fetch()
		const zkToken = new state.TokenStandard(token)
		const accToken = await fetchAccount({
			publicKey: poolAddress,
			tokenId: zkToken.deriveTokenId()
		})
		const accLiquidity = await fetchAccount({
			publicKey: poolAddress,
			tokenId: zkPool.deriveTokenId()
		})
		const amountToken = await accToken.account.balance
		const amountMina = await acc.account.balance
		const liquidity = await accLiquidity.account.balance
		return JSON.stringify({ amountToken, amountMina, liquidity })
	},
	swapFromMinaTransaction: async (args) => {
		const poolAddress = PublicKey.fromBase58(args.pool)
		const zkPool = new state.PoolMina(poolAddress)
		const token = await zkPool.token.fetch()
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
			AccountUpdate.fundNewAccount(publicKey, total)
			await zkPoolHolder?.swapFromMina(
				frontend,
				UInt64.from(amtIn),
				UInt64.from(amtOut),
				UInt64.from(balanceIn),
				UInt64.from(balanceOut)
			)
			await zkToken?.approveAccountUpdate(zkPoolHolder.self)
		})
		state.transaction = transaction

		await state.transaction?.prove()
	},
	swapFromTokenTransaction: async (args) => {
		const poolAddress = PublicKey.fromBase58(args.pool)
		const zkPool = new state.PoolMina(poolAddress)
		const token = await zkPool.token.fetch()
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

		console.log("token", token?.toBase58())
		const transaction = await Mina.transaction(publicKey, async () => {
			await zkPool?.swapFromToken(
				frontend,
				UInt64.from(amtIn),
				UInt64.from(amtOut),
				UInt64.from(balanceIn),
				UInt64.from(balanceOut)
			)
		})
		state.transaction = transaction

		await state.transaction?.prove()
	},
	addLiquidity: async (args) => {
		const poolAddress = PublicKey.fromBase58(args.pool)
		const zkPool = new state.PoolMina(poolAddress)
		const token = await zkPool.token.fetch()
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
			AccountUpdate.fundNewAccount(publicKey, total)
			if (supply > 0) {
				await zkPool.supplyLiquidity(
					UInt64.from(amtMinaIn),
					UInt64.from(amtTokenIn),
					UInt64.from(reserveMina),
					UInt64.from(reserveToken),
					UInt64.from(supply)
				)
			} else {
				await zkPool.supplyFirstLiquidities(UInt64.from(amtMinaIn), UInt64.from(amtTokenIn))
			}
		})
		state.transaction = transaction

		await state.transaction?.prove()
	},

	withdrawLiquidity: async (args) => {
		const poolAddress = PublicKey.fromBase58(args.pool)
		const zkPool = new state.PoolMina(poolAddress)
		const token = await zkPool.token.fetch()
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
			await zkPoolHolder?.withdrawLiquidity(
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

		await state.transaction?.prove()
	},
	claim: async (args) => {
		console.log("Network", Mina.getNetworkId())
		console.log("Graphql", Mina.activeInstance.getNetworkState)

		const publicKey = PublicKey.fromBase58(args.user)
		await fetchAccount({ publicKey: state.zkFaucet.address })
		await fetchAccount({
			publicKey: state.zkFaucet.address,
			tokenId: state.zkToken.deriveTokenId()
		})
		await fetchAccount({ publicKey })
		const acc = await fetchAccount({ publicKey, tokenId: state.zkToken?.deriveTokenId() })
		const accFau = await fetchAccount({ publicKey, tokenId: state.zkFaucet?.deriveTokenId() })

		let newAcc = acc.account?.balance ? 0 : 1
		let newFau = accFau.account?.balance ? 0 : 1
		const total = newAcc + newFau
		const token = await state.zkFaucet?.token.fetch()
		console.log("token", token?.toBase58())
		const transaction = await Mina.transaction(publicKey, async () => {
			AccountUpdate.fundNewAccount(publicKey, total)
			await state.zkFaucet?.claim()
			await state.zkToken?.approveAccountUpdate(state.zkFaucet.self)
		})
		state.transaction = transaction

		await state.transaction?.prove()
		//await state.transaction?.sign([PrivateKey.fromBase58(testPrivateKey)]).send();
	},
	getTransactionJSON: async (args) => {
		return state.transaction?.toJSON()
	},
	getKey: async (args) => {
		return state.key
	}
}

// ---------------------------------------------------------------------------------------

parentPort?.addEventListener("message", async (event) => {
	functions[event.data.fn](event.data.args)
		.then((x) => {
			const message = {
				id: event.data.id,
				data: x,
				error: null
			}
			postMessage(message)
		})
		.catch((x) => {
			const messageError = {
				id: event.data.id,
				data: null,
				error: x
			}
			postMessage(messageError)
		})
})

console.log("Web Worker Successfully Initialized.")
