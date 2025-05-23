import {
	zkCloudWorker,
	Cloud,
	fee,
	sleep,
	deserializeFields,
	fetchMinaAccount,
	accountBalanceMina,
	FungibleToken,
	FungibleTokenAdmin,
	TransactionMetadata
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
	fetchAccount,
	Poseidon,
	Signature,
	Bool,
	MerkleMap,
	Transaction
} from "o1js"
import { Pool } from "./pool/Pool"
import { PoolFactory } from "./pool/PoolFactory"
import { PoolTokenHolder } from "./pool/PoolTokenHolder"
import { SignatureRight } from "./pool/Multisig"
import { parseTransactionPayloads, transactionParams } from "@silvana-one/mina-utils"

export class PoolWorker extends zkCloudWorker {
	static fungibleTokenVerificationKey: VerificationKey | undefined = undefined
	static poolVerificationKey: VerificationKey | undefined = undefined
	static poolTokenVerificationKey: VerificationKey | undefined = undefined
	static poolFactoryVerificationKey: VerificationKey | undefined = undefined
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

			if (PoolWorker.fungibleTokenVerificationKey === undefined) {
				console.time("compiled fungibleToken")
				PoolWorker.fungibleTokenVerificationKey = (
					await FungibleToken.compile({
						cache: this.cache
					})
				).verificationKey
				console.log(
					"vk hash fungibleToken",
					PoolWorker.fungibleTokenVerificationKey.hash.toBigInt()
				)
				console.timeEnd("compiled fungibleToken")
			}

			if (PoolWorker.poolVerificationKey === undefined) {
				console.time("compiled pool")
				PoolWorker.poolVerificationKey = (
					await Pool.compile({
						cache: this.cache
					})
				).verificationKey
				console.log("vk hash pool", PoolWorker.poolVerificationKey.hash.toBigInt())
				console.timeEnd("compiled pool")
			}

			if (PoolWorker.poolTokenVerificationKey === undefined) {
				console.time("compiled poolToken")
				PoolWorker.poolTokenVerificationKey = (
					await PoolTokenHolder.compile({
						cache: this.cache
					})
				).verificationKey
				console.log("vk hash poolToken", PoolWorker.poolTokenVerificationKey.hash.toBigInt())
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

	private async compileFactory(compileSmartContracts: boolean = true): Promise<void> {
		try {
			console.time("compiled factory")

			if (compileSmartContracts === false) {
				console.timeEnd("compiled factory")
				return
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
				console.time("compiled pool factory")
				PoolWorker.poolFactoryVerificationKey = (
					await PoolFactory.compile({
						cache: this.cache
					})
				).verificationKey
				console.log("vk hash pool", PoolWorker.poolFactoryVerificationKey.hash.toBigInt())
				console.timeEnd("compiled pool factory")
			}

			console.timeEnd("compiled factory")
		} catch (error) {
			console.error("Error in compile factory, restarting container", error)
			// Restarting the container, see https://github.com/o1-labs/o1js/issues/1651
			await this.cloud.forceWorkerRestart()
			throw error
		}
	}

	public async execute(transactions: string[]): Promise<string | undefined> {
		if (this.cloud.args === undefined) throw new Error("this.cloud.args is undefined")
		const args = JSON.parse(this.cloud.args)

		switch (this.cloud.task) {
			case "swap":
				return await this.swap({ ...args })
			case "createPool":
				return await this.createPool({ ...args })

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

	private async swap(parameters: any): Promise<string> {
		try {
			const args: {
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
				tx: string
			} = parameters.request

			const { fee, sender, nonce, memo } = transactionParams(parameters)

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

			const txNew = await Mina.transaction(
				{ sender, fee, memo: memo ?? `swap ${Date.now()}`, nonce },
				async () => {
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
				}
			)

			const tx = parseTransactionPayloads({ payloads: parameters, txNew })

			if (tx === undefined) throw new Error("tx is undefined")

			console.time("proved tx")
			const txProved = await tx.prove()
			const txJSON = txProved.toJSON()
			console.timeEnd("proved tx")
			console.timeEnd("prepared tx")

			return await this.sendTokenTransaction({
				tx: txProved,
				txJSON,
				memo,
				metadata: {
					sender: sender.toBase58(),
					...args,
					txType: "swap"
				} as any
			})
		} catch (error) {
			return this.stringifyJobResult({
				success: false,
				tx: "",
				error: String(error)
			})
		}
	}

	private async createPool(parameters: any): Promise<string> {
		try {
			const args: {
				tokenA: string
				tokenB: string
				user: string
				factory: string
				user0: string
				signer: string
				tx: string
			} = parameters.request

			const poolKey = PrivateKey.random()
			const MINA_ADDRESS = "MINA"

			console.log("Pool Key", poolKey.toBase58())

			await this.compileFactory()

			console.log(`Sending tx...`)
			console.time("prepared tx")

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
			// TODO: temporary solution for testnet
			const signerPk = PrivateKey.fromBase58(args.signer)
			const user0Pk = PublicKey.fromBase58(args.user0)
			const user1 = signerPk.toPublicKey()

			const ownerPublic = PublicKey.fromBase58(
				"B62qjabhmpW9yfLbvUz87BR1u462RRqFfXgoapz8X3Fw8uaXJqGG8WH"
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
			const approvedSignerPublic = PublicKey.fromBase58(
				"B62qpko6oWqKU4LwAaT7PSX3b6TYvroj6umbpyEXL5EEeBbiJTUMU5Z"
			)

			merkle.set(Poseidon.hash(ownerPublic.toFields()), allRight.hash())
			merkle.set(Poseidon.hash(signer1Public.toFields()), allRight.hash())
			merkle.set(Poseidon.hash(signer2Public.toFields()), allRight.hash())
			merkle.set(Poseidon.hash(signer3Public.toFields()), allRight.hash())
			merkle.set(Poseidon.hash(approvedSignerPublic.toFields()), deployRight.hash())
			const signature = Signature.create(signerPk, poolKey.toPublicKey().toFields())

			const witness = merkle.getWitness(Poseidon.hash(approvedSignerPublic.toFields()))

			const factoryKey = PublicKey.fromBase58(args.factory)

			const zkFactory = new PoolFactory(factoryKey)

			await fetchAccount({ publicKey: factoryKey })

			const isMinaTokenPool = args.tokenA === MINA_ADDRESS || args.tokenB === MINA_ADDRESS

			const { fee, sender, nonce, memo } = transactionParams(parameters)

			const txNew = await Mina.transaction(
				{ sender, fee, memo: memo ?? `create pool ${Date.now()}`, nonce },
				async () => {
					AccountUpdate.fundNewAccount(PublicKey.fromBase58(args.user), 4)
					if (isMinaTokenPool) {
						const token = args.tokenA === MINA_ADDRESS ? args.tokenB : args.tokenA
						await zkFactory.createPool(
							poolKey.toPublicKey(),
							PublicKey.fromBase58(token),
							user1,
							signature,
							witness,
							deployRight
						)
					}
					if (!isMinaTokenPool) {
						await zkFactory.createPoolToken(
							poolKey.toPublicKey(),
							PublicKey.fromBase58(args.tokenA),
							PublicKey.fromBase58(args.tokenB),
							user1,
							signature,
							witness,
							deployRight
						)
					}
				}
			)

			const tx = parseTransactionPayloads({ payloads: parameters, txNew })

			if (tx === undefined) throw new Error("tx is undefined")
			const txProved = await tx.prove()
			const txJSON = txProved.toJSON()

			console.timeEnd("prepared tx")

			return await this.sendTokenTransaction({
				tx: txProved,
				txJSON,
				memo,
				metadata: {
					admin: sender.toBase58(),
					poolAddress: poolKey.toPublicKey().toBase58(),
					poolKey: poolKey.toBase58(),
					tokenA: args.tokenA,
					tokenB: args.tokenA,
					txType: "create pool"
				} as any
			})
		} catch (error) {
			return this.stringifyJobResult({
				success: false,
				tx: "",
				error: String(error)
			})
		}
	}

	private async sendTokenTransaction(params: {
		tx: Transaction<true, true>
		txJSON: string
		memo: string
		metadata: TransactionMetadata
	}): Promise<string> {
		const { tx, txJSON, memo, metadata } = params
		let txSent
		let sent = false
		const start = Date.now()
		const timeout = 60 * 1000
		while (!sent) {
			txSent = await tx.safeSend()
			if (txSent.status == "pending") {
				sent = true
				console.log(`${memo} tx sent: hash: ${txSent.hash} status: ${txSent.status}`)
			} else if (this.cloud.chain === "zeko" && Date.now() - start < timeout) {
				console.log("Retrying Zeko tx", txSent.status, txSent.errors)
				await sleep(10000)
			} else {
				console.log(
					`${memo} tx NOT sent: hash: ${txSent?.hash} status: ${txSent?.status}`,
					txSent.errors
				)
				// TODO: handle right API handling on tx-result
				this.cloud.publishTransactionMetadata({
					txId: txSent?.hash,
					metadata: {
						...metadata,
						txStatus: txSent?.status,
						txErrors: txSent?.errors,
						txHash: txSent?.hash
					} as any
				})
				return this.stringifyJobResult({
					success: false,
					tx: txJSON,
					hash: txSent.hash,
					status: txSent.status,
					error: String(txSent.errors)
				})
			}
		}
		if (this.cloud.isLocalCloud && txSent?.status === "pending") {
			const txIncluded = await txSent.safeWait()
			console.log(
				`${memo} tx included into block: hash: ${txIncluded.hash} status: ${txIncluded.status}`
			)
			return this.stringifyJobResult({
				success: true,
				tx: txJSON,
				hash: txIncluded.hash
			})
		}
		if (txSent?.hash)
			this.cloud.publishTransactionMetadata({
				txId: txSent?.hash,
				metadata: {
					...metadata,
					txStatus: txSent?.status,
					txErrors: txSent?.errors,
					txHash: txSent?.hash
				} as any
			})
		return this.stringifyJobResult({
			success: txSent?.hash !== undefined && txSent?.status == "pending" ? true : false,
			tx: txJSON,
			hash: txSent?.hash,
			status: txSent?.status,
			error: String(txSent?.errors ?? "")
		})
	}

	private stringifyJobResult(result: {
		success: boolean
		error?: string
		tx?: string
		hash?: string
		status?: string
	}): string {
		const strippedResult = {
			...result,
			tx: result.hash ? undefined : result.tx
		}
		return JSON.stringify(strippedResult, null, 2)
	}
}
