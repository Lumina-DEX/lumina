
import { Client, type ClientOptions, Provider, fetchExchange } from "urql"
import {
	createActor
} from "xstate"
import { getRetryExchange } from "./graphql/helpers"
import { createLuminaDexMachine } from "./machines/luminadex"
import type { LuminaDexMachineInput } from "./machines/luminadex/types"
import { createWalletMachine } from "./machines/wallet"


/**
 * GraphQL client
 * ___________________________________________________________ */

const clientCache = new Map<string, Client>()

export const createClientOptions = (url: string) =>
	({
		url,
		requestPolicy: "network-only",
		exchanges: [getRetryExchange(), fetchExchange]
	}) as ClientOptions

export const createMinaClient = (url: string) => {
	const cached = clientCache.get(url)
	if (cached) return cached
	const client = new Client(createClientOptions(url))
	clientCache.set(url, client)
	return client
}

export { Provider }

/**
 * Wallet
 * ___________________________________________________________ */

const walletMachine = createWalletMachine({ createMinaClient })
export type WalletMachine = typeof walletMachine
export type WalletActor = ReturnType<typeof createActor<WalletMachine>>

export { walletMachine }

export const createWallet = () => {
	const wallet = createActor(walletMachine)
	wallet.start()
	return wallet
}

/**
 * Dex
 * ___________________________________________________________ */

const dexMachine = createLuminaDexMachine()
export { dexMachine }

export type DexActor = ReturnType<typeof createActor<DexMachine>>
export type DexMachine = typeof dexMachine

export const createDex = (input: LuminaDexMachineInput) => {
	const dex = createActor(dexMachine, { input })
	dex.start()
	return dex
}


export type LuminaContext = { Wallet: WalletActor; Dex: DexActor }