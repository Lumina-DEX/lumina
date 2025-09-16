# DEX Machine API

The DEX Machine is responsible for managing all DEX-related operations including contract compilation, token swapping, liquidity operations, and token deployment. This page documents the API for the DEX machine, including its states, events, and context.

::: tip
If you're using React or Vue, use the `useSelector` hook to access the context in a component.
:::

## Creating a DEX Actor

```ts
import { createDex, createWallet } from "@lumina-dex/sdk"

// Create a wallet actor first
const Wallet = createWallet()

// Create a DEX actor with the wallet as input
const Dex = createDex({
	input: {
		wallet: Wallet,
		frontendFee: {
			destination: "B62qmdQRb8FKaKA7cwaujmuTBbpp5NXTJFQqL1X9ya5nkvHSuWsiQ1H",
			amount: 1 // 1% fee
		}
	}
})
```

The `frontendFee` parameter is optional and allows you to specify a fee destination address and percentage (0-10) for transactions processed through your frontend.

## Machine States

The DEX machine is a parallel state machine with two regions:

### Contract System States

- `LOADING_CONTRACTS`: Loading contract definitions
- `COMPILE_FUNGIBLE_TOKEN`: Compiling the fungible token contract
- `COMPILE_POOL`: Compiling the pool contract
- `COMPILE_POOL_TOKEN_HOLDER`: Compiling the pool token holder contract
- `COMPILE_FUNGIBLE_TOKEN_ADMIN`: Compiling the fungible token admin contract
- `COMPILE_POOL_FACTORY`: Compiling the pool factory contract
- `COMPILE_FAUCET`: Compiling the faucet contract
- `CONTRACTS_READY`: All contracts are compiled and ready
- `FAILED`: Contract compilation failed

### DEX System States

- `DEX`: Main DEX state
  - `READY`: Ready for operations
  - `ERROR`: An error occurred
- `UNSUPPORTED`: No compatible Mina wallet detected. This is a final state.
- `CALCULATING_SWAP_AMOUNT`: Calculating swap outputs
- `SWAPPING`: Executing a swap transaction
- `CALCULATING_ADD_LIQUIDITY_AMOUNT`: Calculating liquidity addition
- `ADDING_LIQUIDITY`: Adding liquidity to a pool
- `CALCULATING_REMOVE_LIQUIDITY_AMOUNT`: Calculating liquidity removal
- `REMOVING_LIQUIDITY`: Removing liquidity from a pool
- `DEPLOYING_POOL`: Deploying a new pool
- `DEPLOYING_TOKEN`: Deploying a new token
- `CLAIMING_FROM_FAUCET`: Claiming tokens from a faucet
- `MINTING`: Minting tokens

You can check the current state using:

```ts
const state = Dex.getSnapshot()
console.log("Contract system state:", state.value.contractSystem)
console.log("DEX system state:", state.value.dexSystem)

// Check specific states
if (Dex.getSnapshot().state.matches({ contractSystem: "CONTRACTS_READY" })) {
	console.log("Contracts are ready")
}

if (Dex.getSnapshot().state.matches({ dexSystem: "DEX.READY" })) {
	console.log("DEX is ready for operations")
}

// Handle unsupported environment for DEX operations
if (Dex.getSnapshot().state.matches({ dexSystem: "UNSUPPORTED" })) {
	console.log(
		"DEX unsupported: No Mina wallet detected. Ask user to install/enable wallet."
	)
}
```

## Events

The DEX machine responds to these events:

### Swap Events

#### `ChangeSwapSettings`

Calculates swap outcomes based on provided settings.

```ts
Dex.send({
	type: "ChangeSwapSettings",
	settings: {
		pool: "B62qjGnANmDdJoBhWCQpbN2v3V4CBb5u1VJSCqCVZbpS5uDs7aZ7TCH",
		from: {
			address: "MINA", // or a token address
			amount: "1" // string amount
		},
		to: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
		slippagePercent: 0.5
	}
})
```

#### `Swap`

Executes a swap after calculation.

```ts
Dex.send({ type: "Swap" })
```

### Liquidity Events

#### `ChangeAddLiquiditySettings`

Calculates liquidity addition based on provided settings.

```ts
Dex.send({
	type: "ChangeAddLiquiditySettings",
	settings: {
		pool: "B62qjGnANmDdJoBhWCQpbN2v3V4CBb5u1VJSCqCVZbpS5uDs7aZ7TCH",
		tokenA: {
			address: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
			amount: "10"
		},
		tokenB: {
			address: "MINA",
			amount: "5"
		},
		slippagePercent: 0.5
	}
})
```

#### `AddLiquidity`

Executes liquidity addition after calculation.

```ts
Dex.send({ type: "AddLiquidity" })
```

#### `ChangeRemoveLiquiditySettings`

Calculates liquidity removal based on provided settings.

```ts
Dex.send({
	type: "ChangeRemoveLiquiditySettings",
	settings: {
		pool: "B62qjGnANmDdJoBhWCQpbN2v3V4CBb5u1VJSCqCVZbpS5uDs7aZ7TCH",
		lpAmount : "100"
		slippagePercent: 0.5
	}
})
```

#### `RemoveLiquidity`

Executes liquidity removal after calculation.

```ts
Dex.send({ type: "RemoveLiquidity" })
```

### Deployment Events

#### `DeployPool`

Deploys a new pool for a token pair.

```ts
Dex.send({
	type: "DeployPool",
	settings: {
		tokenA: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
		tokenB: "MINA"
	}
})
```

#### `DeployToken`

Deploys a new fungible token.

```ts
Dex.send({
	type: "DeployToken",
	settings: {
		symbol: "TEST" // Token symbol
	}
})
```

### Token Operations

#### `MintToken`

Mints tokens to a specified address.

```ts
Dex.send({
	type: "MintToken",
	settings: {
		to: "B62qmRQzqp9fD84EpBbzgSUZUjAtVM54sBQTyP6rptVxKwLrLH1Ns7M",
		token: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
		amount: 100 // As a number
	}
})
```

#### `ClaimTokensFromFaucet`

Claims test tokens from a faucet (testnet only).

```ts
Dex.send({ type: "ClaimTokensFromFaucet" })
```

### Network Events

These events are handled automatically from the wallet:

- `NetworkChanged`: When the network has changed
- `AccountChanged`: When the account has changed

### Other Events

#### `LoadFeatures`

Loads additional features or capabilities of the wallet.

```ts
Wallet.send({
	type: "LoadFeatures",
	features: ["Swap", "ManualDeployPool", "DeployToken", "Claim"]
})
```

## Context

The DEX machine maintains a complex context object with multiple sections that you can find in the [source code](https://github.com/Lumina-DEX/lumina/blob/main/packages/sdk/src/machines/luminadex/types.ts).

You can access the context using:

```ts
const context = Dex.getSnapshot().context

// Access contract state
const contractsLoaded = context.contract.loaded
const contractError = context.contract.error

// Access swap state
const swapSettings = context.dex.swap
const swapResult = context.dex.swap.calculated
const swapTransaction = context.dex.swap.transactionResult

// Access liquidity state
const addLiquiditySettings = context.dex.addLiquidity
const removeLiquiditySettings = context.dex.removeLiquidity
```

## Helper Functions

### `canDoDexAction`

The SDK provides a helper function to check what actions are currently possible:

```ts
import { canDoDexAction } from "@lumina-dex/sdk"

const canDo = canDoDexAction(Dex.getSnapshot().context)

if (canDo.changeSwapSettings) {
	// Can change swap settings
}

if (canDo.swap) {
	// Can execute swap
}
```

Available checks:

- `changeSwapSettings`: Can calculate swap amounts
- `swap`: Can execute swap
- `changeAddLiquiditySettings`: Can calculate add liquidity
- `addLiquidity`: Can execute add liquidity
- `changeRemoveLiquiditySettings`: Can calculate remove liquidity
- `removeLiquidity`: Can execute remove liquidity
- `deployPool`: Can deploy a pool
- `deployToken`: Can deploy a token
- `mintToken`: Can mint tokens
- `claim`: Can claim from faucet

## Event Handlers

You can subscribe to state changes to respond to events:

```ts
const unsubscribe = Dex.subscribe((state) => {
	console.log("Contract system state:", state.value.contractSystem)
	console.log("DEX system state:", state.value.dexSystem)

	// Check what actions are possible
	const canDo = canDoDexAction(state.context)
	console.log("Available actions:", canDo)

	// Handle specific state transitions
	if (
		state.matches({ dexSystem: "DEX.READY" })
		&& state.context.dex.swap.calculated
	) {
		console.log("Swap calculation complete")
		console.log(
			"Expected output:",
			state.context.dex.swap.calculated.amountOut / 1e9
		)
	}
})

// Later, clean up the subscription
unsubscribe()
```

## Type Definitions

Refer to the [source code](https://github.com/Lumina-DEX/lumina/blob/main/packages/sdk/src/machines/luminadex/types.ts) for the full type definitions.
