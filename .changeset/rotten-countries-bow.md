---
"@lumina-dex/sdk": minor
---

This patch introduces new functions to fetch pools and refactor the existing fetch token logic. This is a breaking change.

- New Interface: `LuminaPool`, `PoolDbList`
- Renamed interface: `TokenDbToken` => `LuminaToken`

- New functions : `fetchAllFromPoolFactory`, `fetchAllPoolsFromPoolFactory`, `fetchPoolList`
- Renamed function : `fetchPoolTokenList` => `fetchTokenList`

The return type of the `fetchAll*` functions has changed : It's now a `Map` instead of an array.

Additionally, concurrency limits are introduced in several parts of the SDK.

Note that `fetchPoolList` is not implemented yet.
