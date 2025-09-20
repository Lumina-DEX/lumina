# Create Pool Machine (Overview)

High‑level actor that drives creation of a new liquidity pool: request a remote proof job, wait until the zk transaction is produced, pass it to a transaction machine, then confirm with the backend.

## Lifecycle in plain terms

1. Start / Resume: Locate or create a server job for the token pair.
2. Proving: Wait while the server constructs/proves the transaction.
3. Transaction: Invoke a `transactionMachine` to sign & broadcast.
4. Confirm: Notify backend the on‑chain tx was sent (and, for Mina, included).
5. Done: Pool public key + transaction result available in context.

Minimal mental model:

INIT → (job) → WAIT_FOR_PROOF → SIGN / SEND (child transaction) → CONFIRM → COMPLETED

## Access pattern

Active pool creations live under `Dex.context.dex.createPool.pools` keyed by `createPool-${network}-${user}-${tokenA}-${tokenB}`.

```ts
const pools = Dex.getSnapshot().context.dex.createPool.pools
for (const [id, ref] of Object.entries(pools)) {
	const snap = ref.getSnapshot()
	console.log(id, snap.value)
}
```

When the child transaction finishes, its `{ hash, url }` is stored at `snap.context.transaction` and (via shared id) also trackable in `Dex.context.transactions`.

## UI hints

Show a simple step indicator:

1. Preparing (INIT / finding job)
2. Proving
3. Signing
4. Broadcasting / Confirming
5. Completed (success / error)

Retry only after a terminal error state; otherwise let it proceed silently.

No manual cleanup needed—spawning and lifecycle are handled by the DEX machine.
