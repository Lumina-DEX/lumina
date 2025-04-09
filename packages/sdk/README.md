# LuminaDex SDK

> State machine-driven SDK for interacting with the Lumina DEX on the Mina blockchain

[![npm version](https://img.shields.io/npm/v/@lumina-dex/sdk.svg)](https://www.npmjs.com/package/@lumina-dex/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

## ⚠️ Disclaimer

The Lumina DEX SDK is provided "as is" without any warranties or guarantees. While we strive to ensure the SDK's reliability and security, users should be aware that:

- Lumina is not liable for any losses, damages, or issues arising from the use of this SDK
- Users are responsible for validating and testing the SDK's functionality in their applications
- Smart contract interactions always carry inherent risks including potential loss of funds

By using this SDK, you acknowledge and accept these risks and limitations.

## Quick Links

- 📚 [Documentation](https://lumina-dex.github.io/sdk/) - Comprehensive guides and API reference
- 🚀 [Getting Started](https://lumina-dex.github.io/sdk/guide/getting-started) - Installation and basic usage
- 📖 [API Reference](https://lumina-dex.github.io/sdk/api/overview) - Detailed API documentation

## Features

- **XState Powered**: Built on XState state machines for predictable, testable application logic with type-safe events and transitions
- **Framework Agnostic**: First-class support for both React and Vue with dedicated integrations, while maintaining a framework-agnostic core
- **Complete DEX Support**: Connect wallets, swap tokens, add/remove liquidity, fetch pool data, and deploy contracts with a consistent API
- **Type-Safe**: Full TypeScript support with comprehensive type definitions for a better developer experience and fewer runtime errors

## Installation

```bash
# Using npm
npm install @lumina-dex/sdk

# Using pnpm
pnpm add @lumina-dex/sdk

# Using yarn
yarn add @lumina-dex/sdk

# Using bun
bun add @lumina-dex/sdk
```

## Basic Usage

```ts
import { createDex, createWallet } from "@lumina-dex/sdk"

// Create and start a wallet machine actor
const Wallet = createWallet()

// Create and start a DEX machine actor with the wallet as input
const Dex = createDex({
	input: {
		wallet: Wallet,
		frontendFee: {
			destination: "B62qmdQRb8FKaKA7cwaujmuTBbpp5NXTJFQqL1X9ya5nkvHSuWsiQ1H",
			amount: 1
		}
	}
})

// Connect the wallet
Wallet.send({ type: "Connect" })

// Subscribe to wallet state changes
Wallet.subscribe(state => {
	console.log("Wallet state:", state.value)
	console.log("Current network:", state.context.currentNetwork)
	console.log("Account address:", state.context.account)
})
```

## Framework Integration

The SDK provides dedicated integration modules for both React and Vue.

### React

```tsx
import {
	createDex,
	createWallet,
	type LuminaContext as LC
} from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { createContext, useContext } from "react"

// Create context
const Wallet = createWallet()
const Dex = createDex({
	input: { wallet: Wallet, frontendFee: { destination: "", amount: 0 } }
})
const Context: LC = { Dex, Wallet }
export const LuminaContext = createContext(Context)

// Use in components
function WalletButton() {
	const { Wallet } = useContext(LuminaContext)
	const isReady = useSelector(Wallet, (state) => state.matches("READY"))
	const connect = () => Wallet.send({ type: "Connect" })

	return (
		<button onClick={connect} disabled={isReady}>
			{isReady ? "Connected" : "Connect Wallet"}
		</button>
	)
}
```

### Vue

```vue
<script setup lang="ts">
import { dexMachine, walletMachine } from "@lumina-dex/sdk"
import { useActor } from "@lumina-dex/sdk/vue"
import { computed } from "vue"

// Create shared composable
const Wallet = useActor(walletMachine)
const Dex = useActor(dexMachine, {
  input: {
    wallet: Wallet.actorRef,
    frontendFee: { destination: "", amount: 0 }
  }
})

// Reactive state
const isReady = computed(() => Wallet.snapshot.value.matches("READY"))
const connect = () => Wallet.send({ type: "Connect" })
</script>

<template>
  <button @click="connect" :disabled="isReady">
    {{ isReady ? "Connected" : "Connect Wallet" }}
  </button>
</template>
```

## Data Fetching

```ts
import { fetchPoolTokenList } from "@lumina-dex/sdk"

// Fetch tokens for a specific network
const result = await fetchPoolTokenList("mina:devnet")
console.log("Token list:", result.tokens)

// For direct blockchain queries (slower, use server-side)
import { fetchAllTokensFromPoolFactory } from "@lumina-dex/sdk"

const tokens = await fetchAllTokensFromPoolFactory({
	network: "mina:devnet"
})
```

## Documentation

For complete documentation, visit [https://lumina-dex.github.io/sdk/](https://lumina-dex.github.io/sdk/)

## Examples

For full working examples, check out:

- [sdk-test-react](https://github.com/Lumina-DEX/lumina/tree/main/packages/sdk-test-react) - React integration example
- [sdk-test-vue](https://github.com/Lumina-DEX/lumina/tree/main/packages/sdk-test-vue) - Vue integration example

## License

MIT
