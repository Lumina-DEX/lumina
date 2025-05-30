# Core Concepts

The LuminaDex SDK is built around several key concepts that are important to understand before diving into implementation details.

## State Machines

At the heart of the SDK are two main state machines powered by [XState](https://stately.ai/docs):

### Wallet Machine

The Wallet machine handles all interactions with the Mina blockchain wallet:

- Detecting wallet extension presence
- Connecting to the wallet
- Switching networks
- Fetching account balances
- Handling network and account changes

```d2
direction: down

style: {
  fill: transparent
}

classes: {
  node: {
    style: {
      font-size: 8
      stroke-width: 2
    }
  }
  anim: {
    style: {
      font-size: 8
      animated: true
      stroke-width: 2
    }
  }
}

INIT: {
  shape: circle
  class: anim
}

CONNECTING.class: node
FETCHING_BALANCE.class: node
READY.class: node
SWITCHING_NETWORK.class: node

INIT -> CONNECTING: Connect { class: anim }
CONNECTING -> FETCHING_BALANCE: SetAccount { class: anim }
FETCHING_BALANCE -> READY: success { class: anim }
READY -> SWITCHING_NETWORK: RequestNetworkChange { class: anim }
READY -> FETCHING_BALANCE: FetchBalance { class: anim }
SWITCHING_NETWORK -> FETCHING_BALANCE: setWalletNetwork { class: anim }
```

### DEX Machine

The DEX machine handles all operations related to the Lumina DEX:

- Compiling and loading smart contracts
- Swapping tokens
- Adding/removing liquidity
- Deploying pools and tokens
- Minting tokens
- Claiming from faucet (on test networks)

```d2
direction: down

style: {
  fill: transparent
}

contractSystem: Contract System {
  LOADING_CONTRACTS -> COMPILE_FUNGIBLE_TOKEN: loadContracts
  COMPILE_FUNGIBLE_TOKEN -> COMPILE_POOL: compileContract
  COMPILE_POOL -> COMPILE_POOL_TOKEN_HOLDER: compileContract
  COMPILE_POOL_TOKEN_HOLDER -> COMPILE_FUNGIBLE_TOKEN_ADMIN: compileContract
  COMPILE_FUNGIBLE_TOKEN_ADMIN -> COMPILE_POOL_FACTORY: compileContract
  COMPILE_POOL_FACTORY -> COMPILE_FAUCET: compileContract
  COMPILE_FAUCET -> CONTRACTS_READY: compileContract
}
```

```d2
direction: down

style: {
  fill: transparent
}

  
Calculating {

  READY: Ready {
    shape: circle
  }

  Ready -> CALCULATING_SWAP_AMOUNT
  Ready -> CALCULATING_ADD_LIQUIDITY_AMOUNT
  Ready -> CALCULATING_REMOVE_LIQUIDITY_AMOUNT
  CALCULATING_SWAP_AMOUNT -> SWAPPING 
  CALCULATING_ADD_LIQUIDITY_AMOUNT -> ADDING_LIQUIDITY
  CALCULATING_REMOVE_LIQUIDITY_AMOUNT -> REMOVING_LIQUIDITY
}
```

```d2
direction: down

style: {
  fill: transparent
}

  
Operations {
  READY: Ready {
    shape: circle
  }

  Ready -> DEPLOYING_TOKEN
  Ready -> DEPLOYING_POOL
  Ready -> CLAIMING_FROM_FAUCET
  Ready -> MINTING
}
```

## Network Types

The SDK supports several network configurations:

```ts
type NetworkLayer = "mina" | "zeko"
type ChainNetwork = "mainnet" | "devnet" | "testnet"
type NetworkUri =
	| "mina:mainnet"
	| "mina:devnet"
	| "zeko:testnet"
	| "zeko:mainnet"
```

These network identifiers are used throughout the SDK to specify which blockchain network to interact with.

## Actor System

The SDK uses an actor-based approach where state machines are instantiated as actors that can:

1. Receive events through the `send()` method
2. Maintain internal state
3. Execute side effects
4. Communicate with other actors

```d2
direction: right

style: {
  fill: transparent
}

Application: Application {
  UI: User Interface
  Wallet: AuroWallet
  style.multiple: true
}

SDK: {
  wallet: Wallet {
    state: State
    context: Context
    
    state: {
      shape: hexagon
    }
    
    context: {
      shape: cylinder
    }
  }
  
  dex: Dex {
    state: State
    context: Context
    
    state: {
      shape: hexagon
    }
    
    context: {
      shape: cylinder
    }
  }
  
  wallet -> dex: provides
}

Blockchain: {
  style.multiple: true
  minaWallet: Mina Wallet
  minaNode: Mina Node
}

Application.UI <-> SDK:  Events / Subscribe 

SDK.wallet <-> Blockchain.minaWallet: "Connect,\nFetch Balance"
SDK.dex <-> Blockchain.minaNode: "Transactions,\nQueries"
```

```ts
// Create actors
const Wallet = createWallet()
const Dex = createDex({ input: { wallet: Wallet, ... } })

// Send events to actors
Wallet.send({ type: "Connect" })
Dex.send({ type: "ChangeSwapSettings", settings: { ... } })

// Subscribe to actor state changes
Wallet.subscribe(state => {
  console.log("New wallet state:", state.value)
})

//Read the actor state
console.log(Wallet.getSnapshot())
```

## Web Workers

For computationally intensive operations like cryptographic calculations, the SDK utilizes Web Workers to free-up the main thread. The DEX machine spawns a worker that handles:

- Contract compilation with a remote cache
- Cryptographic operations
- Transaction preparation

Additionally, o1js is being used, which includes other web workers based optimizations.

```d2
direction: down


style: {
  fill: transparent
}

mainThread: Main Thread {
  app: App {
    shape: rectangle
    style.stroke-width: 2
  }
  sdk: SDK {
    dexMachine: Dex {
      shape: rectangle
      style.stroke-width: 2
    }
    walletMachine: Wallet {
      shape: rectangle
      style.stroke-width: 2
    }
  }
}

workerThread: Worker Thread {
  luminaDexWorker: LuminaDex Worker {
    shape: rectangle
    style.stroke-width: 2
    
    contracts: Contract Instances
    crypto: o1js, proofs
    transactions: Transaction Builder
  }
}

mainThread.sdk <-> workerThread.luminaDexWorker: Comlink
```

This architecture ensures the main thread remains responsive during heavy computations, such as contract compilation or zk proof generations.

## GraphQL for Blockchain Data

The SDK uses GraphQL to fetch blockchain data from Mina nodes and archive services. It provides:

- Pre-configured GraphQL clients with [urql](https://github.com/urql-graphql/urql)
- Type-safe queries using [gql.tada](https://gql-tada.0no.co/)
- GraphQL schemas for Mina, Archive, and Zeko services
- Helper functions for common data requests

```d2
direction: right

style: {
  fill: transparent
}

SDK: SDK {
  clients: GraphQL Clients {
    minaClient: Mina Client
    archiveClient: Archive Client
    zekoClient: Zeko Client
  }
  
  queries: {
    shape: document
    
    balanceQuery: GetBalance Query
    poolQuery: GetPool Query
    eventsQuery: GetEvents Query
    other: "..."
  }
  
  helpers: Helper Functions {
    fetchTokenList: Fetch Pool Tokens from CDN
    fetchPoolList: Fetch Pool List from CDN
    fetchEvents: Fetch Pool Events from Blockchain
    fetchTokens: Fetch Pool Tokens from Blockchain 
  }
  
  clients -> queries: executes
  helpers -> clients: uses
  
  style.stroke-dash: 5
}

blockchain: Blockchain {
  minaNode: Mina Node {
    shape: cloud
  }
  
  archiveNode: Archive Node {
    shape: cloud
  }
  
  zekoNode: Zeko Node {
    shape: cloud
  }
}

SDK.clients.minaClient -> blockchain.minaNode: HTTP
SDK.clients.archiveClient -> blockchain.archiveNode: HTTP
SDK.clients.zekoClient -> blockchain.zekoNode: HTTP

cdn: Lumina CDN {
  shape: cloud
  tokenLists: Token Lists
}

SDK.helpers.fetchTokenList -> cdn: HTTP
SDK.helpers.fetchPoolList -> cdn: HTTP
```
