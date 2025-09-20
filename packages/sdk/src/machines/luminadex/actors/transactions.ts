import { PrivateKey } from "o1js"
import { fromPromise } from "xstate"
import type {
	AddLiquidity,
	DeployPoolArgs,
	FaucetSettings,
	MintToken,
	SwapArgs,
	WithdrawLiquidity
} from "../../../dex/luminadex-worker"

import { act } from "../helpers"
import type { InputDexWorker, User } from "../types"

export const claim = fromPromise(
	async ({ input }: { input: InputDexWorker & User & { faucet: FaucetSettings } }) =>
		act("claim", async () => {
			const { worker, user, faucet } = input
			const tx = await worker.claim({ user, faucet })
			return tx
		})
)

export const swap = fromPromise(async ({ input }: { input: InputDexWorker & SwapArgs }) => {
	return act("swap", async () => {
		const { worker, ...swapSettings } = input
		const tx = await worker.swap(swapSettings)
		return tx
	})
})

export const addLiquidity = fromPromise(async (
	{ input }: { input: AddLiquidity & InputDexWorker }
) =>
	act("addLiquidity", async () => {
		const { worker, ...config } = input
		const tx = await worker.addLiquidity(config)
		return tx
	})
)

export const removeLiquidity = fromPromise(
	async ({ input }: { input: WithdrawLiquidity & InputDexWorker }) => {
		return act("removeLiquidity", async () => {
			const { worker, ...config } = input
			const tx = await worker.withdrawLiquidity(config)
			return tx
		})
	}
)

export const mintToken = fromPromise(async ({ input }: { input: InputDexWorker & MintToken }) =>
	act("mintToken", async () => {
		const { worker, ...config } = input
		const tx = await worker.mintToken(config)
		return tx
	})
)

export const deployPool = fromPromise(async (
	{ input }: { input: InputDexWorker & DeployPoolArgs }
) =>
	act("deployPool", async () => {
		const { worker, ...config } = input
		const tx = await worker.deployPoolInstance(config)
		return tx
	})
)

export const deployToken = fromPromise(
	async ({ input }: { input: InputDexWorker & { symbol: string } & User }) =>
		act("deployToken", async () => {
			const { worker, symbol, user } = input
			// TokenKey
			const tk = PrivateKey.random()
			const tokenKey = tk.toBase58()
			const tokenKeyPublic = tk.toPublicKey().toBase58()
			// TokenAdminKey
			const tak = PrivateKey.random()
			const tokenAdminKey = tak.toBase58()
			const tokenAdminKeyPublic = tak.toPublicKey().toBase58()

			const tx = await worker.deployToken({ user, tokenKey, tokenAdminKey, symbol })

			return {
				transactionOutput: tx,
				token: { symbol, tokenKey, tokenAdminKey, tokenKeyPublic, tokenAdminKeyPublic }
			}
		})
)
