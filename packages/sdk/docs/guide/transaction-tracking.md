# Transaction Tracking

This guide describes the unified transaction tracking system. All DEX operations that generate a zkApp transaction are handled by a dedicated `transactionMachine` child actor.

## Why a Transaction Machine?

- Resilience: Pending transactions (not yet included on L1) survive page reloads via IndexedDB
- Uniform UX: Same inspection workflow for swap, liquidity, mint, claim, deploy pool/token and server-side pool creation
- Extensibility: Central place to add retries, notifications, advanced analytics later

## High-Level Flow

```
RESUMING -> SIGNING -> SENDING -> WAITING (mina only) -> DONE
            ^ (zeko networks skip WAITING, inclusion is immediate)
```

| Phase    | Purpose                                                        |
| -------- | -------------------------------------------------------------- |
| RESUMING | Look for an unconfirmed saved tx in IndexedDB (same hash)      |
| SIGNING  | Obtain wallet signature (fee normalization handled internally) |
| SENDING  | Broadcast and persist signed data (hash, zkAppId)              |
| WAITING  | Poll inclusion status (Mina networks)                          |
| DONE     | Store final `{ hash, url }` result (or Error)                  |

## Accessing Transactions

Each action context stores a `transactionLid` (internal id) instead of a raw result.

```ts
const { dex, transactions } = Dex.getSnapshot().context
const swapLid = dex.swap.transactionLid
if (swapLid) {
	const txActor = transactions[swapLid]
	const txState = txActor.getSnapshot()
	console.log("status", txState.value) // e.g. 'WAITING', 'DONE'
	console.log("result", txState.context.result) // { hash, url } | Error (after DONE)
}
```

## React Example

```tsx
import { useSelector } from "@lumina-dex/sdk/react"

export function LatestSwapTx({ Dex }: { Dex: ReturnType<typeof createDex> }) {
	const lid = useSelector(Dex, s => s.context.dex.swap.transactionLid)
	const txActor = useSelector(
		Dex,
		s => lid ? s.context.transactions[lid] : undefined
	)
	const status = useSelector(txActor, a => a?.getSnapshot().value)
	const result = useSelector(txActor, a => a?.getSnapshot().context.result)
	if (!lid || !txActor) return null
	if (status === "DONE" && result && !(result instanceof Error)) {
		return <a href={result.url} target="_blank">View Tx</a>
	}
	return <span>Tx Status: {String(status)}</span>
}
```

## Vue Example

```vue
<script setup lang="ts">
import { useSelector } from '@lumina-dex/sdk/vue'
const props = defineProps<{ Dex: any }>()
const lid = useSelector(props.Dex, s => s.context.dex.swap.transactionLid)
const txActor = useSelector(props.Dex, s => lid ? s.context.transactions[lid] : undefined)
const status = useSelector(txActor, a => a?.getSnapshot().value)
const result = useSelector(txActor, a => a?.getSnapshot().context.result)
</script>
<template>
  <div v-if="lid && txActor">
    <a v-if="status==='DONE' && result && !('message' in result)" :href="result.url" target="_blank">View Tx</a>
    <span v-else>Tx Status: {{ status }}</span>
  </div>
</template>
```

## Pool Creation

Server-side pool creation uses a `createPoolMachine` which, after proof generation and user signature, invokes a transaction machine. Track pool jobs under `dex.context.dex.createPool.pools` and then read the resulting `transactionLid` from the corresponding DEX action context.

## Error Handling

If a transaction fails or the wallet rejects signing, the `result` will be an `Error` in the transaction actor context. Handle gracefully:

```ts
if (txState.value === "DONE" && txState.context.result instanceof Error) {
	console.error("Tx failed:", txState.context.result)
}
```

## Storage Details

- Persistence uses IndexedDB via `idb`
- Keyed by a hash of the original transaction JSON
- Confirmed flag updated after inclusion (Mina networks)

No manual setup required—this is automatic.

## Summary

Use `transactionLid` + `context.transactions` for all post-action transaction UX. This provides a robust, future-proof foundation for tracking and displaying transaction progress.
