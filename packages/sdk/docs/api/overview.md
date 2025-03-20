# API Overview

The Lumina DEX SDK provides a comprehensive API for interacting with the Lumina DEX on the Mina blockchain. This page provides an overview of the main API components.

## Core Exports

```ts
import {
	// Helper functions
	canDoDexAction,
	createDex,
	// Actor creation
	createWallet,
	dexMachine,
	fetchPoolTokenList,
	// Types
	type LuminaContext,
	type Networks,
	type TokenDbToken,
	// State machines
	walletMachine
} from "@lumina-dex/sdk"
```

## Framework-specific Exports

```ts
// React integration
import { useSelector } from "@lumina-dex/sdk/react"

// Vue integration
import { useActor } from "@lumina-dex/sdk/vue"
```

## Component Categories

The SDK is organized into several key component categories:

### State Machines

The SDK uses XState state machines to manage application state:

- **[Wallet Machine](/api/wallet-machine)**: Manages wallet connection and state
- **[DEX Machine](/api/dex-machine)**: Manages DEX operations like swapping and liquidity

### Actor Functions

Functions to create and start state machine actors:

- `createWallet()`: Creates and starts a wallet actor
- `createDex({ input })`: Creates and starts a DEX actor

### Helper Functions

Utility functions for common operations:

- `canDoDexAction(context)`: Checks what operations are currently possible
- `fetchPoolTokenList(network)`: Fetches token lists from the CDN
- `internal_fetchAllPoolFactoryEvents({ network })`: Fetches pool events from blockchain
- `internal_fetchAllTokensFromPoolFactory({ network })`: Fetches tokens from blockchain
- `minaNetwork(network)`: Creates a Mina network instance

### Framework Integration

Framework-specific utilities:

- React: `useSelector(actor, selector)` for state selection
- Vue: `useActor(machine, options)` for actor creation in Vue components

## Main Types

```ts
// Network types
type NetworkLayer = "mina" | "zeko"
type ChainNetwork = "mainnet" | "devnet" | "testnet"
type NetworkUri =
	| "mina:mainnet"
	| "mina:devnet"
	| "zeko:testnet"
	| "zeko:mainnet"
type Networks = keyof typeof urls

// Actor types
type WalletMachine = typeof walletMachine
type WalletActor = ReturnType<typeof createActor<WalletMachine>>
type DexMachine = typeof dexMachine
type DexActor = ReturnType<typeof createActor<DexMachine>>

// Context type for passing actors to components
type LuminaContext = { Wallet: WalletActor; Dex: DexActor }

// Token data types
interface TokenDbToken {
	address: string
	poolAddress: string
	chainId: string
	tokenId: string
	symbol: string
	decimals: number
}
```

## Basic Usage Flow

The SDK follows a consistent pattern for operations:

1. Create actors for wallet and DEX
2. Connect the wallet
3. Send events to the actors to trigger operations
4. Subscribe to actor state changes to update the UI

```ts
// 1. Create actors
const Wallet = createWallet()
const Dex = createDex({
	input: { wallet: Wallet, frontendFee: { destination: "", amount: 0 } }
})

// 2. Connect wallet
Wallet.send({ type: "Connect" })

// 3. Listen for state changes
Wallet.subscribe(state => {
	console.log("Wallet state:", state.value)

	// 4. When wallet is ready, perform DEX operations
	if (state.matches("READY")) {
		// Example: Set up a token swap
		Dex.send({
			type: "ChangeSwapSettings",
			settings: {
				pool: "B62qj...",
				from: { address: "MINA", amount: "1" },
				to: "B62qj...",
				slippagePercent: 0.5
			}
		})
	}
})

// 5. Listen for DEX state changes
Dex.subscribe(state => {
	console.log("DEX state:", state.value)

	// Example: Execute swap when calculation is ready
	const canDo = canDoDexAction(state.context)
	if (canDo.swap) {
		Dex.send({ type: "Swap" })
	}
})
```

## Next Steps

Explore the detailed API documentation for each component:

- [Wallet Machine](/api/wallet-machine)
- [DEX Machine](/api/dex-machine)
- [Helper Functions](/api/helpers)
