/**
 * This script can be used to interact with the Add contract, after deploying it.
 *
 * We call the update() method on the contract, create a proof and send it to the chain.
 * The endpoint that we interact with is read from your config.json.
 *
 * This simulates a user interacting with the zkApp from a browser, except that here, sending the transaction happens
 * from the script and we're using your pre-funded zkApp account to pay the transaction fee. In a real web app, the user's wallet
 * would send the transaction and pay the fee.
 *
 * To run locally:
 * Build the project: `$ npm run build`
 * Run with node:     `$ node build/src/deploy.js`.
 */
import readline from "readline/promises"

import {
	AccountUpdate,
	Bool,
	Cache,
	fetchAccount,
	Field,
	MerkleMap,
	Mina,
	Poseidon,
	PrivateKey,
	Provable,
	PublicKey,
	Signature,
	SmartContract,
	UInt32,
	UInt64,
	UInt8
} from "o1js"

import {
	Faucet,
	FungibleToken,
	FungibleTokenAdmin,
	mulDiv,
	Pool,
	PoolFactory,
	PoolTokenHolder,
	SignatureRight
} from "@lumina-dex/contracts"
import { createTransactionPayloads } from "@silvana-one/mina-utils"
import { request } from "http"
import { sender } from "o1js/dist/node/lib/mina/v1/mina"
import { JobData, zkCloudWorkerClient } from "zkcloudworker"

const prompt = async (message: string) => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	})

	const answer = await rl.question(message)

	rl.close() // stop listening
	return answer
}

// check command line arg
const deployAlias = "poolmina"
if (!deployAlias) {
	throw Error(`Missing <deployAlias> argument.

Usage:
node build/src/deploy/deployAll.js
`)
}
Error.stackTraceLimit = 1000

const feepayerKey = PrivateKey.fromBase58(process.env.FEE_PAYER!)
console.log("fee payer")
// set up Mina instance and contract we interact with
const Network = Mina.Network({
	// We need to default to the testnet networkId if none is specified for this deploy alias in config.json
	// This is to ensure the backward compatibility.
	networkId: "testnet",
	mina: process.env.GRAPHQL!,
	archive: process.env.ARCHIVE!
})
console.log("network", process.env.GRAPHQL)
// const Network = Mina.Network(config.url);
const fee = Number(process.env.FEE) * 1e9 // in nanomina (1 billion = 1.0 mina)
Mina.setActiveInstance(Network)
const feepayerAddress = feepayerKey.toPublicKey()
const zkPoolTokenAMinaAddress = PublicKey.fromBase58(process.env.POOL_TOKEN_A_MINA!)
console.log("pool")
const zkPoolTokenAMina = new Pool(zkPoolTokenAMinaAddress)
const zkTokenAAddress = PublicKey.fromBase58(process.env.TOKEN_A!)
console.log("token a")
const zkTokenA = new FungibleToken(zkTokenAAddress)

const api = new zkCloudWorkerClient({
	jwt: process.env.JWT!
})

async function ask() {
	try {
		const result = await prompt(`Why do you want to do ?
            1 swap mina for token
            2 swap token for mina         
            `)
		switch (result) {
			case "1":
				await swapMina()
				break
			case "2":
				await swapToken()
				break
			default:
				await ask()
				break
		}
	} catch (error) {
		await ask()
	} finally {
		await ask()
	}
}

ask().then()

async function swapMina() {
	try {
		console.time("swap Mina")
		await fetchAccount({ publicKey: zkPoolTokenAMinaAddress })
		await fetchAccount({ publicKey: zkPoolTokenAMinaAddress, tokenId: zkTokenA.deriveTokenId() })
		await fetchAccount({ publicKey: feepayerAddress })
		const acc = await fetchAccount({
			publicKey: feepayerAddress,
			tokenId: zkTokenA.deriveTokenId()
		})

		const amountIn = UInt64.from(1.3 * 10 ** 9)
		const dexTokenHolder = new PoolTokenHolder(zkPoolTokenAMinaAddress, zkTokenA.deriveTokenId())

		const reserveIn = Mina.getBalance(zkPoolTokenAMinaAddress)
		const reserveOut = Mina.getBalance(zkPoolTokenAMinaAddress, zkTokenA.deriveTokenId())

		const balanceMin = reserveOut.sub(reserveOut.div(100))
		const balanceMax = reserveIn.add(reserveIn.div(100))

		const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn))
		const minOut = expectedOut.sub(expectedOut.div(100))

		const newAcc = acc.account ? 0 : 1

		const tx = await Mina.transaction(
			{ sender: feepayerAddress, fee, memo: "swap mina" },
			async () => {
				AccountUpdate.fundNewAccount(feepayerAddress, newAcc)
				await dexTokenHolder.swapFromMinaToToken(
					feepayerAddress,
					UInt64.from(5),
					amountIn,
					minOut,
					balanceMax,
					balanceMin
				)
				await zkTokenA.approveAccountUpdate(dexTokenHolder.self)
			}
		)

		const signTx = await tx.sign([feepayerKey])

		const payloads = createTransactionPayloads(signTx)

		const args = {
			...payloads,
			sender: feepayerAddress.toBase58(),
			request: {
				pool: zkPoolTokenAMinaAddress.toBase58(),
				from: "MINA",
				to: zkTokenAAddress.toBase58(),
				user: feepayerAddress.toBase58(),
				frontendFee: 5,
				frontendFeeDestination: feepayerAddress.toBase58(),
				amount: Number(amountIn.toBigInt()),
				minOut: Number(minOut.toBigInt()),
				balanceOutMin: Number(balanceMin.toBigInt()),
				balanceInMax: Number(balanceMax.toBigInt()),
				factory: "B62qrfxeWqZF16Bm87xyb9fyXDs5APqqKuPmbMqaEsNUWj8Ju8GSRxM"
			}
		}

		const response = await api.execute({
			developer: "youtpout",
			repo: "lumina-cloudworker",
			transactions: [],
			task: "swap",
			args: JSON.stringify(args),
			metadata: `proof generation`,
			mode: "async"
		})
		console.log("response", response)
		await api.waitForJobResult({ jobId: response.jobId!, printLogs: true })

		const proofs = await api.jobResult({ jobId: response.jobId! })
		console.log("proofs", proofs)
	} catch (err) {
		console.log(err)
	}
}

async function swapToken() {
	try {
		console.time("swap Token")
		const amountIn = UInt64.from(20 * 10 ** 9)

		await fetchAccount({ publicKey: zkPoolTokenAMinaAddress })
		await fetchAccount({ publicKey: zkPoolTokenAMinaAddress, tokenId: zkTokenA.deriveTokenId() })
		await fetchAccount({ publicKey: feepayerAddress })
		await fetchAccount({ publicKey: feepayerAddress, tokenId: zkTokenA.deriveTokenId() })

		const reserveOut = Mina.getBalance(zkPoolTokenAMinaAddress)
		const reserveIn = Mina.getBalance(zkPoolTokenAMinaAddress, zkTokenA.deriveTokenId())

		const balanceMin = reserveOut.sub(reserveOut.div(100))
		const balanceMax = reserveIn.add(reserveIn.div(100))

		const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn))
		const minOut = expectedOut.sub(expectedOut.div(100))

		const tx = await Mina.transaction(
			{ sender: feepayerAddress, fee, memo: "swap token" },
			async () => {
				await zkPoolTokenAMina.swapFromTokenToMina(
					feepayerAddress,
					UInt64.from(5),
					amountIn,
					minOut,
					balanceMax,
					balanceMin
				)
			}
		)
		const signTx = await tx.sign([feepayerKey])

		const payloads = createTransactionPayloads(signTx)

		const args = {
			...payloads,
			sender: feepayerAddress.toBase58(),
			request: {
				pool: zkPoolTokenAMinaAddress.toBase58(),
				from: zkTokenAAddress.toBase58(),
				to: "MINA",
				user: feepayerAddress.toBase58(),
				frontendFee: 5,
				frontendFeeDestination: feepayerAddress.toBase58(),
				amount: Number(amountIn.toBigInt()),
				minOut: Number(minOut.toBigInt()),
				balanceOutMin: Number(balanceMin.toBigInt()),
				balanceInMax: Number(balanceMax.toBigInt()),
				factory: "B62qrfxeWqZF16Bm87xyb9fyXDs5APqqKuPmbMqaEsNUWj8Ju8GSRxM"
			}
		}

		const response = await api.execute({
			developer: "youtpout",
			repo: "lumina-cloudworker",
			transactions: [],
			task: "swap",
			args: JSON.stringify(args),
			metadata: `proof generation`,
			mode: "async"
		})
		console.log("response", response)
		await api.waitForJobResult({ jobId: response.jobId!, printLogs: true })

		const proofs = await api.jobResult({ jobId: response.jobId! })
		console.log("proofs", proofs)
	} catch (err) {
		console.log(err)
	}
}
