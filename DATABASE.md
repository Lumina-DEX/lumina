# Database Specifications

To ensure database consistency with blockchain consistency, we have 2 mechanisms in place.
This mechanisms are not implemented in this service, but in the `contracts-cdn`.

## On confirm workflow

When a job is confirmed, we trigger a webhook to the `contracts-cdn` service, which start the `SyncPool` workflow.

1. Fetch all on-chain pools.
2. Check if the pool exists.
3. If it exists, update the status to `deployed` and refresh the CDN.
4. If it does not exist, retry up to 10 times (with 1 minute linear backoff), and update the status to `unconfirmed`.

## Daily Cleanup

Every day at midnight, a cron job runs to clean-up the Pool table.

1. Query for all `pending` and `confirmed` pools that are older than 24h.
2. If they exist on-chain, update their status to `deployed`
3. If they do not exist on-chain, update their status to `unconfirmed`
