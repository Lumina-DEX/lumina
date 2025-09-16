import type { ActorRefFromLogic, EventObject } from "xstate"
import { logger } from "../../helpers/debug"
import { fromCallback } from "../../helpers/xstate"
import type { createWalletMachine } from "./machine"
import type { WalletEmit } from "./types"

export type WalletActorRef = ActorRefFromLogic<ReturnType<typeof createWalletMachine>>

/**
 * This Actor listens to the Wallet machine and emits events.
 * The parent machine must implement events compatible with the WalletEmit interface.
 */
export const detectWalletChange = fromCallback<
	EventObject,
	WalletEmit,
	{ wallet: WalletActorRef },
	WalletEmit
>(({ sendBack, input: { wallet } }) => {
	logger.info("Setting up wallet change listener actor")
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
})
