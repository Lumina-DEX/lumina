# @lumina-dex/sdk

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
