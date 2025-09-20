---
"@lumina-dex/sdk": minor
---

feat: transaction tracking

Add a dedicated state machines to track transactions. This is useful for L1 transactions that may take a while to be included in a block.

`canStartDexAction` helper added to check if an action can be started based on loaded contracts only.

Breaking changes :

- `LOADING_CONTRACTS` state in dex.contracts has been renamed to `INIT_CONTRACTS`.
- `IDLE` state in dex.contracts has been renamed to `READY`.
- The `LoadFeatures` event now only works when in the `READY` state.
