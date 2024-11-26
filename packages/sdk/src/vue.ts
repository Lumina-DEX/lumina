import { Client, type ClientOptions, fetchExchange } from "@urql/vue"
import type { Ref } from "vue"
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
import { useActor } from "./machines/vue/useXstate"
import { createWalletMachine } from "./machines/wallet"

//xstate bindings
export * from "./machines/vue/useXstate"

/**
 * GraphQL client
 *___________________________________________________________*/

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

/**
 * Wallet
 *___________________________________________________________*/

const walletMachine = createWalletMachine({ createMinaClient })
export { walletMachine }

type WalletMachine = typeof walletMachine

export function useWallet(
	...[options]: ConditionalRequired<
		[
			options?: ActorOptions<WalletMachine> & {
				[K in RequiredActorOptionsKeys<WalletMachine>]: unknown
			}
		],
		IsNotNever<RequiredActorOptionsKeys<WalletMachine>>
	>
): {
	snapshot: Ref<SnapshotFrom<WalletMachine>>
	send: (event: EventFromLogic<WalletMachine>) => void
	actorRef: Actor<WalletMachine>
} {
	return useActor(walletMachine, options)
}

/**
 * Dex
 *___________________________________________________________*/

const dexMachine = createLuminaDexMachine()
export { dexMachine }

export type DexMachine = typeof dexMachine

export function useDex(
	...[options]: ConditionalRequired<
		[
			options?: ActorOptions<DexMachine> & {
				[K in RequiredActorOptionsKeys<DexMachine>]: unknown
			}
		],
		IsNotNever<RequiredActorOptionsKeys<DexMachine>>
	>
): {
	snapshot: Ref<SnapshotFrom<DexMachine>>
	send: (event: EventFromLogic<DexMachine>) => void
	actorRef: Actor<DexMachine>
} {
	return useActor(dexMachine, options)
}
const { send: sendWallet } = useWallet()

const { send } = useDex({ input: { addresses: { pool: "", factory: "", faucet: "" } } })

send({ type: "Swap", user: "" })
