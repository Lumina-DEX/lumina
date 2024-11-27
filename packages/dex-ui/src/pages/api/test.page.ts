// import rom 'fs'
import type { NextApiRequest, NextApiResponse } from "next"
import {} from "o1js"
import {} from "../../../../contracts/build/src/indexmina"
import ZkappWorkerClient from "./workerClient"

export const maxDuration = 300 // This function can run for a maximum of 300 seconds

type ResponseData = {
	message: string
}

type SwapData = {
	user: string
	amountIn: number
	amountOut: number
	balanceOutMin: number
	balanceInMax: number
}

const ZKAPP_ADDRESS = "B62qrn4bTWsKGddKeLGzriYVQF23fNF4tCnACKawP7ySJfH7zFmd2u6"
const ZKTOKEN_ADDRESS = "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w"

let inited = false
let client

async function init() {
	if (!inited) {
		console.log("Loading web worker...")
		client = new ZkappWorkerClient()
		await timeout(1)
		console.log("Done loading web worker")
		await client.setActiveInstanceToDevnet()
		await client.loadContract()
		console.log("Compiling zkApp...")
		await client.compileContract()
		console.log("zkApp compiled")
		inited = true
	}
}

async function timeout(seconds: number): Promise<void> {
	return new Promise<void>((resolve) => {
		setTimeout(() => {
			resolve()
		}, seconds * 1000)
	})
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
	await init()

	const fib = await client.getReserves("B62qisgt5S7LwrBKEc8wvWNjW7SGTQjMZJTDL2N6FmZSVGrWiNkV21H")
	return res.status(200).json({ msg: "hello swap", fib: fib })
}
