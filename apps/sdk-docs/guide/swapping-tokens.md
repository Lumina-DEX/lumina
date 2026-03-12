````markdown
# Swapping Tokens

Token swapping is one of the primary features of the LuminaDex. This guide explains how to implement token swapping with the LuminaDex SDK.

## Swap Workflow

The complete swap workflow involves two main steps:

1. **Calculate the swap**: This calculates the expected output amount based on the input amount and current pool state
2. **Execute the swap**: This sends the actual transaction to the blockchain

This two-step process allows users to preview the expected outcome before committing to the transaction.

## Calculating a Swap

To calculate a swap, you send a `ChangeSwapSettings` event to the DEX machine:

```ts
Dex.send({
	type: "ChangeSwapSettings",
	settings: {
		// The pool address to use for the swap
		pool: "B62qjGnANmDdJoBhWCQpbN2v3V4CBb5u1VJSCqCVZbpS5uDs7aZ7TCH",

		// The input token (address and amount)
		from: {
			address: "MINA", // Special case for the native MINA token
			amount: "1" // Amount as a string
		},

		// The output token address
		to: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",

		// Slippage in percentage
		slippagePercent: 0.5
	}
})
```

The SDK will fetch the current pool state from the blockchain and calculate:

- Expected output amount
- Output amount (with slippage)
- Input amount (with slippage)

These results will be stored in the `context.dex.swap.calculated` object.

## Executing a Swap

Once the calculation is complete, you can execute the swap by sending a `Swap` event:

```ts
Dex.send({ type: "Swap" })
```

The DEX machine will:

1. Prepare the transaction and generate the proof
2. Prompt the user to sign it with the connected wallet
3. Send it to the blockchain
4. Store the transaction result in `context.dex.swap.transactionResult`

## Checking if Actions are Available

The SDK provides a convenient helper function `canDoDexAction` that checks if specific actions are available based on the current state:

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

Use this to enable/disable UI elements based on what actions are currently possible.

## Working with Different Token Types

When swapping tokens, you need to be aware of different token types:

### Native MINA Token

Use the special address `"MINA"` for the native MINA token:

```ts
from: {
  address: "MINA",
  amount: "1"
}
```

### Custom Tokens

For custom tokens, use their contract address:

```ts
from: {
  address: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
  amount: "10"
}
```

## Token Amounts and Unit Conversion

All calculated token amounts in the SDK are returned as `bigint` in the token's smallest units (similar to wei in Ethereum). Most tokens use 9 decimal places.

The SDK exports four utility functions for converting between human-readable decimals and on-chain units:

### `toUnits(amount, decimals)`

Converts a decimal number to the smallest unit of a token as `bigint`. Uses string manipulation internally to avoid floating-point precision loss.

```ts
import { toUnits } from "@lumina-dex/sdk"

toUnits(1.5, 9) // → 1_500_000_000n
toUnits(10, 6) // → 10_000_000n
```

### `toNanoUnits(amount)`

Convenience wrapper for tokens with 9 decimal places (MINA and most tokens on Mina Protocol).

```ts
import { toNanoUnits } from "@lumina-dex/sdk"

toNanoUnits(1.5) // → 1_500_000_000n
```

### `fromUnits(amount, decimals)`

Converts a `bigint` amount in smallest units back to a human-readable decimal number.

```ts
import { fromUnits } from "@lumina-dex/sdk"

fromUnits(1_500_000_000n, 9) // → 1.5
fromUnits(10_000_000n, 6) // → 10
```

### `fromNanoUnits(amount)`

Convenience wrapper for tokens with 9 decimal places.

```ts
import { fromNanoUnits } from "@lumina-dex/sdk"

fromNanoUnits(1_500_000_000n) // → 1.5
```

### Usage Example

```ts
const calculated = Dex.getSnapshot().context.dex.swap.calculated

if (calculated) {
	// calculated.amountOut is bigint — convert for display
	console.log("Expected output:", fromNanoUnits(calculated.amountOut))
	console.log("Min output (with slippage):", fromNanoUnits(calculated.balanceOutMin))
}
```

## Error Handling

Errors during the swap process are captured in the context:

```ts
const dexError = Dex.getSnapshot().context.dex.error
const contractError = Dex.getSnapshot().context.contract.error

if (dexError) {
	console.error("DEX Error:", dexError.message)
}

if (contractError) {
	console.error("Contract Error:", contractError.message)
}
```

Use these to display appropriate error messages to the user.
````
