# @zeko/sdk

## React usage

The easiest way to get started would be to combine the SDK with React context to create global state for the Wallet and Dex machines.

1. Use `createWallet` and `createDex` to start the state machines.
2. Use React Context to provide the Wallet and Dex actors to the rest of the application.

```jsx
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
	return (
		<LuminaContext.Provider value={Context}>
			<div>Rest of the application ...</div>
		</LuminaContext.Provider>
	)
}
```

Then in your components

```jsx
import { useSelector } from "@lumina-dex/sdk/react"
import { useContext } from "react"
import { LuminaContext } from "./somewhere"

export function SomeComponent() {
	const { Wallet } = useContext(LuminaContext)
	// Read the state of the Wallet machine
	const isReady = useSelector(Wallet, (state) => state.matches("READY"))
	// Dispatch an event to the Wallet machine
	const connect = () => Wallet.send({ type: "Connect" })

	return (
		<div>
			{!isReady
				? <button onClick={connect}>Connect</button>
				: <p>Wallet is ready</p>}
		</div>
	)
}
```

Refer to xstate documentation for more information :
https://stately.ai/docs/xstate-react
