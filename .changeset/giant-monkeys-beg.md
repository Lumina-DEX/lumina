---
"@lumina-dex/sdk": minor
---

- Implement `fetchPoolList`, which fetches pools from the CDN and returns `LuminaPool[]`
- Change `fetchTokenList` return type to `LuminaToken[]`. This is a breaking change.
- Remove `poolAddress` from `LuminaToken`. This is a breaking change.
