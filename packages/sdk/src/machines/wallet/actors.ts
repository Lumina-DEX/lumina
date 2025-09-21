import type { ActorRefFromLogic, EventObject } from "xstate"
import { logger } from "../../helpers/debug"
import { fromCallback } from "../../helpers/xstate"
import type { createWalletMachine } from "./machine"
import type { WalletEmit } from "./types"

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
