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

Checks what DEX actions are currently possible based on loaded contracts and state.

This is helpful to control the `disabled` attributes within UI buttons.

_For example, if the swap contracts are loaded, but you haven't calculated the amounts with `ChangeSwapSettings`, it will return `false`._

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

### `canStartDexAction`

Similar to `canDoDexAction` but only checks if the necessary contracts are loaded.

This is helpful to conditionally render a page that requires a feature to be available.

_For example, if the swap contracts are loaded, but you haven't calculated the amounts with `ChangeSwapSettings`, it will return `true`._

```ts
import { canStartDexAction } from "@lumina-dex/sdk"

// Get the current context
const context = Dex.getSnapshot().context

// Check what actions are possible
const canStart = canStartDexAction(context)

// Use the results to do conditional rendering
```

## Data Fetching Functions

### `fetchTokenList`

Fetches token list from the Lumina CDN for a given network.

```ts
import { fetchTokenList } from "@lumina-dex/sdk"

// Fetch tokens for a specific network
const tokens = await fetchTokenList("mina:devnet")
console.log(`Found ${tokens.length} tokens:`)
tokens.forEach(token => {
	console.log(`${token.symbol}: ${token.address}`)
})
```

### `fetchPoolList`

Fetches pool list from the Lumina CDN for a given network.

```ts
import { fetchPoolList } from "@lumina-dex/sdk"
// Fetch pools for a specific network
const pools = await fetchPoolList("mina:devnet")
console.log(`Found ${pools.length} pools:`)
pools.forEach(pool => {
	console.log(`${pool.name}: ${pool.address}`)
})
```

### `fetchAllFromPoolFactory`

Fetches all tokens and pools from pool factory events on the blockchain.

```ts
import { fetchAllFromPoolFactory } from "@lumina-dex/sdk"
// Fetch tokens and pools for a specific network
const { tokens, pools } = await fetchAllFromPoolFactory({
	network: "mina:devnet"
})
```

### `fetchAllTokensFromPoolFactory`

Fetches all tokens from pool factory events on the blockchain.

```ts
import { fetchAllTokensFromPoolFactory } from "@lumina-dex/sdk"

// Fetch tokens for a specific network
const tokensResult = await fetchAllTokensFromPoolFactory({
	network: "mina:devnet"
})
```

### `fetchAllPoolsFromPoolFactory`

Fetches all pools from pool factory events on the blockchain.

```ts
import { fetchAllPoolsFromPoolFactory } from "@lumina-dex/sdk"
// Fetch pools for a specific network
const poolsResult = await fetchAllPoolsFromPoolFactory({
	network: "mina:devnet"
})
```

::: warning
The direct blockchain fetching methods are slower and should primarily be used for development or server-side operations. For client applications, prefer the CDN-based `fetchTokenList` and `fetchPoolList` function.
:::
