import { Client, type ClientOptions, fetchExchange, Provider } from "urql"
import {
	type ActorOptions,
	type AnyStateMachine,
	type ConditionalRequired,
	createActor,
	type IsNotNever,
	type RequiredActorOptionsKeys
} from "xstate"
import { getRetryExchange } from "../graphql/helpers"
import { canDoDexAction, createLuminaDexMachine } from "./luminadex/machine"
import { createWalletMachine } from "./wallet/machine"

type MachineOptions<Machine extends AnyStateMachine> = ConditionalRequired<[
	options?:
		& ActorOptions<Machine>
		& { [K in RequiredActorOptionsKeys<Machine>]: unknown }
], IsNotNever<RequiredActorOptionsKeys<Machine>>>

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

/**
 * Create a Wallet actor and starts it.
 */
export const createWallet = (...[options]: MachineOptions<WalletMachine>): WalletActor => {
	const wallet = createActor(walletMachine, options).start()
	return wallet
}

/**
 * Dex
 * ___________________________________________________________ */

const dexMachine = createLuminaDexMachine()
export { canDoDexAction, dexMachine }

export type DexActor = ReturnType<typeof createActor<DexMachine>>
export type DexMachine = typeof dexMachine

/**
 * Create a Dex actor and starts it.
 */
export const createDex = (...[options]: MachineOptions<DexMachine>): DexActor => {
	const dex = createActor(dexMachine, options).start()
	return dex
}

export type LuminaContext = { Wallet: WalletActor; Dex: DexActor }
