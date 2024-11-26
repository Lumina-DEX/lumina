import { UInt64, type fetchAccount } from "o1js"
import { Worker } from "worker_threads"

export default class ZkappWorkerClient {
	// ---------------------------------------------------------------------------------------

	setActiveInstanceToDevnet() {
		return this._call("setActiveInstanceToDevnet", {})
	}

	setActiveInstanceToZeko() {
		return this._call("setActiveInstanceToZeko", {})
	}

	async getActiveInstance(): Promise<any> {
		const result = (await this._call("getActiveInstance", {})) as unknown as string
		return JSON.parse(result)
	}

	loadContract() {
		return this._call("loadContract", {})
	}

	compileContract() {
		return this._call("compileContract", {})
	}

	fetchAccount({
		publicKeyBase58
	}: {
		publicKeyBase58: string
	}): ReturnType<typeof fetchAccount> {
		const result = this._call("fetchAccount", {
			publicKey58: publicKeyBase58
		})
		return result as ReturnType<typeof fetchAccount>
	}

	fetchAccountToken({
		publicKeyBase58
	}: {
		publicKeyBase58: string
	}): ReturnType<typeof fetchAccount> {
		const result = this._call("fetchAccountToken", {
			publicKey58: publicKeyBase58
		})
		return result as ReturnType<typeof fetchAccount>
	}

	async getBalance(publicKey58: string): Promise<UInt64> {
		const result = await this._call("getBalance", { publicKey58 })
		return UInt64.fromJSON(JSON.parse(result as string))
	}

	initZkappInstance(poolAddress: string, faucetAddress: string, factoryAddress: string) {
		return this._call("initZkappInstance", {
			pool: poolAddress,
			faucet: faucetAddress,
			factory: factoryAddress
		})
	}

	async getReserves(pool: string): Promise<any> {
		const result = (await this._call("getReserves", { pool })) as string
		return JSON.parse(result)
	}

	async getBalances(user: string): Promise<any> {
		const result = (await this._call("getBalances", { user })) as string
		return JSON.parse(result)
	}

	async swapFromMina(
		pool: string,
		user: string,
		amt: number,
		minOut: number,
		balanceOutMin: number,
		balanceInMax: number
	) {
		return await this._call("swapFromMinaTransaction", {
			pool,
			user,
			amt,
			minOut,
			balanceOutMin,
			balanceInMax
		})
	}

	async claim(user: string) {
		return await this._call("claim", { user })
	}

	async swapFromToken(
		pool: string,
		user: string,
		amt: number,
		minOut: number,
		balanceOutMin: number,
		balanceInMax: number
	) {
		return await this._call("swapFromTokenTransaction", {
			pool,
			user,
			amt,
			minOut,
			balanceOutMin,
			balanceInMax
		})
	}

	async addLiquidity(
		pool: string,
		user: string,
		amtMina: number,
		amtToken: number,
		reserveMinaMax: number,
		reserveTokenMax: number,
		supplyMin: number
	) {
		return await this._call("addLiquidity", {
			pool,
			user,
			amtMina,
			amtToken,
			reserveMinaMax,
			reserveTokenMax,
			supplyMin
		})
	}

	async withdrawLiquidity(
		pool: string,
		user: string,
		liquidityAmount: number,
		amountMinaMin: number,
		amountTokenMin: number,
		reserveMinaMin: number,
		reserveTokenMin: number,
		supplyMax: number
	) {
		return await this._call("withdrawLiquidity", {
			pool,
			user,
			liquidityAmount,
			amountMinaMin,
			amountTokenMin,
			reserveMinaMin,
			reserveTokenMin,
			supplyMax
		})
	}

	async deployPoolInstance(tokenX: string, user: string) {
		return await this._call("deployPoolInstance", {
			tokenX,
			user
		})
	}

	async getTransactionJSON(): Promise<string> {
		const result = (await this._call("getTransactionJSON", {})) as string
		return result
	}

	async getKey() {
		const result = await this._call("getKey", {})
		return result
	}

	// ---------------------------------------------------------------------------------------

	worker: Worker

	promises: {
		[id: number]: { resolve: (res: any) => void; reject: (err: any) => void }
	}

	nextId: number

	constructor() {
		console.time("worker load")
		this.worker = new Worker("./src/pages/api/worker")
		this.promises = {}
		this.nextId = 0

		this.worker.on("message", (event: any) => {
			if (event.data.error) {
				console.log("error", event.data.error)
				this.promises[event.data.id].reject(event.data.error)
			} else {
				this.promises[event.data.id].resolve(event.data.data)
			}
			delete this.promises[event.data.id]
		})

		this.worker.on("error", (event: ErrorEvent) => {
			console.error("worker error", event)
		})
		console.timeEnd("worker load")
	}

	_call(fn: any, args: any) {
		return new Promise((resolve, reject) => {
			this.promises[this.nextId] = { resolve, reject }

			const message: any = {
				id: this.nextId,
				fn,
				args
			}

			this.worker.postMessage(message)

			this.nextId++
		})
	}
}
