# Fetching Data

The LuminaDex SDK provides several ways to fetch data from the blockchain, including token lists, pool information, and account balances. This guide explains the different data fetching methods available.

## Fetching Token Lists

The SDK provides a convenient function to fetch token lists from the Lumina CDN:

```ts
import { fetchPoolTokenList } from "@lumina-dex/sdk"

// Fetch tokens for a specific network
const fetchTokens = async () => {
	const result = await fetchPoolTokenList("mina:devnet")
	console.log("Token list:", result.tokens)

	// Each token has properties like:
	// - address: The token contract address
	// - tokenId: The unique token ID
	// - symbol: The token symbol (e.g., "USDC")
	// - decimals: Number of decimal places
	// - chainId: Network where the token exists
	// - poolAddress: Address of the pool for this token
}
```

This is the recommended way to get the list of available tokens, as it's fast and doesn't require on-chain queries.

## Fetching Pools and Tokens from the Blockchain

For more direct access to on-chain data, the SDK provides functions to query the blockchain:

```ts
import {
	internal_fetchAllPoolFactoryEvents,
	internal_fetchAllTokensFromPoolFactory
} from "@lumina-dex/sdk"

// Fetch all pool events
const fetchPoolEvents = async () => {
	const events = await internal_fetchAllPoolFactoryEvents({
		network: "mina:devnet"
	})
	console.log("Pool events:", events)
}

// Fetch all tokens from pools
const fetchPoolTokens = async () => {
	const tokensResult = await internal_fetchAllTokensFromPoolFactory({
		network: "mina:devnet"
	})

	console.log("On-chain tokens:", tokensResult)
}
```

::: warning
The direct blockchain fetching methods are slower and should primarily be used for development or server-side operations. For client applications, prefer the CDN-based `fetchPoolTokenList` function.
:::

## Fetching Account Balances

Account balances are automatically fetched when connecting a wallet, but you can also fetch them manually:

```ts
import { createWallet, type Networks } from "@lumina-dex/sdk"

const Wallet = createWallet()

// Connect first
Wallet.send({ type: "Connect" })

// Wait for connection, then fetch MINA balance
Wallet.subscribe(state => {
	if (state.matches("READY")) {
		// Fetch native MINA balance
		Wallet.send({
			type: "FetchBalance",
			networks: ["mina:devnet"]
		})
	}
})

// Fetch balance for a specific token
const fetchTokenBalance = (token) => {
	Wallet.send({
		type: "FetchBalance",
		networks: ["mina:devnet"],
		token: {
			address: token.address,
			decimal: 10 ** token.decimals,
			tokenId: token.tokenId,
			symbol: token.symbol
		}
	})
}
```

After fetching, the balances are available in the wallet's context:

```ts
const walletState = Wallet.getSnapshot()
const minaBalance = walletState.context.balances["mina:devnet"]["MINA"]
const tokenBalance = walletState.context.balances["mina:devnet"][tokenSymbol]
```

## Advanced: Using GraphQL Directly

The SDK builds on GraphQL clients for Mina nodes. If you need more control, you can use the helpers to create a GraphQL clients directly, and query the chain with one of the provided queries for full Typescript support.

::: warning
The Archive, Node and Zeko endpoint don't support all queries. Make sure to use the correct endpoint for your query.
:::

```ts
import {
	createMinaClient,
	FetchAccountBalanceQuery,
	urls
} from "@lumina-dex/sdk"

const customQuery = async () => {
	const client = createMinaClient(urls["mina:devnet"])

	const result = await client.query(FetchAccountBalanceQuery, {
		publicKey: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
		tokenId: null
	})

	console.log("Query result:", result)
}
```
