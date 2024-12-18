import { type LuminaContext as LC, createDex, createWallet } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { createContext, useEffect } from "react"

const Wallet = createWallet()

const Dex = createDex({
	wallet: Wallet,
	frontendFee: { destination: "", amount: 0 }
})

const Context: LC = { Dex, Wallet }

export const LuminaContext = createContext(Context)

export function App() {
	//Read
	const isReady = useSelector(Wallet, (state) => state.matches("READY"))
	// Send Event
	const connect = () => Wallet.send({ type: "Connect" })
	// React to state changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const subscription = Wallet.subscribe((snapshot) => {
			// simple logging
			console.log(snapshot)
		})

		return subscription.unsubscribe
	}, [Wallet])

	return (
		<LuminaContext.Provider value={Context}>
			<div>Context</div>
		</LuminaContext.Provider>
	)
}
