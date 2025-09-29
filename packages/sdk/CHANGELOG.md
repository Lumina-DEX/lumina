# @lumina-dex/sdk

## 0.24.0

### Minor Changes

- 066a5b3: Catches transaction errors.
- 45ca62c: Check if a token exists before the pool creation

## 0.23.0

### Minor Changes

- 55b3e4e: # Transaction tracking

  Add a dedicated state machines to track transactions. This is useful for L1 transactions that may take a while to be included in a block.

  `canStartDexAction` helper added to check if an action can be started based on loaded contracts only.

  ## Breaking changes :

  - The SDK no longer exports all `o1js` methods.
  - `LOADING_CONTRACTS` state in dex.contracts has been renamed to `INIT_CONTRACTS`.
  - `IDLE` state in dex.contracts has been renamed to `READY`.
  - The `LoadFeatures` event now only works when in the `READY` state.

- ff62dbd: Check if a pool already exist before creating a pool for a token pair
- 1bbeb8d: The dex and wallet machines now have a `UNSUPPORTED` state, to help in situations where window.mina is undefined.
- 0d356f6: Update factory contract
  Update multisig rigth type from Struct to Field

### Patch Changes

- 3ae0e12: fix: createPool machine should only retry 3 times.
- Updated dependencies [0d356f6]
  - @lumina-dex/contracts@0.8.0

## 0.22.0

### Minor Changes

- 4d6bd85: Remove zeko static fees

### Patch Changes

- 9b4dc58: fix `ManualPoolDeploy` in the SDK.

## 0.21.1

### Patch Changes

- 408ac7c: Add `onError` handlers to invoked actors and fix `RequestNetworkChange` bug that changed the network even when the user declined from the browser extension.

## 0.21.0

### Minor Changes

- 0c23ff6: add o1js to peerDependencies

## 0.20.1

### Patch Changes

- 4de4f55: fixes:

  - signer factories should come from sdk
  - mina fetching balance

## 0.20.0

### Minor Changes

- 50b59a8: add server-side pool creation

## 0.19.0

### Minor Changes

- c88ed07: add tokenId to LuminaPool

## 0.18.0

### Minor Changes

- 0694cae: Move multisig from pool to factory
  Update sdk to integrate the new contracts
  Correct a calculation bug on add liquidity

### Patch Changes

- Updated dependencies [0694cae]
  - @lumina-dex/contracts@0.7.0

## 0.17.0

### Minor Changes

- 049a173: ## Add debugging flags to control caching and debugging output

  ```ts
  localStorage.setItem("disableCache", "true") // default false
  localStorage.setItem("debugLogs", "true") // default false in prod
  ```

  ## Fix blockscan explorer domain in transaction hash

  Now points to the correct url and network.

  ## Rework Contract Compilation

  Contracts are now loaded and compiled on demand, behind the following feature flags :

  - Swap (enabled by default)
  - DeployPool
  - DeployToken
  - Claim

  When initializing the SDK, you can specify which features to load:

  ```ts
  const Dex = createDex({
  	input: {
  		wallet: Wallet,
  		features: ["Swap", "DeployPool"], // Load specific features
  		frontendFee: {
  			destination: "B62qmdQRb8FKaKA7cwaujmuTBbpp5NXTJFQqL1X9ya5nkvHSuWsiQ1H",
  			amount: 1
  		}
  	}
  })
  ```

  You can load additional features dynamically after initialization:

  ```ts
  Dex.send({ type: "LoadFeatures", features: ["DeployPool", "Claim"] })
  ```

## 0.16.0

### Minor Changes

- 8098bc5: Add multisig in the pools contracts
  Update contract address in the sdk
  Remove faucet and token admin contract from sdk compile list (you can't deploy a new token)

### Patch Changes

- Updated dependencies [8098bc5]
  - @lumina-dex/contracts@0.6.0

## 0.15.1

### Patch Changes

- bed7d24: fix dataclone errors while loading contracts

## 0.15.0

### Minor Changes

- a72aab2: - Implement `fetchPoolList`, which fetches pools from the CDN and returns `LuminaPool[]`
  - Change `fetchTokenList` return type to `LuminaToken[]`. This is a breaking change.
  - Remove `poolAddress` from `LuminaToken`. This is a breaking change.

### Patch Changes

- 952aa9e: Minor interface change for `LuminaToken` and `LuminaPool`.

## 0.14.0

### Minor Changes

- 731fa10: This patch introduces new functions to fetch pools and refactor the existing fetch token logic. This is a breaking change.

  - New Interface: `LuminaPool`, `PoolDbList`
  - Renamed interface: `TokenDbToken` => `LuminaToken`

  - New functions : `fetchAllFromPoolFactory`, `fetchAllPoolsFromPoolFactory`, `fetchPoolList`
  - Renamed function : `fetchPoolTokenList` => `fetchTokenList`

  The return type of the `fetchAll*` functions has changed : It's now a `Map` instead of an array.

  Additionally, concurrency limits are introduced in several parts of the SDK.

  Note that `fetchPoolList` is not implemented yet.

## 0.13.0

### Minor Changes

- e1c8273: Add hash and url to transaction results
- 61f9406: add custom fund new account to support zeko

## 0.12.0

### Minor Changes

- df2b617: Several breaking changes in this release to handle fetching multiple tokens at once.

  - Implement multiple token balance fetch
  - LP tokens balance can be fetched directly from a poolAddress.
  - `lpAmount` type changed from `number` to `string`

## 0.11.0

### Minor Changes

- 1770560: Update calculateRemoveLiquidityAmount method signature

## 0.10.0

### Minor Changes

- d3f711b: Fix loading url for the sdk bundle

## 0.9.0

### Minor Changes

- 188d1b7: Fix CDN urls within the SDK and cache generation

## 0.8.0

### Minor Changes

- 9dacdc2: Add Zeko token fetch, and fix token fetch on Mina. Remove deprecated methods from the SDK.

### Patch Changes

- Updated dependencies [3bb13df]
  - @lumina-dex/contracts@0.5.0

## 0.7.0

### Minor Changes

- 9ebd676: Change the SDK maximum frontend fee from 0.15% to 0.10%.

### Patch Changes

- Updated dependencies [9ebd676]
  - @lumina-dex/contracts@0.4.0

## 0.6.4

### Patch Changes

- 149c9f1: Swap should now work in both directions.

## 0.6.3

### Patch Changes

- 3dd113b: Expose cache and network features

## 0.6.2

### Patch Changes

- a17a0cb: Fix swap issue due to fee calculation.

## 0.6.1

### Patch Changes

- dc26f4a: Fix mina:devnet balance fetching

## 0.6.0

### Minor Changes

- 0371a2d: Changed nomenclature of available chains.

## 0.5.1

### Patch Changes

- a4722d1: Fix signer and user0 for mina:testnet

## 0.5.0

### Minor Changes

- f4fe1a8: Upgrade to o1js ^2.2.0 with new versions of contracts. Add cdn reset feature and cdn-sdk sync.

### Patch Changes

- Updated dependencies [f4fe1a8]
  - @lumina-dex/contracts@0.3.0

## 0.4.0

### Minor Changes

- e637ceb: - Change the swap interface by adding a to parameter. This is a breaking change.
  - Add canDoDexAction.
  - Add logs.
  - Fix many functionalities.

## 0.3.2

### Patch Changes

- ed22fd6: Add log statements to the worker.

## 0.3.1

### Patch Changes

- bae9b40: Replace SharedWorker with Worker

## 0.3.0

### Minor Changes

- d034806: Fix the fetch of the balance and change the data structure of the wallet balance.

## 0.2.2

### Patch Changes

- 12480cf: Detect mina:devnet and add a fallback for unknown networks.

## 0.2.1

### Patch Changes

- 63ca4b8: The Wallet SDK now correctly fetch the balance for the MINA token.

## 0.2.0

### Minor Changes

- a45d650: Add LuminaCDN support for the SDK.
- db8892a: Release of the pre-audit contracts

### Patch Changes

- Updated dependencies [db8892a]
  - @lumina-dex/contracts@0.2.0

## 0.1.1

### Patch Changes

- 024e96e: Export constants and wallet actors

## 0.1.0

### Minor Changes

- f6fb83d: Releasing pre-alpha version of the SDK and contracts.

### Patch Changes

- Updated dependencies [f6fb83d]
  - @lumina-dex/contracts@0.1.0
