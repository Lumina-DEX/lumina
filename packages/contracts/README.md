# Mina zkApp: Lumina Mvp

This template uses TypeScript.

## Contract addresses Zeko

Pool B62qjMfeNmu9KfbsmZfDJvNrBtteJAx9GcJ3B2mgtjLrzqarZiA43fF
TokenA B62qjZ1W2ybx2AYLYUyjPMoBT6Kn6CPPjAN2WWSRKH46uGgn2SgeNtK (Zeko and mina testnet)
TokenB B62qkSPqDx2TazHm6PxdqXSb7DiVfvt7UM17ykK3xb3VSPjKLPbYWdb (Zeko and mina testnet)
Balancer B62qqroHK8ug1uvmMA6xP6bEa5dbifU2ZMczpbZjNRrpmTxmi3xeFSD (Zeko and mina testnet)
ShowBalance B62qram7TfkH5r99zsWtd2wgj55fHM9fU7yZCE9G94h3knUvzxU3Q6Y (Zeko and mina testnet)
DexToken B62qkc4LF9Axhv5xCVn1WfHhR1iK9S7tjEbaKGtYtBTxU1KzkQQ8pLp (Mina)
TokenStandard B62qqSkmjeUQHhHbCERLwFnwizVW92XU2kcqqdYy2CuBTvp5gaqR8TP (Mina)
PoolMina B62qmDWWfMN4cGLFabeqAiYdE27C89EDxuHVovUGRiABeC7Ed8Kx17T (Mina)

### Generate key

(usefull for test)

```
node src/key.js
```

### GraphQL

https://api.minascan.io/node/devnet/v1/graphql
https://devnet.zeko.io/graphql

### Get Balance

Update graphql, account and token in src/deploy/getBalance.ts

```
npm run build
node build/src/deploy/getBalance.js
```

## How to build

```sh
npm run build
```

## How to run tests

```sh
npm run test
npm run testw # watch mode
```

## How to run coverage

```sh
npm run coverage
```

## License

[Apache-2.0](LICENSE)
