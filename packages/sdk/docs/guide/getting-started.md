# Getting Started with LuminaDex SDK

The LuminaDex SDK is a powerful library for interacting with the Lumina DEX contracts on the Mina and Zeko blockchains. It provides a state machine-driven approach to managing wallet connections, token swaps, liquidity provision, and other DEX-related operations.

## Installation

::: code-group

```bash [npm]
npm install @lumina-dex/sdk
```

```bash [pnpm]
pnpm add @lumina-dex/sdk
```

```bash [yarn]
yarn add @lumina-dex/sdk
```

```bash [bun]
bun add @lumina-dex/sdk
```

:::

## Prerequisites

To develop a dapp using the LuminaDex SDK effectively, you'll need:

- A modern JavaScript environment with ES modules support
- A Mina wallet extension installed in the user's browser (like Auro Wallet)
- Basic familiarity with state machines (though not strictly required)

## Quick Start

The core of the SDK revolves around two main modules:

1. **Wallet**: Manages wallet connection, network switching, and balance fetching
2. **DEX**: Handles all DEX-related operations like swapping, liquidity, and token deployment

These modules are xstate machines.
Here's a quick example to connect a wallet and initialize the DEX:

```ts
import { createDex, createWallet } from "@lumina-dex/sdk"

// Create and start the wallet
const Wallet = createWallet()

// Create and start the Dex
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
```

The SDK provides dedicated integration modules for both React and Vue, making it easy to use in your framework of choice.

## Framework Integration

The SDK is framework-agnostic, but it provides dedicated integration modules for both React and Vue.
See the [React Integration](/guide/react-integration) and [Vue Integration](/guide/vue-integration) pages for complete examples.

## Debugging and Caching

There is 2 values that can be set in localStorage to help with debugging and caching:

```js
localStorage.setItem("disableCache", true) // default false
localStorage.setItem("debugLogs", true) // default false in prod
```

Disabling cache will prevent the SDK from using the remote cache for contract compilation, and will force a compilation of the contracts from scratch. This takes longer, but can be useful for debugging.

Debug Logs will enable additional logging in the console, which can help with debugging issues in the SDK in your application during production or preview stage of the development. These logs are enabled by default in development mode.

## What's Next?

- Learn about the [Core Concepts](/guide/core-concepts) behind the SDK's design
- Set up [Wallet Connection](/guide/wallet-connection) in your application
- Understand how to implement [Token Swapping](/guide/swapping-tokens)
- Explore the [API Reference](/api/overview) for detailed information on all available functions and options
