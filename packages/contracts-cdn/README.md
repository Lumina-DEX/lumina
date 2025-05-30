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
2. Re Deploy the `lumina-tokens` service with `bun run deploy:prod` using the exact deployed SDK version in `deno.json`. _If the Pool Factory has not been updated, you can skip this step._
3. Make sure the 3 compile scripts in `packages/contracts-cdn` are up to date with the latest changes in contracts and sdk
4. Build contracts locally in `packages/contracts` with `bun run build` and Test that its working by deleting the `cdn/cache`directory and running `compile-and-create.sh`
5. Merge the PR. If there's no existing release PR, you should trigger a release by bumping the sdk version or manually triggering the changeset GA.
6. Merge the release PR.

_Manually reset the network if the PoolFactory has been updated and the token data is wrong (see can reset network state in api.spec.ts)_
