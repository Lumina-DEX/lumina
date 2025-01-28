# @zeko/sdk

## React usage

The easiest way to get started would be to combine the SDK with React context to create global state for the Wallet and Dex machines.

1. Use `createWallet` and `createDex` to start the state machines.
2. Use React Context to provide the Wallet and Dex actors to the rest of the application.

```jsx
import { type LuminaContext as LC, createDex, createWallet } from "@lumina-dex/sdk"
import { createContext } from "react"

const Wallet = createWallet()

const Dex = createDex({ input: {
	wallet: Wallet,
	frontendFee: { destination: "", amount: 0 }
}})

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
	// Grab a machine from the context
	const { Wallet } = useContext(LuminaContext)
	// Read the state of the Wallet machine
	const isReady = useSelector(Wallet, (state) => state.matches("READY"))
	// Dispatch an event to the Wallet machine
	const connect = () => Wallet.send({ type: "Connect" })
	// Subscribe to state changes. Most of the times you won't need this.
	useEffect(() => {
		const subscription = Wallet.subscribe((snapshot) => {
			// simple logging
			console.log(snapshot)
		})
		return subscription.unsubscribe
	}, [Wallet])

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

## Vue usage

This example uses `@vueuse/core`, but you can share the actor in other ways as well.

```ts
import {
	dexMachine,
	type LuminaContext as LC,
	walletMachine
} from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { createSharedComposable } from "@vueuse/core"

export const useLuminaDex = createSharedComposable(() => {
	const Wallet = useActor(walletMachine)

	const Dex = useActor(dexMachine, {
		input: {
			wallet: Wallet,
			frontendFee: { destination: "", amount: 0 }
		}
	})

	return { Dex, Wallet }
})
```

Then in your components

```html
<script lang="ts" setup>
import { useLuminaDex } from "./somewhere"

const { Wallet, Dex } = useLuminaDex()
const walletLoaded = computed(
	() =>
		Wallet.snapshot.value.matches("READY") ||
		Wallet.snapshot.value.matches("SWITCHING_NETWORK") ||
		Wallet.snapshot.value.matches("FETCHING_BALANCE")
)

</script>
```

## Fetching Pool and Token Data

### Fetching from the CDN

The SDK exposes 2 functions to fetch the pool and token data from the CDN.

```ts
import { fetchPoolTokenList } from "@lumina-dex/sdk"

const tokens = await fetchPoolTokenList("mina:testnet")
```

### Fetching from the blockchain

_Ideally this should be done server side._

You can this information from the blockchain state by sending a GraphQL request to an archive node.
The SDK exposes 2 functions to demonstrate how to do this.

For more advanced use cases, you should create your own indexing service.

```ts
import {
	internal_fetchAllPoolEvents,
	internal_fetchAllPoolTokens
} from "@lumina-dex/sdk"

const events = await internal_fetchAllPoolFactoryEvents("mina:testnet")
const tokens = await internal_fetchAllTokensFromPoolFactory("mina:testnet")
```
