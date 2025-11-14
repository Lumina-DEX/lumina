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

// Check if actions are available
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

## Token Decimals

All token amounts in the SDK are handled with their appropriate decimal precision. For most tokens, this is 9 decimal places (1e9).

The `amountIn` and `amountOut` values in the calculated result are in the token's smallest units (similar to wei in Ethereum). To convert to human-readable values, divide by the appropriate decimal factor:

```ts
// Convert from raw units to human-readable
const humanReadableAmount = calculatedAmount / 1e9
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
