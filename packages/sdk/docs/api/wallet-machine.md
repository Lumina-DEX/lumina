# Wallet Machine API

The Wallet Machine is responsible for managing wallet connection, network changes, and balance fetching. This page documents the API for the wallet machine, including its states, events, and context.

::: tip
If you're using React or Vue, use the `useSelector` hook to access the context in a component.
:::

## Creating a Wallet Actor

```ts
import { createWallet } from "@lumina-dex/sdk"

// Create and start a wallet actor
const Wallet = createWallet()
```

## Machine States

The wallet machine can be in one of these states:

- `INIT`: Initial state waiting for connection
- `CONNECTING`: Attempting to connect to the wallet extension
- `FETCHING_BALANCE`: Fetching account balances
- `READY`: Connected and ready for operations
- `SWITCHING_NETWORK`: Changing to a different network

You can check the current state using:

```ts
const state = Wallet.getSnapshot()
console.log("Current state:", state.value)

// Check if in a specific state
if (state.matches("READY")) {
	console.log("Wallet is ready")
}
```

## Events

The wallet machine responds to these events:

### `Connect`

Initiates the wallet connection process.

```ts
Wallet.send({ type: "Connect" })
```

### `Disconnect`

Disconnects the wallet.

```ts
Wallet.send({ type: "Disconnect" })
```

### `RequestNetworkChange`

Requests a change to a different network.

```ts
Wallet.send({
	type: "RequestNetworkChange",
	network: "mina:devnet" // or "mina:mainnet", "zeko:testnet", etc.
})
```

### `FetchBalance`

Fetches token balances for the current account.

```ts
// Fetch MINA balance
Wallet.send({
	type: "FetchBalance",
	network: "mina:devnet"
})

// Fetch custom token balance
Wallet.send({
	type: "FetchBalance",
	network: "mina:devnet",
	token: [{
		address: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
		decimal: 1e9,
		tokenId: "wZmPhCrDVraeYcB3By5USJCJ9KCMLYYp497Zuby2b8Rq3wTcbn",
		symbol: "USDC"
	}]
})

// Fetch Lumina LP token balance
Wallet.send({
	type: "FetchBalance",
	network: "mina:devnet",
	token: [{
		poolAddress: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
		decimal: 1e9,
		symbol: "LLP-USDC_MINA"
	}]
})
```

## Internal Events

These events are handled internally and shouldn't be sent manually:

- `WalletExtensionChangedNetwork`: Triggered when the user changes networks in their wallet
- `SetAccount`: Sets the current account (triggered by `Connect` or wallet extension)

## Context

The wallet machine maintains this context object:

```ts
type WalletContext = {
	// The connected account address
	account: string

	// The current network
	currentNetwork: Networks

	// Token balances by network and token symbol
	balances: Balance
}

type Balance = {
	"mina:mainnet": { [tokenId: string]: { balance: number; symbol: string } }
	"mina:devnet": { [tokenId: string]: { balance: number; symbol: string } }
	"zeko:testnet": { [tokenId: string]: { balance: number; symbol: string } }
	"zeko:mainnet": { [tokenId: string]: { balance: number; symbol: string } }
}
```

You can access the context using :

```ts
const context = Wallet.getSnapshot().context
console.log("Account:", context.account)
console.log("Current network:", context.currentNetwork)
console.log("MINA balance:", context.balances["mina:devnet"]["MINA"])
```

## Emitted Events

The wallet machine emits these events (which you can listen for):

- `NetworkChanged`: When the network has been changed
- `AccountChanged`: When the account has been changed

```ts
Wallet.subscribe((state) => {
	if (state.event.type === "NetworkChanged") {
		console.log("Network changed to:", state.event.network)
	}

	if (state.event.type === "AccountChanged") {
		console.log("Account changed to:", state.event.account)
	}
})
```

## Event Handlers

You can subscribe to state changes to respond to events:

```ts
const unsubscribe = Wallet.subscribe((state) => {
	console.log("New state:", state.value)
	console.log("Event type:", state.event.type)

	// Handle specific state transitions
	if (state.changed && state.matches("READY")) {
		console.log("Wallet just became ready")
	}
})

// Later, clean up the subscription
unsubscribe()
```

## Type Definitions

Refer to the [source code](https://github.com/Lumina-DEX/lumina/blob/main/packages/sdk/src/machines/wallet/types.ts) for the full type definitions.
