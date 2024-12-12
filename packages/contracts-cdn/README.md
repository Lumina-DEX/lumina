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
