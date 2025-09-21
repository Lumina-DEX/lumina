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

- 📚 [Documentation](https://sdk.luminadex.com/) - Comprehensive guides and API reference
- 📜 [Contracts Reference](https://lumina-dex.github.io/lumina/) - Detailed smart contract reference
- 💻 [O1js Docs](https://docs.o1labs.org/o1js) - Official documentation for the o1js library
- ⚙️ [XState Docs](https://stately.ai/docs) - Official documentation for the XState library

## Features

- **XState Powered**: Built on XState state machines for predictable, testable application logic with type-safe events and transitions
- **Framework Agnostic**: First-class support for both React and Vue with dedicated integrations, while maintaining a framework-agnostic core
- **Complete DEX Support**: Connect wallets, swap tokens, add/remove liquidity, fetch pool data, and deploy contracts with a consistent API
- **Type-Safe**: Full TypeScript support with comprehensive type definitions for a better developer experience and fewer runtime errors

## Installation

```bash
# Using npm
npm install @lumina-dex/sdk o1js
```

```bash
# Using pnpm
pnpm add @lumina-dex/sdk o1js
```

```bash
# Using yarn
yarn add @lumina-dex/sdk o1js
```

```bash
# Using bun
bun add @lumina-dex/sdk o1js
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
Wallet.subscribe((state) => {
	console.log("Wallet state:", state.value)
	console.log("Current network:", state.context.currentNetwork)
	console.log("Account address:", state.context.account)
})
```

## Framework Integration

The SDK provides dedicated integration modules for both React and Vue.

### React

```tsx
import { createDex, createWallet, type LuminaContext as LC } from "@lumina-dex/sdk"
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
import { fetchPoolList, fetchTokenList } from "@lumina-dex/sdk"

// Fetch tokens for a specific network
const tokens = await fetchTokenList("mina:devnet")
const pools = await fetchPoolList("mina:devnet")
console.log("Token list:", tokens)
console.log("Pool list:", pools)

// For direct blockchain queries (slower, use server-side)
import { fetchAllFromPoolFactory } from "@lumina-dex/sdk"
const { tokens, pools } = await fetchAllFromPoolFactory({
	network: "mina:devnet"
})
```

## Load Additional Features

By default, the SDK initializes with the `Swap` feature. You can specify which features you want to load during initialization:

```ts
const Dex = createDex({
	input: {
		wallet: Wallet,
		features: ["Swap", "ManualDeployPool"], // Load specific features
		frontendFee: {
			destination: "B62qmdQRb8FKaKA7cwaujmuTBbpp5NXTJFQqL1X9ya5nkvHSuWsiQ1H",
			amount: 1
		}
	}
})
```

You can load additional features dynamically after initialization:

```ts
Dex.send({ type: "LoadFeatures", features: ["ManualDeployPool", "Claim"] })
```

## Debugging

You can set in localStorage some specific values to help with debugging and caching:

```ts
localStorage.setItem("disableCache", true) // default false
localStorage.setItem("debugLogs", true) // default false in prod
```

## Documentation

For complete documentation, visit [https://lumina-dex.github.io/sdk/](https://lumina-dex.github.io/sdk/)

## Transaction Tracking

The SDK provides a unified transaction lifecycle for every DEX operation that produces a zkApp transaction (swap, add/remove liquidity, mint, claim, deploy pool/token, pool creation). A dedicated `transactionMachine` actor manages signing, broadcasting, inclusion polling (when required) and persistence.

Key characteristics:

- Stable internal id (`transactionLid`) derived from a hash of the transaction JSON
- Automatic resume of pending, unsigned or unconfirmed transactions after reload using IndexedDB (`idb`)
- Standard phases: `RESUMING → SIGNING → SENDING → WAITING (Mina only) → DONE`
- Final result shape: `{ hash, url }` (or an `Error` on failure)

### Accessing a Transaction

Action subcontexts (e.g. `swap`, `addLiquidity`) expose a `transactionLid`. Use it to retrieve the corresponding transaction actor from `context.transactions` and inspect its state.

```ts
const dexCtx = Dex.getSnapshot().context
const swapLid = dexCtx.dex.swap.transactionLid
if (swapLid) {
	const txActor = dexCtx.transactions[swapLid]
	// Inspect live state
	const txState = txActor.getSnapshot()
	console.log(txState.value) // e.g. 'WAITING', 'DONE'
	console.log(txState.context.result) // { hash, url } | Error (once DONE)
}
```

### React Example

```tsx
import { useSelector } from "@lumina-dex/sdk/react"

function LatestSwapTx({ Dex }: { Dex: ReturnType<typeof createDex> }) {
	const swapLid = useSelector(Dex, (s) => s.context.dex.swap.transactionLid)
	const txActor = useSelector(Dex, (s) => (swapLid ? s.context.transactions[swapLid] : undefined))
	const txState = useSelector(txActor, (a) => a?.getSnapshot())
	if (!swapLid || !txActor || !txState) return null
	if (txState.value === "DONE" && !(txState.context.result instanceof Error)) {
		return (
			<a href={txState.context.result.url} target="_blank">
				View Tx
			</a>
		)
	}
	return <span>Tx Status: {String(txState.value)}</span>
}
```

### Vue Example

```vue
<script setup lang="ts">
import { useSelector } from "@lumina-dex/sdk/vue"
import { computed } from "vue"

const props = defineProps<{ Dex: any }>()
const swapLid = useSelector(props.Dex, (s) => s.context.dex.swap.transactionLid)
const txActor = useSelector(props.Dex, (s) =>
	swapLid ? s.context.transactions[swapLid] : undefined
)
const txStatus = computed(() => txActor?.getSnapshot().value)
const txResult = computed(() => txActor?.getSnapshot().context.result)
</script>

<template>
  <div v-if="swapLid && txActor">
    <a
      v-if='txStatus === "DONE" && txResult && !("message" in txResult)'
      :href="txResult.url"
      target="_blank"
    >View Tx</a>
    <span v-else>Tx Status: {{ txStatus }}</span>
  </div>
</template>
```

### Pool Creation

Server‑side pool creation uses a `createPoolMachine` that, after proof generation and signature, spawns a transaction machine. Track pool jobs in `context.dex.createPool.pools` and then locate the transaction via the `transactionLid` recorded in the relevant action context.

### Rationale

This model offers: resilience (resume after refresh), a consistent inspection surface, and a single place to extend capabilities such as notifications or retries.

## Examples

For full working examples, check out:

- [sdk-test-react](https://github.com/Lumina-DEX/lumina/tree/main/packages/sdk-test-react) - React integration example
- [sdk-test-vue](https://github.com/Lumina-DEX/lumina/tree/main/packages/sdk-test-vue) - Vue integration example

## License

MIT
