# Transaction Machine (Overview)

High‑level actor that turns a prepared transaction JSON into a stable result `{ hash, url }` (or an `Error`). It is spawned automatically after any DEX operation that produces a transaction (swap, add/remove liquidity, deploy, claim, etc.).

## What it does

1. Resume: If an unconfirmed matching transaction exists locally, continue tracking it.
2. Sign: Ask the connected wallet to sign (no sending from the wallet popup).
3. Send: Broadcast through the worker.
4. Wait (Mina only): Poll until included. Zeko skips this step.
5. Finish: Expose final `{ hash, url }` via the child actor.

## Minimal state model

RESUMING → SIGNING → SENDING → (WAITING) → DONE

(`WAITING` only appears on Mina networks.)

## Access pattern

1. Grab the logical id (`transactionLid`) stored on the relevant DEX action (e.g. `dex.swap.transactionLid`).
2. Look up the child: `const txActor = Dex.context.transactions[lid]`.
3. Read progress: `txActor.getSnapshot().value` and final result from `txActor.getSnapshot().context.result` once in `DONE`.

```ts
const { transactions, dex } = Dex.getSnapshot().context
const lid = dex.swap.transactionLid
if (lid) {
	const tx = transactions[lid].getSnapshot()
	console.log(tx.value, tx.context.result)
}
```

## When to show status to users

Show a concise label per phase:

- RESUMING: "Checking pending transaction"
- SIGNING: "Awaiting signature"
- SENDING: "Broadcasting"
- WAITING: "Confirming on-chain" (Mina only)
- DONE: success or failure (inspect `result`).

## Error / retry

Any failure leads to `DONE` with an `Error`. Let users retry by re‑triggering the original DEX action (generates a new transaction id) or ignore if the failure happened after send but before inclusion (the resume step will pick it up next time).

Nothing else is required—creation, persistence and cleanup are internal.
