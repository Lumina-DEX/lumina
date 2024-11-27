# @zeko/sdk

## React usage

Provide the graphql client to the app :

```jsx
import { Provider, createMinaClient } from '@zeko/sdk/react';

const client = createMinaClient("https://devnet.zeko.io/graphql")

const App = () => (
  < Provider value={client}>
    <YourRoutes />
  </>
);
```

Create a custom hook to interact with the wallet.

```jsx
import { useWallet, useSelector } from "@zeko/sdk/react"
import { useEffect } from "react"

export const useUserWallet = () => {
	const [snapshot, send, actorRef] = useWallet()

	const address = snapshot.context.accounts[0] ?? ""

	const displayAddress = `${address?.slice(0, 6)}...${address?.slice(-4)}`

	const currentNetwork = snapshot.context.currentNetwork

	const minaBalances = useSelector(
		actorRef,
		(state) => state.context.minaBalances
	)
	const zekoBalances = useSelector(
		actorRef,
		(state) => state.context.zekoBalances
	)

	const walletLoaded =
		snapshot.matches("READY") ||
		snapshot.matches("SWITCHING_NETWORK") ||
		snapshot.matches("FETCHING_BALANCE")

	useEffect(() => {
		if (snapshot.matches("INIT")) {
			send({ type: "Connect" })
		}
	}, [snapshot])

	return {
		send,
		snapshot,
		actorRef,
		address,
		displayAddress,
		currentNetwork,
		minaBalances,
		zekoBalances,
		walletLoaded
	}
}
```

`useWallet` follows the xstate convention and returns a snapshot, a send function and an actorRef.
Refer to xstate documentation for more information :
https://stately.ai/docs/xstate-react
