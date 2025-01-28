# Contracts CDN

There is no CI script, so this must be manually deployed after contracts are deployed.

## Durable Object Database

The durable object database is not distributed and exists in a single location. However we can add read replicas if we need :

1. Spawn several durable objects at different locations with location hints
2. Seed them with the blockchain state.
3. Route users to the nearest durable object.
4. Write to the closest do.
5. Propagate writes with a workflow.

### Test Cron triggers

```
npx wrangler dev --test-scheduled

curl "http://localhost:8787/__scheduled?cron=*%2F3+*+*+*+*"
```

## How to deploy when contracts are updated

1. Deploy the SDK with the new contract addresses.
2. Re Deploy the `lumina-tokens` service with `bun run deploy:prod` using the exact deployed SDK version in `deno.json`.

3. Build contracts locally in `packages/contracts` with `bun run build`
4. Delete the cache directory in `packages/contracts-cdn`, then rebuild with `bun run cache:create` until the lagrange files are generated
5. Deploy the `contracts-cdn` service with `bun run deploy`
6. Reset the network if the PoolFactory has been updated and the token data is wrong (see can reset network state in api.spec.ts)
