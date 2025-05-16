import {
	zkCloudWorker,
	Cloud,
	fee,
	sleep,
	deserializeFields,
	fetchMinaAccount,
	accountBalanceMina,
	FungibleToken,
	FungibleTokenAdmin
} from "zkcloudworker"
import {
	verify,
	JsonProof,
	VerificationKey,
	PublicKey,
	Mina,
	PrivateKey,
	AccountUpdate,
	Cache,
	UInt64,
	fetchAccount
} from "o1js"
import { Pool } from "./pool/Pool"
import { PoolFactory } from "./pool/PoolFactory"
import { PoolTokenHolder } from "./pool/PoolTokenHolder"

export class PoolWorker extends zkCloudWorker {
	static fungibleTokenAdminVerificationKey: VerificationKey | undefined = undefined
	static fungibleTokenVerificationKey: VerificationKey | undefined = undefined
	static poolFactoryVerificationKey: VerificationKey | undefined = undefined
	static poolVerificationKey: VerificationKey | undefined = undefined
	static poolTokenVerificationKey: VerificationKey | undefined = undefined
	readonly cache: Cache

	constructor(cloud: Cloud) {
		super(cloud)
		this.cache = Cache.FileSystem(this.cloud.cache)
	}

	private async compile(compileSmartContracts: boolean = true): Promise<void> {
		try {
			console.time("compiled")

			if (compileSmartContracts === false) {
				console.timeEnd("compiled")
				return
			}

			if (PoolWorker.fungibleTokenAdminVerificationKey === undefined) {
				console.time("compiled fungibleTokenAdmin")
				PoolWorker.fungibleTokenAdminVerificationKey = (
					await FungibleTokenAdmin.compile({
						cache: this.cache
					})
				).verificationKey
				console.timeEnd("compiled fungibleTokenAdmin")
			}

			if (PoolWorker.fungibleTokenVerificationKey === undefined) {
				console.time("compiled fungibleToken")
				PoolWorker.fungibleTokenVerificationKey = (
					await FungibleToken.compile({
						cache: this.cache
					})
				).verificationKey
				console.timeEnd("compiled fungibleToken")
			}

			if (PoolWorker.poolFactoryVerificationKey === undefined) {
				console.time("compiled poolFactory")
				PoolWorker.poolFactoryVerificationKey = (
					await PoolFactory.compile({
						cache: this.cache
					})
				).verificationKey
				console.timeEnd("compiled poolFactory")
			}

			if (PoolWorker.poolVerificationKey === undefined) {
				console.time("compiled pool")
				PoolWorker.poolVerificationKey = (
					await Pool.compile({
						cache: this.cache
					})
				).verificationKey
				console.timeEnd("compiled pool")
			}

			if (PoolWorker.poolTokenVerificationKey === undefined) {
				console.time("compiled poolToken")
				PoolWorker.poolTokenVerificationKey = (
					await PoolTokenHolder.compile({
						cache: this.cache
					})
				).verificationKey
				console.timeEnd("compiled poolToken")
			}
			console.timeEnd("compiled")
		} catch (error) {
			console.error("Error in compile, restarting container", error)
			// Restarting the container, see https://github.com/o1-labs/o1js/issues/1651
			await this.cloud.forceWorkerRestart()
			throw error
		}
	}

	public async execute(transactions: string[]): Promise<string | undefined> {
		if (this.cloud.args === undefined) throw new Error("this.cloud.args is undefined")
		const args = JSON.parse(this.cloud.args)
		//console.log("args", args);
		if (args.contractAddress === undefined) throw new Error("args.contractAddress is undefined")

		switch (this.cloud.task) {
			case "swap":
				return await this.swap({ ...args, isMany: false })

			default:
				throw new Error(`Unknown task: ${this.cloud.task}`)
		}
	}

	private async getZkTokenFromPool(pool: string) {
		const poolKey = PublicKey.fromBase58(pool)

		const zkPool = new Pool(poolKey)
		const zkPoolTokenKey = await zkPool.token1.fetch()
		if (!zkPoolTokenKey) throw new Error("ZKPool Token Key not found")

		const zkToken = new FungibleToken(zkPoolTokenKey)

		const zkPoolTokenId = zkPool.deriveTokenId()
		const zkTokenId = zkToken.deriveTokenId()

		return { zkTokenId, zkToken, poolKey, zkPool, zkPoolTokenKey, zkPoolTokenId }
	}

	private async swap(args: {
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
	}): Promise<string> {
		const privateKey = PrivateKey.random()
		const address = privateKey.toPublicKey()
		console.log("Address", address.toBase58())

		await this.compile()

		console.log(`Sending tx...`)
		console.time("prepared tx")

		const { poolKey, zkTokenId, zkToken } = await this.getZkTokenFromPool(args.pool)
		const userKey = PublicKey.fromBase58(args.user)
		const TAX_RECEIVER = PublicKey.fromBase58(args.frontendFeeDestination)

		await Promise.all([
			fetchAccount({ publicKey: poolKey }),
			fetchAccount({ publicKey: poolKey, tokenId: zkTokenId }),
			fetchAccount({ publicKey: userKey }),
			fetchAccount({ publicKey: userKey, tokenId: zkTokenId })
		])

		const zkPool = new Pool(poolKey)
		const luminaAddress = await zkPool.protocol.fetch()
		if (!luminaAddress) throw new Error("Lumina Address not found")

		const [acc, accFront, accProtocol] = await Promise.all([
			fetchAccount({ publicKey: userKey, tokenId: zkTokenId }),
			fetchAccount({ publicKey: TAX_RECEIVER, tokenId: zkTokenId }),
			fetchAccount({
				publicKey: luminaAddress,
				tokenId: zkTokenId
			})
		])

		const newAcc = acc.account ? 0 : 1
		const newFront = accFront.account ? 0 : 1
		const newAccProtocol = accProtocol.account ? 0 : 1

		const total = newAcc + newFront + newAccProtocol
		const swapArgList = [
			TAX_RECEIVER,
			UInt64.from(Math.trunc(args.frontendFee)),
			UInt64.from(Math.trunc(args.amount)),
			UInt64.from(Math.trunc(args.minOut)),
			UInt64.from(Math.trunc(args.balanceInMax)),
			UInt64.from(Math.trunc(args.balanceOutMin))
		] as const

		const MINA_ADDRESS = "MINA"

		let tx = await Mina.transaction(userKey, async () => {
			if (args.to === MINA_ADDRESS) {
				const zkPool = new Pool(poolKey)
				await zkPool.swapFromTokenToMina(...swapArgList)
			} else {
				AccountUpdate.fundNewAccount(userKey, total)
				const zkPoolHolder = new PoolTokenHolder(poolKey, zkTokenId)
				await zkPoolHolder[
					args.from === MINA_ADDRESS ? "swapFromMinaToToken" : "swapFromTokenToToken"
				](...swapArgList)
				await zkToken.approveAccountUpdate(zkPoolHolder.self)
			}
		})

		if (tx === undefined) throw new Error("tx is undefined")
		await tx.prove()

		console.timeEnd("prepared tx")

		return tx.toJSON()
	}
}
