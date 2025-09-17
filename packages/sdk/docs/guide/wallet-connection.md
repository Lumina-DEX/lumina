# Wallet Connection

Connecting to a Mina wallet is one of the first steps in building a dApp with the LuminaDex SDK. This guide explains how to implement wallet connection functionality.

## Understanding the Wallet Machine

The `walletMachine` is a state machine that manages the entire lifecycle of wallet interaction:

- **INIT**: Initial state, waiting for connection
- **CONNECTING**: Connecting to the wallet extension
- **FETCHING_BALANCE**: Fetching wallet balances
- **READY**: Wallet is connected and ready to use
- **SWITCHING_NETWORK**: Changing blockchain networks
- **UNSUPPORTED**: No Mina wallet provider detected.

## Basic Connection Flow

The typical flow for connecting a wallet is:

1. Create a wallet actor with `createWallet()`
2. Send a `Connect` event to the actor
3. Listen for state changes to know when the wallet is ready
4. Fetch balances when needed

```ts
import { createWallet } from "@lumina-dex/sdk"

// Create the wallet actor
const Wallet = createWallet()

// Connect to the wallet
Wallet.send({ type: "Connect" })

// Subscribe to state changes
Wallet.subscribe(state => {
	const currentState = state.value
	console.log("Wallet state:", currentState)

	if (state.matches("READY")) {
		console.log("Wallet is ready!")
		console.log("Account:", state.context.account)
		console.log("Network:", state.context.currentNetwork)
		console.log("Balances:", state.context.balances)
	}

	if (state.matches("UNSUPPORTED")) {
		// Show UI that guides the user to install Auro Wallet
		console.log(
			"No Mina wallet detected. Please install Auro Wallet: https://www.aurowallet.com/"
		)
	}
})

// For React
const walletState = useSelector(Wallet, (state) => state.value)

// For Vue
const walletState = computed(() => Wallet.snapshot.value.value)
// OR
const walletState = useSelector(Wallet.actorRef, (state) => state.value)
```

## Handling the User's Wallet Extension

The SDK automatically detects and integrates with compatible browser extensions (such as Auro Wallet) that inject a `window.mina` object. Key considerations:

- The `Connect` event triggers a permission prompt in the user's wallet
- If the user rejects the request, the machine will remain in the initial state
- The wallet connection can be attempted multiple times

## Fetching Token Balances

Once the wallet is connected, you can fetch token balances:

```ts
// Fetch MINA balance on devnet
Wallet.send({
	type: "FetchBalance",
	network: "mina:devnet",
	// No token specified will fetch MINA
	tokens: []
})

// Fetch a custom token balance
Wallet.send({
	type: "FetchBalance",
	network: "mina:devnet",
	tokens: [{
		address: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
		decimal: 1e9, // Token decimal places
		tokenId: "wZmPhCrDVraeYcB3By5USJCJ9KCMLYYp497Zuby2b8Rq3wTcbn",
		symbol: "USDC"
	}]
})

// Fetch Lumina LP token balance
Wallet.send({
	type: "FetchBalance",
	network: "mina:devnet",
	tokens: [{
		poolAddress: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
		decimal: 1e9,
		symbol: "LLP-USDC_MINA"
	}]
})
```

After fetching, the balances will be available in the `context.balances` object:

```ts
// Pseudo code to access balances by network and token symbol
const minaBalance = state.context.balances["mina:devnet"]["MINA"]
const usdcBalance = state.context.balances["mina:devnet"]["USDC"]
```

Use `useSelector` to read the context.

## Switching Networks

To switch between different Mina networks:

```ts
// Request network change
Wallet.send({
	type: "RequestNetworkChange",
	network: "mina:mainnet"
})
```

The machine will transition to the `SWITCHING_NETWORK` state, handle the network change, and eventually return to the `READY` state if successful.

## Handling Wallet Events

The SDK automatically listens for events from the wallet extension and responds accordingly:

- If the user changes networks in their wallet, the SDK detects this and updates
- If the user changes accounts, the SDK detects this and updates the current account
- If the user disconnects their wallet, the SDK resets to the initial state

## Full Example

Here's a complete example of wallet connection with network switching and balance fetching:

```ts
import { createWallet } from "@lumina-dex/sdk"

function setupWallet() {
	const Wallet = createWallet()

	// Add event listeners for UI updates
	const unsubscribe = Wallet.subscribe(state => {
		updateUI(state)
	})

	// Connect button handler
	document.getElementById("connect-btn").addEventListener("click", () => {
		Wallet.send({ type: "Connect" })
	})

	// Network switch button handlers
	document.getElementById("switch-to-devnet").addEventListener("click", () => {
		Wallet.send({ type: "RequestNetworkChange", network: "mina:devnet" })
	})

	document.getElementById("switch-to-mainnet").addEventListener("click", () => {
		Wallet.send({ type: "RequestNetworkChange", network: "mina:mainnet" })
	})

	// Refresh balance button handler
	document.getElementById("refresh-balance").addEventListener("click", () => {
		Wallet.send({
			type: "FetchBalance",
			networks: [Wallet.getSnapshot().context.currentNetwork]
		})
	})

	// Clean up function
	return () => {
		unsubscribe()
	}
}

function updateUI(state) {
	const statusElement = document.getElementById("wallet-status")
	const accountElement = document.getElementById("wallet-account")
	const networkElement = document.getElementById("wallet-network")
	const balanceElement = document.getElementById("wallet-balance")

	statusElement.textContent = state.value

	if (state.matches("READY")) {
		accountElement.textContent = state.context.account
		networkElement.textContent = state.context.currentNetwork

		const currentNetwork = state.context.currentNetwork
		const balance = state.context.balances[currentNetwork]?.MINA || 0
		balanceElement.textContent = `${balance} MINA`

		document.getElementById("wallet-controls").style.display = "block"
	} else {
		document.getElementById("wallet-controls").style.display = "none"
	}
}

// Initialize the wallet system
setupWallet()
```

## Framework-specific Implementation

For framework-specific implementation details, see:

- [React Integration](/guide/react-integration)
- [Vue Integration](/guide/vue-integration)
