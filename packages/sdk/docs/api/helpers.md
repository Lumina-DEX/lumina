# Helper Functions

The Lumina DEX SDK provides several helper functions to simplify common tasks. This page documents these utility functions and their usage.

## Network Functions

### `minaNetwork`

Creates a Mina network instance for a given network.

```ts
import { minaNetwork } from "@lumina-dex/sdk"

// Create a network instance for a specific network
const network = minaNetwork("mina:devnet")

// Use with Mina SDK
Mina.setActiveInstance(network)
```

## GraphQL Client Functions

### `createMinaClient`

Creates a urql GraphQL client for making queries to Mina nodes.

```ts
import { createMinaClient } from "@lumina-dex/sdk"

// Create a client for a specific URL
const client = createMinaClient(
	"https://api.minascan.io/node/devnet/v1/graphql"
)

// Use the client to execute queries
const result = await client.query(FetchAccountBalanceQuery, {
	publicKey: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
	tokenId: null
})
```

### `createClientOptions`

Creates options for urql GraphQL clients.

```ts
import { createClientOptions } from "@lumina-dex/sdk"
import { Client } from "urql"

// Create client options
const options = createClientOptions(
	"https://api.minascan.io/node/devnet/v1/graphql"
)

// Create a custom client
const client = new Client(options)
```

### GraphQL Operations

Several pre-defined GraphQL operations are available for querying blockchain data:

#### Mina

- `FetchAccountBalanceQuery`: Fetches the balance of an account
- `LastBlockQuery`: Fetches the latest block information

#### Mina Archive

- `EventsQuery` : Fetches events from the blockchain

#### Zeko

- `GetBalanceQuery`: Fetches the balance of an account
- `ProveTransferRequestMutation` : Proves a transfer request
- `ProveTransferClaimMutation` : Proves a transfer claim
- `GetTransferAccountUpdateQuery` : Fetches transfer account updates

## DEX Helper Functions

### `canDoDexAction`

Checks what DEX actions are currently possible based on the context state.

```ts
import { canDoDexAction } from "@lumina-dex/sdk"

// Get the current context
const context = Dex.getSnapshot().context

// Check what actions are possible
const canDo = canDoDexAction(context)

// Use the results to do conditional rendering
```

The function returns an object with these properties:

```ts
interface CanDo {
	changeSwapSettings: boolean
	swap: boolean
	changeAddLiquiditySettings: boolean
	addLiquidity: boolean
	changeRemoveLiquiditySettings: boolean
	removeLiquidity: boolean
	deployPool: boolean
	deployToken: boolean
	mintToken: boolean
	claim: boolean
}
```

## Data Fetching Functions

### `fetchPoolTokenList`

Fetches token list from the Lumina CDN for a given network.

```ts
import { fetchPoolTokenList } from "@lumina-dex/sdk"

// Fetch tokens for a specific network
const result = await fetchPoolTokenList("mina:devnet")

// Access token data
const tokens = result.tokens

console.log(`Found ${tokens.length} tokens:`)
tokens.forEach(token => {
	console.log(`${token.symbol}: ${token.address}`)
})
```

### `internal_fetchAllPoolFactoryEvents`

Fetches all pool factory events from the blockchain.

```ts
import { internal_fetchAllPoolFactoryEvents } from "@lumina-dex/sdk"

// Fetch events for a specific network
const events = await internal_fetchAllPoolFactoryEvents({
	network: "mina:devnet",
	// Optional custom factory address
	factory: "B62qo8GFnNj3JeYq6iUUXeHq5bqJqPQmT5C2cTU7YoVc4mgiC8XEjHd"
})

// Process events
console.log(`Found ${events.length} pool events`)
const poolAddedEvents = events.filter(event => event.type === "poolAdded")
```

### `internal_fetchAllTokensFromPoolFactory`

Fetches all tokens from pool factory events on the blockchain.

```ts
import { internal_fetchAllTokensFromPoolFactory } from "@lumina-dex/sdk"

// Fetch tokens for a specific network
const tokensResult = await internal_fetchAllTokensFromPoolFactory({
	network: "mina:devnet"
})

// Filter successful results and process tokens
const tokens = tokensResult
	.filter(result => result.status === "fulfilled")
	.map(result => result.value)

console.log(`Found ${tokens.length} tokens on-chain`)
```

::: warning
The direct blockchain fetching methods (`internal_*`) are slower and should primarily be used for development or server-side operations. For client applications, prefer the CDN-based `fetchPoolTokenList` function.
:::
