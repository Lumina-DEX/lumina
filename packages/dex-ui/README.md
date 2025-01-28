# Lumina MVP

First iteration of LuminaDex, allows you to create Mina/Fungible Token pools.

Adding/withdrawing liquidities, or swapping, each action requires only one transaction.

These actions can be performed concurrently with other users.

## Licensing

Business Source License 1.1

Licensor: Lumina Labs

## Test

```
cd contracts
npm run testmina
```

docker run -it --env NETWORK_TYPE="single-node" --env PROOF_LEVEL="full" --env LOG_LEVEL="Info" -p 3085:3085 -p 5433:5432 -p 8080:8080 -p 8181:8181 -p 8282:8282 o1labs/mina-local-network:compatible-latest-devnet

## Lastest Improvment

Pool factory, to create only one pool by pair, avoids liquidity fragmentation.

0.05% for Lumina as creator and maintainer of the protocol

0.25% for liquidity providers

between 0-0.15% for frontend operators

## Testnet address

TOKA="B62qn71xMXqLmAT83rXW3t7jmnEvezaCYbcnb9NWYz85GTs41VYGDha"\
TOKB="B62qqbQt3E4re5VLpgsQnhDj4R4bYvhXLds1dK9nRiUBRF9wweFxadW"\
TOKEN_ADMIN="B62qkQVZ9eokTmHcWtwXimhL43mw9LwzBfAx1jCschRp3SsJ9ENKDZN"\
FACTORY="B62qo8GFnNj3JeYq6iUUXeHq5bqJqPQmT5C2cTU7YoVc4mgiC8XEjHd"\
// not deployed yet POOL_TOKA_TOKB="B62qoctdst7JCvZ1qNRU3Ws8SgzAHgXNZcT5yZQLQ19gedsGTYJpryH"\
POOL_TOKA_MINA="B62qq47Pu4rmDAs86jRLcwDRD3XDheJU9dmRq5pfSpfWYi2aY7b1KNH"\
// not deployed yet POOL_ETH_MINA="B62qozByN9o4U82xcKvY2kTJJhnHf9cSFi2GPhbmcvgCQ4sd7U7d1Ut"\
FAUCET="B62qkUoCRMDTndXpGan1g7iVPAGnXASVT3fqV8QnGqJ5KNiRhnS8nyq"\
OWNER="B62qjabhmpW9yfLbvUz87BR1u462RRqFfXgoapz8X3Fw8uaXJqGG8WH"\
PROTOCOL="B62qpBKidvBH2YEWCwwkzLMFoBWa2fZknj6K5YWdqF5wAiLgoTExh42"\
DELEGATOR="B62qmibKL59uByUjbWmXYBPLhhs5GbUYSBWGThsEqkHkdNcU7FCdfYy"
