import { useActor } from "@xstate/react"
import { Client, type ClientOptions, fetchExchange, Provider } from "urql"
import type {
	Actor,
	ActorOptions,
	ConditionalRequired,
	EventFromLogic,
	IsNotNever,
	RequiredActorOptionsKeys,
	SnapshotFrom
} from "xstate"
import { getRetryExchange } from "./graphql/helpers"
import { createLuminaDexMachine } from "./machines/luminadex"
import { createWalletMachine } from "./machines/wallet"

export * from "@xstate/react"

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

export { walletMachine }

export function useWallet(
	...[options]: ConditionalRequired<
		[
			options?:
				& ActorOptions<WalletMachine>
				& {
					[K in RequiredActorOptionsKeys<WalletMachine>]: unknown
				}
		],
		IsNotNever<RequiredActorOptionsKeys<WalletMachine>>
	>
): [
	SnapshotFrom<WalletMachine>,
	(event: EventFromLogic<WalletMachine>) => void,
	Actor<WalletMachine>
] {
	return useActor(walletMachine, options)
}

/**
 * Dex
 * ___________________________________________________________ */

const dexMachine = createLuminaDexMachine()
export { dexMachine }

export type DexMachine = typeof dexMachine

export function useDex(
	...[options]: ConditionalRequired<
		[
			options?:
				& ActorOptions<DexMachine>
				& {
					[K in RequiredActorOptionsKeys<DexMachine>]: unknown
				}
		],
		IsNotNever<RequiredActorOptionsKeys<DexMachine>>
	>
): [SnapshotFrom<DexMachine>, (event: EventFromLogic<DexMachine>) => void, Actor<DexMachine>] {
	return useActor(dexMachine, options)
}
