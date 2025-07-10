# Lumina Order Book

Limit order

## Licensing

Modified Reciprocal Public License 1.50

Licensor: Lumina Labs

## Test

```
cd packages/contracts
pnpm run build
pnpm run test
```

## Rules

Limit order only
Authorize partial execution
External players can fill, collect a fee from users, including a share of leftover spread
No prioritization of orders
