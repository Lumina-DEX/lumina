# Lumina MVP

First version of LuminaDex, allows you to create Mina/Fungible Token pools on Mina.
Zeko support both Mina/Token and Token/Token pools.

Adding/withdrawing liquidities, or swapping, each action requires only one transaction.

These actions can be performed concurrently with other users.

## Licensing

Business Source License 1.1

Licensor: Lumina Labs

## Test

```
cd packages/contracts
pnpm run build
pnpm run test
```

## Lastest Improvment

Pool factory, to create only one pool by pair, avoids liquidity fragmentation.

0.05% for Lumina as creator and maintainer of the protocol

0.25% for liquidity providers

between 0-0.10% for frontend operators

## Testnet address

TOKA="B62qn71xMXqLmAT83rXW3t7jmnEvezaCYbcnb9NWYz85GTs41VYGDha"\
FACTORY="B62qp6x4PfXbqhL3rWgshwkfS2sHTzPDYWBmgTxBsBGSPihJaNEEUXv"
POOL_TOKA_MINA="B62qjWz1KNji4cf7ok2dur9iLPPrmy1DrpwhXP3iUbzCLjAWi6f2eHy"
