import { type LuminaContext as LC, createDex, createWallet } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { createContext } from "react"

const Wallet = createWallet()

const Dex = createDex({
	addresses: { faucet: "", factory: "", pool: "" },
	wallet: Wallet,
	frontendFee: { destination: "", amount: 0 }
})

const Context: LC = { Dex, Wallet }

export const LuminaContext = createContext(Context)

export function App() {
	//Read
	const isReady = useSelector(Wallet, (state) => state.matches("READY"))
	const connect = () => Wallet.send({ type: "Connect" })

	return (
		<LuminaContext.Provider value={Context}>
			<div>Context</div>
		</LuminaContext.Provider>
	)
}
