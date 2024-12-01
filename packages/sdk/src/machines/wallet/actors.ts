import type { EventObject } from "xstate"
import { fromCallback } from "../../helpers/xstate"
import type { Wallet, WalletEmit } from "."

/**
 * This Actor listens to the Wallet machine and emits events.
 * The parent machine must implement events compatible with the WalletEmit interface.
 */
export const detectWalletChange = fromCallback<
	EventObject,
	WalletEmit,
	{ wallet: Wallet },
	WalletEmit
>(({ sendBack, input: { wallet } }) => {
	const nc = wallet.on("NetworkChanged", (emitted) => {
		console.log("NetworkChanged received by actor", emitted)
		sendBack({ type: "NetworkChanged", network: emitted.network })
	})

	const ac = wallet.on("AccountChanged", (emitted) => {
		console.log("AccountChanged received by actor", emitted)
		sendBack({ type: "AccountChanged", account: emitted.account })
	})

	return () => {
		nc.unsubscribe()
		ac.unsubscribe()
	}
})
