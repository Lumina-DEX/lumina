# Contracts CDN

There is no CI script, so this must be manually deployed after contracts are deployed.

## Durable Object Database

The durable object database is not distributed and exists in a single location. However we can add read replicas if we need :

1. Spawn several durable objects at different locations with location hints
2. Sync their state.
3. Route users to the nearest durable object
4. Write from the main objects and to the read replicas.
