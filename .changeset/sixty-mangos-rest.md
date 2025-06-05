---
"@lumina-dex/sdk": minor
---

## Add debugging flags to control caching and debugging output

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
