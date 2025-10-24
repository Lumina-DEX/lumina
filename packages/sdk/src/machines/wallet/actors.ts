import { PublicKey, TokenId } from "o1js"
import pLimit from "p-limit"
import type { Client } from "urql"
import type { ActorRefFromLogic, EventObject } from "xstate"
import { type ChainNetwork, type NetworkLayer, urls } from "../../constants"
import { createMinaClient } from "../../graphql/clients"
import { FetchAccountBalanceQuery } from "../../graphql/mina"
import { logger } from "../../helpers/debug"
import { fromCallback } from "../../helpers/xstate"
import type { createWalletMachine } from "./machine"
import type { AllTokenBalances, FetchBalanceInput, Networks, WalletEmit, WalletEvent } from "./types"

export type WalletActorRef = ActorRefFromLogic<ReturnType<typeof createWalletMachine>>

/**
 * This Actor listens to the Wallet machine and forward emitted events.
 * This allows a non wallet machine to use this actor and react to the emitted events.
 * The other machine should implement events compatible with the WalletEmit interface.
 */
export const detectWalletChange = fromCallback<EventObject, WalletEmit, { wallet: WalletActorRef }, WalletEmit>(
	({ sendBack, input: { wallet } }) => {
		logger.info("Setting up wallet change listener actor")
		// We do not use wallet.on, because the wallet machine must be initialized first.
		// Therefore, if there is no wallet detected, it will be in the UNSUPPORTED state.
		if (wallet.getSnapshot().matches("UNSUPPORTED")) {
			sendBack({ type: "NoMinaWalletDetected" })
		}

		const nc = wallet.on("NetworkChanged", (emitted) => {
			logger.info("NetworkChanged received by actor", emitted)
			sendBack({ type: "NetworkChanged", network: emitted.network })
		})

		const ac = wallet.on("AccountChanged", (emitted) => {
			logger.info("AccountChanged received by actor", emitted)
			sendBack({ type: "AccountChanged", account: emitted.account })
		})

		return () => {
			nc.unsubscribe()
			ac.unsubscribe()
		}
	}
)

/**
 * Fetches the balance of the Mina wallet on given networks.
 */
export const fetchBalance = fromCallback<
	WalletEvent,
	WalletEvent,
	FetchBalanceInput & { id: string; createMinaClient: (url: string) => Client },
	WalletEmit
>(({ sendBack, input }) => {
	const { id, ...params } = input
	const fetching = async () => {
		try {
			const balances = await fetchBalanceLogic(params, createMinaClient)
			sendBack({ type: "FetchBalanceSuccess", id, balances })
		} catch (error) {
			logger.error("fetchBalanceLogic error:", error)
			sendBack({ type: "FetchBalanceFailure", id })
		}
	}
	fetching()
	return () => {}
})

const fetchBalanceLogic = async (
	input: FetchBalanceInput,
	createMinaClient: (url: string) => Client
): Promise<AllTokenBalances> => {
	const limit = pLimit(10)
	const publicKey = input.address
	const mina = { symbol: "MINA", decimal: 1e9, tokenId: null, publicKey }
	const tokens = input.tokens
		.filter((token) => token.symbol !== "MINA")
		.map((token) => ({
			symbol: token.symbol,
			decimal: token.decimal,
			tokenId:
				"poolAddress" in token
					? TokenId.toBase58(TokenId.derive(PublicKey.fromBase58(token.poolAddress)))
					: token.tokenId,
			publicKey
		}))
	const allTokens = [mina, ...tokens]

	const queries = Object.fromEntries(
		allTokens.map((token) => [
			token.tokenId ?? "MINA",
			limit(() =>
				createMinaClient(urls[input.network])
					.query(FetchAccountBalanceQuery, {
						tokenId: token.tokenId,
						publicKey
					})
					.toPromise()
			)
		])
	)

	const results = await Promise.all(Object.values(queries))

	return Object.keys(queries).reduce(
		(acc, tokenId, index) => {
			const result = results[index]
			const token = allTokens[index]
			const balance = toNumber(result.data?.account?.balance?.total) / token.decimal
			const [layer, netType] = (input.network as Networks).split(":") as [NetworkLayer, ChainNetwork]
			acc[layer][netType][tokenId] = { balance, symbol: token.symbol }
			return acc
		},
		{
			mina: { mainnet: {}, devnet: {} },
			zeko: { mainnet: {}, testnet: {} }
		} as AllTokenBalances
	)
}

const toNumber = (n: unknown) => {
	if (typeof n === "string") {
		const t = Number.parseFloat(n)
		return Number.isNaN(t) ? 0 : t
	}
	if (typeof n === "number") return n
	return 0
}
