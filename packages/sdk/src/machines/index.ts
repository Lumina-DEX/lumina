import { Provider } from "urql"
import {
	type ActorOptions,
	type AnyStateMachine,
	type ConditionalRequired,
	createActor,
	type IsNotNever,
	type RequiredActorOptionsKeys
} from "xstate"
import { createClientOptions, createMinaClient } from "../graphql/clients"
import { createPoolMachine } from "./luminadex/actors/createPool"
import { canDoDexAction } from "./luminadex/helpers"
import { createLuminaDexMachine } from "./luminadex/machine"
import { transactionMachine } from "./transaction"
import { createWalletMachine } from "./wallet/machine"

type MachineOptions<Machine extends AnyStateMachine> = ConditionalRequired<[
	options?:
		& ActorOptions<Machine>
		& { [K in RequiredActorOptionsKeys<Machine>]: unknown }
], IsNotNever<RequiredActorOptionsKeys<Machine>>>

/**
 * GraphQL client
 * ___________________________________________________________ */
export { createClientOptions, createMinaClient }

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

/**
 * Other Machines
 * ___________________________________________________________ */

export type CreatePoolMachine = typeof createPoolMachine
export type TransactionMachine = typeof transactionMachine

export { createPoolMachine, transactionMachine }

export type LuminaContext = { Wallet: WalletActor; Dex: DexActor }
