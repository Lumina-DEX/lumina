import { type LuminaContext as LC, createDex, createWallet } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { createContext, useContext, useEffect } from "react"

const Wallet = createWallet()

const Dex = createDex({ input: { wallet: Wallet, frontendFee: { destination: "", amount: 0 } } })

const Context: LC = { Dex, Wallet }

export const LuminaContext = createContext(Context)

export function App() {
	const { Dex, Wallet } = useContext(LuminaContext)
	const dexReady = useSelector(Dex, (state) => state.matches({ dexSystem: { DEX: "READY" } }))
	const changeSettings = () =>
		Dex.send({
			type: "ChangeSwapSettings",
			settings: { from: { address: "1", amount: "1" }, pool: "", slippagePercent: 1 }
		})

	const isCalculatingSwap = useSelector(Dex, (state) =>
		state.matches({ dexSystem: "CALCULATING_SWAP_AMOUNT" })
	)

	const swapDetails = useSelector(Dex, (state) => state.context.dex.swap)

	const swap = () => Dex.send({ type: "Swap" })

	//Read
	const isReady = useSelector(Wallet, (state) => state.matches("READY"))
	// Send Event
	const connect = () => Wallet.send({ type: "Connect" })
	// React to state changes
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
