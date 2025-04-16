# Managing Liquidity

Managing liquidity in pools is a core functionality of the Lumina DEX. This guide covers how to add and remove liquidity using the SDK.

## Understanding Liquidity Pools

Liquidity pools in the Lumina DEX are smart contracts that hold token pairs and enable trading between them. When you add liquidity:

1. You deposit an equal value of two tokens into a pool
2. You receive liquidity pool (LP) tokens that represent your share of the pool
3. You earn fees from trades that happen in the pool

When you remove liquidity, you:

1. Return your LP tokens to the pool
2. Receive your share of both tokens in the pool, including any earned fees

## Adding Liquidity

Adding liquidity follows a similar two-step process to swapping:

1. **Calculate**: Determine the optimal amounts to add based on the current pool state
2. **Execute**: Send the transaction to add liquidity to the pool

### Calculating Liquidity Addition

To calculate a liquidity addition, you send a `ChangeAddLiquiditySettings` event:

```ts
Dex.send({
	type: "ChangeAddLiquiditySettings",
	settings: {
		// The pool address
		pool: "B62qjGnANmDdJoBhWCQpbN2v3V4CBb5u1VJSCqCVZbpS5uDs7aZ7TCH",

		// Token A settings
		tokenA: {
			address: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
			amount: "10"
		},

		// Token B settings
		tokenB: {
			address: "MINA", // Native MINA token
			amount: "5"
		},

		// Maximum allowed slippage in percentage
		slippagePercent: 0.5
	}
})
```

The DEX machine will calculate:

- Optimal amounts for both tokens
- Maximum amounts with slippage
- Expected LP tokens to receive

These results will be stored in `context.dex.addLiquidity.calculated`.

### Executing Liquidity Addition

Once the calculation is complete, you can execute the addition:

```ts
Dex.send({ type: "AddLiquidity" })
```

The DEX machine will send the transaction and store the result in `context.dex.addLiquidity.transactionResult`.

## Removing Liquidity

Removing liquidity also follows the calculate-then-execute pattern:

### Calculating Liquidity Removal

To calculate a liquidity removal, you send a `ChangeRemoveLiquiditySettings` event:

```ts
Dex.send({
	type: "ChangeRemoveLiquiditySettings",
	settings: {
		// The pool address
		pool: "B62qjGnANmDdJoBhWCQpbN2v3V4CBb5u1VJSCqCVZbpS5uDs7aZ7TCH",

		// liquidity amount to withdraw
		lpAmount: "10000",

		// Maximum allowed slippage in percentage
		slippagePercent: 0.5
	}
})
```

The DEX machine will calculate:

- Expected amounts of both tokens to receive
- Minimum amounts with slippage
- The exact amount of LP tokens that will be burned

These results will be stored in `context.dex.removeLiquidity.calculated`.

### Executing Liquidity Removal

Once the calculation is complete, you can execute the removal:

```ts
Dex.send({ type: "RemoveLiquidity" })
```

The DEX machine will send the transaction and store the result in `context.dex.removeLiquidity.transactionResult`.

## Checking if Actions are Available

Use the `canDoDexAction` helper to check if liquidity actions are available:

```ts
import { canDoDexAction } from "@lumina-dex/sdk"

const canDo = canDoDexAction(Dex.getSnapshot().context)

if (canDo.changeAddLiquiditySettings) {
	// Can calculate liquidity addition
}

if (canDo.addLiquidity) {
	// Can execute liquidity addition
}

if (canDo.changeRemoveLiquiditySettings) {
	// Can calculate liquidity removal
}

if (canDo.removeLiquidity) {
	// Can execute liquidity removal
}
```

## Creating a New Pool

If you need to create a new pool for a token pair that doesn't have one yet, you can use the `DeployPool` event:

```ts
Dex.send({
	type: "DeployPool",
	settings: {
		tokenA: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w", // Token address
		tokenB: "MINA" // The other token (only MINA is supported on the Mina blockchain L1)
	}
})
```

This will deploy a new pool contract for this token pair, and the result will be stored in `context.dex.deployPool.transactionResult`.

## Handling First Liquidity Addition

When adding liquidity to a newly created pool (with no existing liquidity), the calculation is different:

- The ratio of the two tokens you add will determine the initial price
- There's no slippage calculation since there's no existing price to compare to
- You'll receive LP tokens based on the geometric mean of the two amounts

The DEX machine handles this special case automatically when you set `ChangeAddLiquiditySettings`.
