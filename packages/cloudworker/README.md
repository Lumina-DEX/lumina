# zkCloudWorker Worker code example

An example of a worker running a ZkProgram and SmartContract that

- Deploys the worker code, including ZkProgram and SmartContract to the cloud using zkCloudWorker CLI tool.
- Compile the ZkProgram and SmartContract in the cloud
- Creates, proves and sends transactions to the network
- Uses zkCloudWorker API to send requests and jobs to the zkCloudWorker
- Uses zkCloudWorker API inside the cloud instance
- Creates recursive proofs
- Verifies recursive proofs
- Uses recursive proofs as arguments in the SmartContract methods
- Uses deployers provided by zkCloudWorker to send transactions to Devnet and Zeko

## Contract address

B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD

### Devnet

https://minascan.io/devnet/account/B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD/txs?type=zk-acc

### Zeko

https://zekoscan.io/devnet/account/B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD/txs?type=zk-acc

## Installation

You need to install `node (v20+)` and `git` and clone this repo

```
git clone https://github.com/zkcloudworker/worker-example
cd worker-example
```

## Change the name and author in package.json

You will see those names in https://silvascan.io

## Deploy

Install zkCloudWorker CLI tool

```sh
npm install -g zkcloudworker-cli
```

Get the JWT key at https://minarollupscan.com/jwt and write it to the config:

```sh
zkcw config --jwt eyJhbGciOiJIUz.... (replace with your JWT key)
```

Deploy this repo to the zkCloudWorker cloud (increase the version number in package.json before each deployment)

```sh
zkcw deploy
```

```
worker-example % zkcw deploy
zkCloudWorker CLI tool v0.3.15 (c) DFST 2024 www.zkcloudworker.com

Deploying the repo to the cloud... {}
Creating zip file...
Uploading zip file to zkCloudWorker's cloud storage...
Installing repo, this may take a few minutes...
SUCCESS: Deployment completed
deployed: 1:14.839 (m:ss.mmm)
```

or, in verbose mode

```sh
zkcw deploy -v
```

## Tests

### Run local tests

```sh
yarn local
```

### Run tests on Lightnet

```sh
zk lightnet start
zk lightnet explorer
yarn lightnet.deploy
yarn lightnet.run
```

### Run tests on Devnet

```sh
yarn devnet.run
```

### Run tests on Zeko

```sh
yarn zeko.run
```

Faucet: https://zeko.io/faucet

Explorer: https://zekoscan.io/devnet/home

## Logs

### Local test

```
worker-example % yarn local
[11:59:58 PM] Preparing data...
[11:59:58 PM] prepared data: 0.035ms
[11:59:58 PM] RSS memory initializing blockchain: 332 MB
[11:59:58 PM] local chain: local
[11:59:58 PM] contract address: B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD
[11:59:58 PM] sender: B62qp7AAYey5ohcoxjTo9Kruok3TQAyzW2yPzNmGdixkd3U4kzxdAre
[11:59:58 PM] Sender balance: 1000
[11:59:58 PM] RSS memory blockchain initialized: 454 MB, changed by 122 MB
[11:59:58 PM] Analyzing contracts methods...
[11:59:58 PM] methods analyzed: 334.825ms
[11:59:58 PM] method's total size for a AddProgram is 40 rows (0.06% of max 65536 rows)
[11:59:58 PM] method's total size for a AddContract is 2173 rows (3.32% of max 65536 rows)
[11:59:58 PM] addOne rows: 1091
[11:59:58 PM] addMany rows: 1082
[11:59:58 PM] Compiling contracts...
[12:00:07 AM] AddProgram compiled: 8.246s
[12:00:11 AM] AddContract compiled: 4.293s
[12:00:11 AM] compiled: 12.539s
[12:00:11 AM] AddContract verification key 6725742237764094284054294971180663014307059546463179012897722297980916229319
[12:00:11 AM] AddProgram verification key 22885017068934378368990068626190381687073682869863893429730422349565715395401
[12:00:11 AM] RSS memory compiled: 1613 MB, changed by 1159 MB
[12:00:11 AM] Deploying contract...
[12:00:11 AM] deploy tx sent: hash: 5JuYbgqgh9tzQxsjw9sqaiDqJ4pKZ4o84Lt6YBsd6A3QCptBep2J status: pending
[12:00:11 AM] Waiting for tx inclusion...
[12:00:11 AM] deploy tx included into block: hash: 5JuYbgqgh9tzQxsjw9sqaiDqJ4pKZ4o84Lt6YBsd6A3QCptBep2J status: included
[12:00:11 AM] RSS memory deployed: 1613 MB, changed by 0 MB
[12:00:11 AM] Sending one tx 1/1...
[12:00:11 AM] isMany: false
[12:00:11 AM] Address B62qmMRVYE38xVWXf1hJ42cTkTjBAkAsrJGtYfrmrje3vxtgMsxjEYU
[12:00:11 AM] Sending tx...
[12:00:11 AM] cloud deployer: EKELGyHuSemycGNnaJkULfTWSdWtzDPaW1krLdqB3YDYNFAQV5vJ
[12:00:11 AM] sender: B62qp7AAYey5ohcoxjTo9Kruok3TQAyzW2yPzNmGdixkd3U4kzxdAre
[12:00:11 AM] Sender balance: 998.8
[12:00:18 AM] compiled AddProgram: 6.590s
[12:00:22 AM] compiled AddContract: 4.313s
[12:00:22 AM] compiled: 10.903s
[12:00:22 AM] addValue: { value: '264', limit: '1000' }
[12:00:31 AM] prepared tx: 20.057s
[12:00:32 AM] one tx sent: hash: 5JtjphrjvwfUxTpJaE3AfaP1oA8XnMHmzjq4rF6f3G5pn1CCmdEw status: pending
[12:00:32 AM] one tx included into block: hash: 5JtjphrjvwfUxTpJaE3AfaP1oA8XnMHmzjq4rF6f3G5pn1CCmdEw status: included
[12:00:32 AM] LocalCloud: releaseDeployer {
  publicKey: 'B62qp7AAYey5ohcoxjTo9Kruok3TQAyzW2yPzNmGdixkd3U4kzxdAre',
  txsHashes: [ '5JtjphrjvwfUxTpJaE3AfaP1oA8XnMHmzjq4rF6f3G5pn1CCmdEw' ]
}
[12:00:32 AM] answer: {
  success: true,
  jobId: 'local.1715547611562.5lYwKCLDjid8S25EnQuaz35aLJzjwhB1',
  result: undefined,
  error: undefined
}
[12:00:32 AM] One result: 5JtjphrjvwfUxTpJaE3AfaP1oA8XnMHmzjq4rF6f3G5pn1CCmdEw
[12:00:32 AM] One txs sent: 20.829s
[12:00:32 AM] RSS memory One txs sent: 1994 MB, changed by 381 MB
[12:00:32 AM] Sending many tx 1/1...
[12:00:32 AM] compiled: 0.001ms
[12:00:41 AM] proof created: 9.341s
[12:00:41 AM] compiled: 0.003ms
[12:00:50 AM] proof created: 8.615s
[12:00:50 AM] compiled: 0.004ms
[12:00:59 AM] proof created: 8.875s
[12:00:59 AM] compiled: 0.003ms
[12:01:17 AM] proof merged: 18.180s
[12:01:17 AM] compiled: 0.005ms
[12:01:35 AM] proof merged: 18.161s
[12:01:35 AM] proof answer: {
  success: true,
  jobId: 'local.1715547632389.mevfTeOhNZl6iRwKjKimt2KfIqzOx38W',
  error: undefined
}
[12:01:35 AM] compiled: 0.003ms
[12:01:36 AM] verifyAnswer: {
  success: true,
  jobId: 'local.1715547695669.1BU0PFrFN0ok2j7lr2itwLKhcABzY3WW',
  result: undefined,
  error: undefined
}
[12:01:36 AM] Verify result: Proof verified
[12:01:36 AM] isMany: true
[12:01:36 AM] Address B62qkMiw4PxKSPDMjLwP29UJJ1mvcTtAfwuVpDy94aeGrj6AmHLeUu9
[12:01:36 AM] Sending tx...
[12:01:36 AM] cloud deployer: EKELGyHuSemycGNnaJkULfTWSdWtzDPaW1krLdqB3YDYNFAQV5vJ
[12:01:36 AM] sender: B62qp7AAYey5ohcoxjTo9Kruok3TQAyzW2yPzNmGdixkd3U4kzxdAre
[12:01:36 AM] Sender balance: 997.6
[12:01:36 AM] compiled: 0.003ms
[12:01:48 AM] prepared tx: 12.487s
[12:01:49 AM] many tx sent: hash: 5JunagWPJM2yeLJ3jW8BnnESh6GhSUmNEkG6H78iW1EewvNgMYgG status: pending
[12:01:49 AM] one tx included into block: hash: 5JunagWPJM2yeLJ3jW8BnnESh6GhSUmNEkG6H78iW1EewvNgMYgG status: included
[12:01:49 AM] LocalCloud: releaseDeployer {
  publicKey: 'B62qp7AAYey5ohcoxjTo9Kruok3TQAyzW2yPzNmGdixkd3U4kzxdAre',
  txsHashes: [ '5JunagWPJM2yeLJ3jW8BnnESh6GhSUmNEkG6H78iW1EewvNgMYgG' ]
}
[12:01:49 AM] answer: {
  success: true,
  jobId: 'local.1715547696223.rH7jLvjbJGjhGQ59wK3DyzY8A2lO3hgA',
  result: undefined,
  error: undefined
}
[12:01:49 AM] Many result: 5JunagWPJM2yeLJ3jW8BnnESh6GhSUmNEkG6H78iW1EewvNgMYgG
[12:01:49 AM] Many txs sent: 1:17.058 (m:ss.mmm)
[12:01:49 AM] RSS memory Many txs sent: 3100 MB, changed by 1106 MB
 PASS  tests/contract.test.ts
  Add Worker
    ✓ should prepare data (12 ms)
    ✓ should initialize blockchain (340 ms)
    ✓ should compile contract (12875 ms)
    ✓ should deploy contract (174 ms)
    ✓ should send one transactions (20829 ms)
    ✓ should send transactions with recursive proofs (77059 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        112.276 s, estimated 344 s
Ran all test suites.
```

### Lightnet test log

deploy:

```
worker-example % yarn lightnet.deploy
[12:05:28 AM] Preparing data...
[12:05:28 AM] prepared data: 0.037ms
[12:05:28 AM] RSS memory initializing blockchain: 340 MB
[12:05:28 AM] local chain: lightnet
[12:05:28 AM] contract address: B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD
[12:05:28 AM] sender: B62qkciop8ziSv8iyw4NxJcfL7aoNyMeEePC6qhaee9Bas1jQd88zYK
[12:05:28 AM] Sender balance: 1550
[12:05:28 AM] RSS memory blockchain initialized: 349 MB, changed by 9 MB
[12:05:28 AM] Analyzing contracts methods...
[12:05:29 AM] methods analyzed: 707.964ms
[12:05:29 AM] method's total size for a AddProgram is 40 rows (0.06% of max 65536 rows)
[12:05:29 AM] method's total size for a AddContract is 2173 rows (3.32% of max 65536 rows)
[12:05:29 AM] addOne rows: 1091
[12:05:29 AM] addMany rows: 1082
[12:05:29 AM] Compiling contracts...
[12:05:37 AM] AddProgram compiled: 8.363s
[12:05:42 AM] AddContract compiled: 4.344s
[12:05:42 AM] compiled: 12.707s
[12:05:42 AM] AddContract verification key 6725742237764094284054294971180663014307059546463179012897722297980916229319
[12:05:42 AM] AddProgram verification key 22885017068934378368990068626190381687073682869863893429730422349565715395401
[12:05:42 AM] RSS memory compiled: 1041 MB, changed by 692 MB
[12:05:42 AM] Deploying contract...
[12:05:42 AM] deploy tx sent: hash: 5JuuxuW6tKvxkyAstLea4chMPmYcS6nZkShYAmcsHM3urFTngyT3 status: pending
[12:05:42 AM] Waiting for tx inclusion...
[12:06:02 AM] deploy tx included into block: hash: 5JuuxuW6tKvxkyAstLea4chMPmYcS6nZkShYAmcsHM3urFTngyT3 status: included
[12:06:12 AM] RSS memory deployed: 845 MB, changed by -196 MB
 PASS  tests/contract.test.ts
  Add Worker
    ✓ should prepare data (13 ms)
    ✓ should initialize blockchain (73 ms)
    ✓ should compile contract (13415 ms)
    ✓ should deploy contract (30838 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        45.46 s, estimated 113 s
Ran all test suites.
```

run:

```
worker-example % yarn lightnet.run
[12:07:20 AM] Preparing data...
[12:07:20 AM] prepared data: 0.03ms
[12:07:20 AM] RSS memory initializing blockchain: 313 MB
[12:07:20 AM] local chain: lightnet
[12:07:20 AM] contract address: B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD
[12:07:20 AM] sender: B62qoSd2NaFHdjyjLjx1Tb8S6DDhgncwDTzQqGKb1UiKocKhegYgELV
[12:07:20 AM] Sender balance: 1550
[12:07:20 AM] RSS memory blockchain initialized: 347 MB, changed by 34 MB
[12:07:20 AM] Sending one tx 1/1...
[12:07:20 AM] isMany: false
[12:07:20 AM] Address B62qkWm2VyrV9Wxw8eM5zD3KiE4KX6snko6T2phDYsGMiFJkWwqKRKe
[12:07:20 AM] Sending tx...
[12:07:20 AM] cloud deployer: EKDiRPpNX1K393UX9nrGGEy18QtuawdGVS5nLMf5yzP8cBTxrMy8
[12:07:20 AM] sender: B62qoSd2NaFHdjyjLjx1Tb8S6DDhgncwDTzQqGKb1UiKocKhegYgELV
[12:07:20 AM] Sender balance: 1550
[12:07:29 AM] compiled AddProgram: 8.558s
[12:07:33 AM] compiled AddContract: 4.439s
[12:07:33 AM] compiled: 12.997s
[12:07:33 AM] addValue: { value: '18', limit: '1000' }
[12:07:41 AM] prepared tx: 20.772s
[12:07:41 AM] one tx sent: hash: 5JtoogxQRoUF4orLJSm6kAFwZDuxJ19Hua6RE2hFFPCXGaZWXm99 status: pending
[12:08:01 AM] one tx included into block: hash: 5JtoogxQRoUF4orLJSm6kAFwZDuxJ19Hua6RE2hFFPCXGaZWXm99 status: included
[12:08:01 AM] LocalCloud: releaseDeployer {
  publicKey: 'B62qoSd2NaFHdjyjLjx1Tb8S6DDhgncwDTzQqGKb1UiKocKhegYgELV',
  txsHashes: [ '5JtoogxQRoUF4orLJSm6kAFwZDuxJ19Hua6RE2hFFPCXGaZWXm99' ]
}
[12:08:01 AM] answer: {
  success: true,
  jobId: 'local.1715548040933.73EDr5tk9GXHhKKsKwpr0gmQpdljNmDA',
  result: undefined,
  error: undefined
}
[12:08:01 AM] One result: 5JtoogxQRoUF4orLJSm6kAFwZDuxJ19Hua6RE2hFFPCXGaZWXm99
[12:08:01 AM] One txs sent: 40.964s
[12:08:01 AM] RSS memory One txs sent: 1322 MB, changed by 975 MB
[12:08:01 AM] Sending many tx 1/1...
[12:08:01 AM] compiled: 0.004ms
[12:08:09 AM] proof created: 8.054s
[12:08:10 AM] compiled: 0.011ms
[12:08:17 AM] proof created: 7.401s
[12:08:17 AM] compiled: 0.003ms
[12:08:24 AM] proof created: 7.294s
[12:08:24 AM] compiled: 0.003ms
[12:08:41 AM] proof merged: 16.569s
[12:08:41 AM] compiled: 0.003ms
[12:08:57 AM] proof merged: 15.654s
[12:08:57 AM] proof answer: {
  success: true,
  jobId: 'local.1715548081928.Kzg1JamacQ4jWIFxmDlWQkcIvucMpPcS',
  error: undefined
}
[12:08:57 AM] compiled: 0.003ms
[12:08:57 AM] verifyAnswer: {
  success: true,
  jobId: 'local.1715548137038.kDBt0O7gl14ZCf1QB7GOsK5wRzxYwatX',
  result: undefined,
  error: undefined
}
[12:08:57 AM] Verify result: Proof verified
[12:08:57 AM] isMany: true
[12:08:57 AM] Address B62qrpyoHVcPKZoAhyoi2jHgLWdWQ9D9BqyHDh5FeALd8RHPy9CBprH
[12:08:57 AM] Sending tx...
[12:08:57 AM] cloud deployer: EKDiRPpNX1K393UX9nrGGEy18QtuawdGVS5nLMf5yzP8cBTxrMy8
[12:08:57 AM] sender: B62qoSd2NaFHdjyjLjx1Tb8S6DDhgncwDTzQqGKb1UiKocKhegYgELV
[12:08:57 AM] Sender balance: 1548.8
[12:08:57 AM] compiled: 0.004ms
[12:09:08 AM] prepared tx: 11.210s
[12:09:08 AM] many tx sent: hash: 5JurztcaBHn9jxo5cBDVBGuw5Nw31ULz5gw1mKSV9uv6sNCzrCui status: pending
[12:09:28 AM] one tx included into block: hash: 5JurztcaBHn9jxo5cBDVBGuw5Nw31ULz5gw1mKSV9uv6sNCzrCui status: included
[12:09:28 AM] LocalCloud: releaseDeployer {
  publicKey: 'B62qoSd2NaFHdjyjLjx1Tb8S6DDhgncwDTzQqGKb1UiKocKhegYgELV',
  txsHashes: [ '5JurztcaBHn9jxo5cBDVBGuw5Nw31ULz5gw1mKSV9uv6sNCzrCui' ]
}
[12:09:28 AM] answer: {
  success: true,
  jobId: 'local.1715548137566.dGZrkCA8VysGnKeEKFFrX0pzbVICSY44',
  result: undefined,
  error: undefined
}
[12:09:28 AM] Many result: 5JurztcaBHn9jxo5cBDVBGuw5Nw31ULz5gw1mKSV9uv6sNCzrCui
[12:09:28 AM] Many txs sent: 1:26.958 (m:ss.mmm)
[12:09:28 AM] RSS memory Many txs sent: 2194 MB, changed by 872 MB
 PASS  tests/contract.test.ts
  Add Worker
    ✓ should prepare data (12 ms)
    ✓ should initialize blockchain (69 ms)
    ✓ should send one transactions (40987 ms)
    ✓ should send transactions with recursive proofs (86979 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        128.892 s
Ran all test suites.
```

### Devnet test log

```
worker-example % yarn devnet.run
[12:18:11 AM] Preparing data...
[12:18:11 AM] prepared data: 0.035ms
[12:18:11 AM] RSS memory initializing blockchain: 324 MB
[12:18:11 AM] non-local chain: devnet
[12:18:11 AM] contract address: B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD
[12:18:11 AM] sender: B62qrvVL5oJWT8K4ijnq83V3MYHv95jhrJ2T3X56GL7nfowNFvcDFST
[12:18:12 AM] Sender balance: 284.6
[12:18:12 AM] RSS memory blockchain initialized: 340 MB, changed by 16 MB
[12:18:12 AM] Sending one tx 1/1...
[12:18:13 AM] answer: {
  success: true,
  jobId: '6459034946.1715548692638.ZDvFXvYrEXPldPzYvQt6udqgxd7Ntlqa',
  result: undefined,
  error: undefined
}
[12:18:24 AM] 2024-05-12T21:18:12.739Z	INFO	worker {
  command: 'execute',
  id: '6459034946',
  jobId: '6459034946.1715548692638.ZDvFXvYrEXPldPzYvQt6udqgxd7Ntlqa',
  developer: 'DFST',
  repo: 'worker-example',
  args: '{"contractAddress":"B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD","isMany":false,"addValue":"C._P2d4jlwkgiJpIHNSqlkLuH5cpA0Wcmkuw3JYdmupK.BJ.oP"}'
}

[12:18:24 AM] 2024-05-12T21:18:12.769Z	INFO	zkCloudWorker Execute start: {
  command: 'execute',
  developer: 'DFST',
  repo: 'worker-example',
  id: '6459034946',
  jobId: '6459034946.1715548692638.ZDvFXvYrEXPldPzYvQt6udqgxd7Ntlqa',
  job: {
    metadata: 'one',
    logStreams: [],
    task: 'one',
    maxAttempts: 0,
    args: '{"contractAddress":"B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD","isMany":false,"addValue":"C._P2d4jlwkgiJpIHNSqlkLuH5cpA0Wcmkuw3JYdmupK.BJ.oP"}',
    timeCreated: 1715548692638,
    timeCreatedString: '2024-05-12T21:18:12.638Z',
    jobId: '6459034946.1715548692638.ZDvFXvYrEXPldPzYvQt6udqgxd7Ntlqa',
    repo: 'worker-example',
    developer: 'DFST',
    chain: 'devnet',
    txNumber: 1,
    jobStatus: 'created',
    id: '6459034946'
  }
}

[12:18:24 AM] 2024-05-12T21:18:12.770Z	INFO	RSS memory start: 3989 MB, changed by 0 MB

[12:18:24 AM] 2024-05-12T21:18:12.770Z	INFO	CloudWorker: constructor {
  id: '6459034946',
  jobId: '6459034946.1715548692638.ZDvFXvYrEXPldPzYvQt6udqgxd7Ntlqa',
  developer: 'DFST',
  repo: 'worker-example',
  task: 'one',
  taskId: undefined,
  userId: undefined,
  args: '{"contractAddress":"B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD","isMany":false,"addValue":"C._P2d4jlwkgiJpIHNSqlkLuH5cpA0Wcmkuw3JYdmupK.BJ.oP"}',
  metadata: 'one',
  cache: '/mnt/efs/cache',
  chain: 'devnet',
  webhook: undefined
}

[12:18:24 AM] 2024-05-12T21:18:12.791Z	INFO	getWorker result: {
  repo: 'worker-example',
  size: 10815,
  version: '0.2.2',
  developer: 'DFST',
  countUsed: 6,
  timeUsed: 1715548612147,
  timeDeployed: 1715547885099,
  id: '6459034946',
  protected: false
}

[12:18:24 AM] 2024-05-12T21:18:12.791Z	INFO	Running worker { developer: 'DFST', repo: 'worker-example', version: '0.2.2' }

[12:18:24 AM] 2024-05-12T21:18:12.791Z	INFO	starting worker example version 0.2.2 on chain devnet

[12:18:24 AM] 2024-05-12T21:18:12.797Z	INFO	isMany: false

[12:18:24 AM] 2024-05-12T21:18:12.800Z	INFO	Address B62qj7RuQhjBBzpVzMcfvCBq23yR1Ej38Q2L4fg9Yjcfoy9JaBGgcsX

[12:18:24 AM] 2024-05-12T21:18:12.801Z	INFO	Sending tx...

[12:18:24 AM] 2024-05-12T21:18:13.975Z	INFO	getDeployer: providing deployer B62qkZazA9uzC1Btdoun5uK5piU85o2WoVmdT9rNDYVYFcDF3JZhR9u with balance 297

[12:18:24 AM] 2024-05-12T21:18:13.975Z	INFO	cloud deployer: EKFWifX3WTDZcYQbtWMppqgWrzYuZwNELsSBhoMMZPSZ7BQU8vg4

[12:18:24 AM] 2024-05-12T21:18:14.350Z	INFO	sender: B62qkZazA9uzC1Btdoun5uK5piU85o2WoVmdT9rNDYVYFcDF3JZhR9u

[12:18:24 AM] 2024-05-12T21:18:14.470Z	INFO	Sender balance: 297.2

[12:18:24 AM] 2024-05-12T21:18:14.470Z	INFO	compiled: 0.009ms

[12:18:24 AM] 2024-05-12T21:18:14.471Z	INFO	addValue: { value: '577', limit: '1000' }

[12:18:55 AM] 2024-05-12T21:18:37.567Z	INFO	prepared tx: 24.766s

[12:18:55 AM] 2024-05-12T21:18:38.056Z	INFO	one tx sent: hash: 5JuoFRF8NZ1w3DwYCtzvcoqHD7MwN7BW2mzLYoaNaWzNGvhLJGSz status: pending

[12:18:55 AM] 2024-05-12T21:18:38.056Z	INFO	Cloud: releaseDeployer {
  publicKey: 'B62qkZazA9uzC1Btdoun5uK5piU85o2WoVmdT9rNDYVYFcDF3JZhR9u',
  txsHashes: [ '5JuoFRF8NZ1w3DwYCtzvcoqHD7MwN7BW2mzLYoaNaWzNGvhLJGSz' ]
}

[12:18:55 AM] 2024-05-12T21:18:38.084Z	INFO	RSS memory finished: 4035 MB, changed by 46 MB

[12:18:55 AM] 2024-05-12T21:18:38.084Z	INFO	zkCloudWorker Execute Sync: 25.314s

[12:18:55 AM] 2024-05-12T21:18:38.109Z	INFO	zkCloudWorker Execute: 25.339s

[12:18:55 AM] REPORT RequestId: Duration: 25376.89 ms	Billed Duration: 25377 ms	Memory Size: 10240 MB	Max Memory Used: 4864 MB

[12:18:55 AM] One result: 5JuoFRF8NZ1w3DwYCtzvcoqHD7MwN7BW2mzLYoaNaWzNGvhLJGSz
[12:18:55 AM] One txs sent: 43.012s
[12:18:55 AM] RSS memory One txs sent: 324 MB, changed by -16 MB
[12:18:55 AM] Sending many tx 1/1...
[12:18:56 AM] proof answer: {
  success: true,
  jobId: '6459034946.1715548735620.lk5HThsUfzyHRRGe03wCuBXUFD8GDqS5',
  error: undefined
}
[12:19:06 AM] 2024-05-12T21:18:55.755Z	INFO	run {
  task: 'start',
  id: '6459034946',
  jobId: '6459034946.1715548735620.lk5HThsUfzyHRRGe03wCuBXUFD8GDqS5'
}

[12:19:06 AM] 2024-05-12T21:18:55.878Z	INFO	Sequencer: startJob: number of transactions: 3

[12:19:06 AM] 2024-05-12T21:18:55.961Z	INFO	Lambda call: step id: 8dbf5966-768b-4494-9dc1-a3fd433ee07d

[12:19:06 AM] 2024-05-12T21:18:56.497Z	INFO	Lambda call: step id: cbbd6f58-213f-4860-9758-64c4597a46cb

[12:19:06 AM] 2024-05-12T21:18:57.052Z	INFO	Lambda call: step id: 3d9dc391-14e6-476c-80c1-bdbf0459d3f8

[12:19:38 AM] 2024-05-12T21:19:27.667Z	INFO	Sequencer: run: results 3

[12:19:38 AM] 2024-05-12T21:19:28.953Z	INFO	Lambda call: step id: 111cac89-5df4-4650-a3e8-f0e30ce07a5b

[12:19:38 AM] 2024-05-12T21:19:29.453Z	INFO	Sequencer: run: started merging 2 proofs
step1 started in 172 ms, calculated in 21 sec,
step2 started in 114 ms, calculated in 21 sec

[12:20:40 AM] 2024-05-12T21:20:27.712Z	INFO	Sequencer: run: results 2

[12:20:40 AM] 2024-05-12T21:20:29.018Z	INFO	Lambda call: step id: c0563986-f541-4d4b-8256-1fe5b9d18785

[12:20:40 AM] 2024-05-12T21:20:29.519Z	INFO	Sequencer: run: started merging 3 proofs
step1 started in 179 ms, calculated in 53 sec,
step2 started in 133 ms, calculated in 23 sec

[12:21:32 AM] 2024-05-12T21:21:17.945Z	INFO	Sequencer: run: final result written

[12:21:32 AM] 2024-05-12T21:21:17.972Z	INFO	Sequencer: run: finished

[12:21:32 AM] REPORT RequestId: Duration: 142340.14 ms	Billed Duration: 142341 ms	Memory Size: 384 MB	Max Memory Used: 140 MB

[12:21:33 AM] verifyAnswer: {
  success: true,
  jobId: '6459034946.1715548892992.JS071U568vQ8DYNcBmxiFPIlMLLgWXTl',
  result: undefined,
  error: undefined
}
[12:21:44 AM] 2024-05-12T21:21:33.094Z	INFO	worker {
  command: 'execute',
  id: '6459034946',
  jobId: '6459034946.1715548892992.JS071U568vQ8DYNcBmxiFPIlMLLgWXTl',
  developer: 'DFST',
  repo: 'worker-example',
  args: '{"contractAddress":"B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD","proof":"{\\n  \\"publicInput\\": [],\\n  \\"publicOutput\\": [\\n    \\"866\\",\\n    \\"1000\\"\\n  ],\\n  \\"maxProofsVerified\\": 2,\\n  \\"proof\\": \\"KChzdGF0ZW1lbnQoKHByb29mX3N0YXRlKChkZWZlcnJlZF92YWx1ZXMoKHBsb25rKChhbHBoYSgoaW5uZXIoYWM1MTVkY2Q4NDg2MzM4MiBkZjliZWE1YzFiMTM2MTVjKSkpKShiZXRhKGQyMDhlYTkxMmU1MDY2Y2EgYzExMDFlMWE0NDYzZjdkNSkpKGdhbW1hKDhiNTA0ZGVmZDU2NzliOGMgN2U5OTU3OTFlZjcwZGFkZikpKHpldGEoKGlubmVyKGQwNmZmMzVhNWM1YmUyYmIgNzdkMjZkOGQxZDhhYTE2ZCkpKSkoam9pbnRfY29tYmluZXIoKSkoZmVhdHVyZV9mbGFncygocmFuZ2VfY2hlY2swIGZhbHNlKShyYW5nZV9jaGVjazEgZmFsc2UpKGZvcmVpZ25fZmllbGRfYWRkIGZhbHNlKShmb3JlaWduX2ZpZWxkX211bCBmYWxzZSkoeG9yIGZhbHNlKShyb3QgZmFsc2UpKGxvb2t1cCBmYWxzZSkocnVudGltZV90YWJsZXMgZmFsc2UpKSkpKShidWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgocHJlY2hhbGxlbmdlKChpbm5lcihmYWY3ZjQ0MDcwZWJlZTJhIDYwNDk3MDIzMGI4NTcwZGIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmYTcwNTBhMmE0MjYyNDFhIDVkMTAwMzI4YThkOGMyZDUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNGJmOGI2ZTJlMDA3MTU1IDdmZDBjNmY3ZTRkNzJkZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NThmMmMzMzc3NTA4NGNmIDJkMGE4NmExOWY5YmIwZDQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0MGM2NjRjMjk0MThlNjhiIDQ3MTVkZmUzYmE2NmQ4NGIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5ZGFlNmYxOGRkZGJlNTJkIDUxZjk0MmM1YjcwMDcwNjYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwYjZiZDM4N2QyZTQ3MTNlIDI2NGE1YTcyMTQ4MDA4MjQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjNmUxYmFjNmRjY2E3NTQyIDdjMTE5ZTA4MzU0YTU1ZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5N2ZlYWE2MTIzZmZlMWU3IGExZWQyNDJkNzY1MDg0NWQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNTQ0NjFjNzhhZmQzYTk5IGZkZWM1ZDgzMTg4ZDY2NDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkNjdlODE0NDMxYmFlOWY0IDUzMDI3MTY5NGUwMjIxYWIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmNjZhODEzNzM0MGI3OGNhIDEwNGU3YTI4ZTg3NGI4NzYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxOTUzOGQ5MDI3Yzk2ODVlIDdmOGUxOGVkNzk5MTVhNzEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjNTNjM2NhYTQ4OWE0MGIwIDIyMWQ3NGFkNTRlZWU5NmEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlNTEwMGY2NTE4MGI3MzI1IDI4NDY5YjI1OGU3NjE0Y2MpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NGE0ZDcwZTgwZmU4YmJlIGQ2NTE5YmIzNWZiY2IzYjQpKSkpKSkpKGJyYW5jaF9kYXRhKChwcm9vZnNfdmVyaWZpZWQgTjIpKGRvbWFpbl9sb2cyIlwwMTUiKSkpKSkoc3BvbmdlX2RpZ2VzdF9iZWZvcmVfZXZhbHVhdGlvbnMoNGRmNDcxMTYxMjM0ZTJhZCA3YTQ5ZmMxZmJmYzgyMWUzIGFmMDRhNTI0MjM0NTU5MWEgMzUwMDlkNDBjZGI3Y2NhNSkpKG1lc3NhZ2VzX2Zvcl9uZXh0X3dyYXBfcHJvb2YoKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnQoMHgyRTg5NkM1Q0Y0Qzg2RTk4OEM2RjIwMDZGQjU0MTczNDUxRDU4QTg0MTQ0QjRCODJENjRFNkQxOUNBNEM0ODI4IDB4MEU0RDM3MUU5ODI1OTNBRkYyNTlDRTU1QzkxQkJDQzkwNEJBRDUzOUQ0RTgxREQ5OTI2MjAyOEQ1MTU0QjQ5NikpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTUxZDYzMGI0Y2NkMGFmMCA5ZGFlMjhkYzhhMjc2YTFjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMDlmYzc3Zjc3MDBhOWY0MCAxNjM2ZWM4ZTZkNGZhMjZmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNDRiZWNkYzJhNzY3NjJmYSA4YTQ3MjhkZGRhNTgxNWY5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWRmZjM5ODkzOGNkNWI2OCBhNjA2OWE5MjEyZTJmMmVhKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoN2M5YWRiMDRlZjBhYzA0NSBkNDgyZDA4NmRmYzU3ZWFjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoOTVjMjUzYzIyODc0YjMxMyA2ODEyZTlkY2M4NDNlMGIzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMTcwYWRmOTJlMmNlMGYwYSBlOWNhYzA5Y2UzY2E2MGQ2KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMmZlMTg2MDhjZjliNmFlNiA3ODkzZDJhMzczNjA1NjNmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNGIxM2NmMGNjMTczMGNiMSA4NDVmZTNiMTJlNjU4NzcxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoOGFhOGQ0ODVkN2Y2OTBlYSBmNDIzMmZmNDM2MTg0YzVmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWExYmM2MjhjMTkxZTIzZSA3NTYzNTE3NjMwN2FkZTdiKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoM2IwY2ZiZDQ4MDU5MWNhOSBjOGNlNjA5YmUyYTZlMTM5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMmUxOTQ4Y2M4YTM2MTFiOCA0YWE0Njk3ZjU4MGIxMmEwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNTFmMTk1NzcyODljZGJmZiA2YmNlOWZhYmY4MmRmZDkzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMjFkNDMzN2Y0NzZlNGI5MCBlZDEzZGM3NzBmYTExYjA3KSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcihkYjQzY2UyZmU4YWQ2MTc1IGRmYmY4ZDZiMTE3MmQ5ZTkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyMGUxNTkwOWY3ODcxZGNlIDI2OWY1YmMzYjhiNWJjMWEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5Y2RlNzA5OTY1ZmIwMzRjIDM0N2I2ODliNzk5NzkwYTQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0ZDc2YTQ3YjJkNGRiYjRkIDhlMThlOTA2NjBhMjE1MDApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NGI4ZDQzY2ExY2NiNTIxIDc5OTZhYmIwNWQ5MmI2ZTcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1ZDIzZDRkN2VjZThiNDVkIDNjZjIwOGM0NzZjMzA4MjUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjODNlODkyNjA5YjI4ZTE0IGVmMmQ2OWJiZjNhZWUzZTUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1MDNkZjlmMDEyYTEzM2YyIDYxNzRjOWViMTc3ODY2NWQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihiMzZjNmVmNGZhYWYyYjBjIGQ5NGFmMjRhZDc5MmI2MWEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2Y2I1MTQ3ZTVlMzE2YjdkIDJhY2I4OWUzZWJmOGYyMzYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkZGNmYTJjNTQxYTRhMDgwIDcyYzVlNmRkZTI0ODZkNzkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwMWZkYmJlNjlkYzJhMjAyIDNjODBlMDBiNmZkNzQ5NDEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwODJiMjI4ZjA0MWE5MjVmIDQ5YzNlODdkZjFjODc5YTkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2MTc5YWEzNGZmMjIwYjA2IDA3MDE2YTE0OTNkODM5YzIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2YTZiYzg3MDY3MDk1OTk0IDhhNGZkYmY5NjhjZDA2MzEpKSkpKSkpKSkpKSkobWVzc2FnZXNfZm9yX25leHRfc3RlcF9wcm9vZigoYXBwX3N0YXRlKCkpKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnRzKCgweDAwNTAxNkU0QkI5NjBBOUNERUZGN0JGNzQ4QjdGMjA4RDQ0N0NBMzQ4MDY3RjVDNDU0NkI0QjVBQzA1RDRGMDEgMHgxMkUzNEMxNzBGMUQ5NTcxMEUyRjMzNjRBNDE2QjQwRUZBMEY4MkEzMTM5MjYyRjM4NDlCN0E3MTQ5NTY5RUE4KSgweDI5MDczNTA5ODNCQjVEQjg2MzNGM0I2RDNGQjcwNDUxMUM3RDhFMzM1MjY1MkJGMDc4OTQ1MzAyOEU1MDgyQUQgMHgxRTRBNzVCMzNEMUZGMjY5MzUxMjQ2NUNCNDEzNzgzMkQwRUE4RDJENjdBQkRGNENBNjVCNEVCMjVDOEZDRDQ4KSkpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTNmYWNhMmUwMjQyZGVlZiBjMDYzZTRkY2I2OTViNTg5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZmM2NTE4YzI5NDJlNDU5NyA1NjU1NTUyY2JkNzc3ZGI0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZDY0NmRmZjE4YWY1ZmU2NCBkNjQ3MDZhYjlkYzNlOGVkKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjJkZTkwZjkyMDY2ZmZkOCA0OGYzMGMzYTdkZDZjNmFkKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNjFkNzYwMmZlNzIyMGMxZSAxZjM5MjU0NjU4YmZiZWZjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYjIyOTQxODc5YWFjZjc2YyBiM2VhNmRiNmI1OTlkM2VjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTJhZmU1MzA0NDcxMWE1YSAxOTE2MzY3OTgyMTc3MDMwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWQwMWEyNGFlY2IxZjg3NiA2M2MwMDE4MGZjYTliN2E4KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYzJmNmY2YWNmYzdjMWI0YyAzMGRjZDBkZDk5YzM4ZDU5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYWM3OWNiODg5NGU1MGQ1NyBiNjc5NjZkNTE0N2NmMTYzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZTU2YTQ4NTU4NTU0M2U0YyAwMmJlNDI3N2JhNTQ3YTMzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjI5NTliNWFiZjMzYTYwMCBmYzk0ZGEyZTM3MWE3MDhlKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMDdlY2I5ZWI1ZjZiM2U0NCAyNjk5NzYzNmRhMTRhZTE0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTZmZWI3YzJjZDA0MjY4ZSAxMGY0YjkzMDYzNDBjOWYwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjExNTQyMDA1NzYzMmMwOSAwNGJhYTk5OTM3ZjQxNGZiKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNzY2Y2RlNTQxNGM4YWQyYSA0YWMzOWU1ZTFmZmJiOGYzKSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcigxMmM0ZTgxMTE3NjFhZWNiIDQzOWZlZDkwZmE0NjMxMWQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1NDRhYjY2YWMxZDYzYjRhIGEzYmJmMGYxMTg3ZDMyNGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4OWQ1M2ExN2MyYTFmNGM1IDY4NzFkODRiYzMwOTVkOGQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwZGQ2MjkzMzk2ZTQ3ODQxIGE5NTc4ZGExYzZiMzM3MzgpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5ZGJiYjE4OGJmMzdlODBhIDMzODQyZjcyOTBjYjljNjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5YmM4MzRlYmVmN2E5ZTlhIDAyMDdjYjM0YzBkNTU2NDQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4NGZlNDUxNTBkOTc0YTkwIDhhM2JkMGVlNmUxMjgxZDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3NDEzYzJhMjA3NmMyNWQ0IGQwODk5NTNlMDU4MTAxNjEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhMDNjNDNhMjg2OGNmZTFhIDMxNzdhMTU4OTk0MzgyYTUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxNTBmZjczNDVjOWQ1OGNmIGMzN2MzMzNhMTM1OGUwY2QpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihiNjcxNjRkZWFkYTkzMGJlIGExMDM0ZTc2N2NiZjZlMGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmNzk2YzhmMjE3ZGZjYmU3IDBjMDNmNjlmMmQ1NDYxNWIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihiNzc2MDczM2VhYzBlMDQxIGNmYmI3ZGUzNWMzNDZjZGUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3OTFiNzIxZjExMGYzMjMwIDUzZTBmMDFhZWRiYTQ2NDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkMTk0YzZjYTQzYjc1YTNjIGM1MjlhNTc0YjdkN2ViZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjNTcyZGZhNjVhOWVjNTU5IGFmMzg4ODUxOGJlYzg1ZDMpKSkpKSkpKSkpKSkocHJldl9ldmFscygoZXZhbHMoKHB1YmxpY19pbnB1dCgweDNBMTQ2RDEyMkMwRUU0MzI0NjUzMDdENzVFNEE2OEFGODQ1MkFBRkM5NDc2M0M0QTdFRjEwREM1MjQ1NDI3NjEgMHgyQkQ4MEM4MDAyQTEzNTkzQ0M0REQ3MUM4N0I4QTlFQjBEMEZCQjIzNjM4QUVGNTM0NzU2Q0I0MDAyRDc0MUU5KSkoZXZhbHMoKHcoKCgweDIxM0UwQ0U5MzMzRTg1ODYxMkM1NzlFNjc1NDEwMUM3QzcwRjZFQkE0RjM5RTEzNkMzNkIzNzM2RkE0RjRCMEUpKDB4MTUyNjIyMDk2MzczREM0N0U2NzY4QUVDM0VFRTI3NjQwN0M1NUVGRUZCMjhBNkRBMzlGRENCQkMyMDVFQ0ExMSkpKCgweDFGMUU0MjU2RUIzRUMxQTE0NjY4NkJFQTg5MDFFQzE3QkNEQUE5QjBGNEUxMkFFNEMzMjRDMTcxMDhBNDZBNDcpKDB4MjNGMkQ3NzlEMTYxNEQ4MTYxQ0IwQzY0QzFFNUQzMjkzOTlGMDhFNDA4OEVCNUIwNTQ3RUZDRTAwMDM5RUY0NykpKCgweDJDRjk5NDNEQzUzMjA3NzlCQ0VDRDlCRTUxMTc1QUE5RkQyQkNBNjYzQzI3ODE4QjNGRkNGNkIzMzM4RDc2QTgpKDB4MEFFRDgzMjIwMEJCOTA2MDI4MjcxQzFFMTFERkU3RDYxMjA5Q0QyQ0JDQ0Q5NUQ5NkZDRkJDRDg4MTlGMDE0QSkpKCgweDM1NzlGM0JBQjRDMkI5NzBFOTc3NTMyOUZCQzkyRjhCMEM5NDY4Nzc2OTUwNkNEOEI5NTY1M0ZDMUQ3QjI4MDUpKDB4MEFDOUM1MkE1REMzMzJENDRGQThCRTk2QjJDMzIyQjIwODdFMDlFQ0FFM0NBMTYyREIwMjIzQTEzQkNEMjdFOSkpKCgweDJFMEQ3MEJEN0UxRTRFNUYzNDBCOEIxNzZBMDk5RUYzN0U4MzI5MUI0MTBBQTdGQUJEODkyNzc5MTMzNUIwNjEpKDB4MEI1QjI2NDIwQjJBRTM2M0IyNzgzRTQ4M0E1N0FFNEQ3QTUwNkExMUU2NzJENDUzMkQ1REQyN0NGNUE1QkMyNikpKCgweDA3NDY5ODc3NTAyNEM3OEJFMEZEM0JEQUU5Qjk5M0ZGM0U4MTlGMjZBODkwMEQ1REEwQjVGOEZCRDExNkI1NzApKDB4MTM3Rjg0MUI4RjFBRjE5QTQ2OTA0MzMzNjk0NkI1Q0EzRDVEMDBDNDUxMDVENzU4OThFQTlFNzQyRUQxN0M4QykpKCgweDFFMDQwQTZCODIxNzE5MThENjMxRDg5QkMyN0RGQUNBMzZFMjgyQ0Y1MDBCNEU4ODY2MjkwM0YzQjE3MzE5QTMpKDB4MjZDMzE5NzE3ODYwNTc2OEQ2MzEyRDFFQjFCNzYzQkFFMDhCQTRFMkFDNTNCREQ2RDBBNTU1RTVDOTYwNEZEOCkpKCgweDNGQTVFRkExNkVBQ0JGOTg4MkNDRDkxQjkxOENDODdBM0JDQUZDRUMzNkMwOEU5QTI2NDExOUQyMjMwRDM0NUMpKDB4Mjk1QjFDNjg1MTA1REIyRDg1MjBBMDlBQjZDOEE2RTAyQUM0NEU1RTQ2NzI5Njc1NEU0OTQ3MjM5REQ1MDhFQikpKCgweDJBRUI4RjE3MkZGRkRFNTZENUMxM0NCQjJCN0ZEOEUwNTRFNTVBODU5NkQ0RUYxRkY0NzVBOTgwNTBCM0JFNzUpKDB4Mjg4MDcyNDBCMjAxQUU1QzA1N0I2NjJGMDI1OEU0QjIyREUyMDkzRjdDRjBDRjcyMEE5OUEzQjlCRTJGOUUyMikpKCgweDNENDAwMEQ3Rj'... 25397 more characters
}

[12:21:44 AM] 2024-05-12T21:21:33.143Z	INFO	zkCloudWorker Execute start: {
  command: 'execute',
  developer: 'DFST',
  repo: 'worker-example',
  id: '6459034946',
  jobId: '6459034946.1715548892992.JS071U568vQ8DYNcBmxiFPIlMLLgWXTl',
  job: {
    metadata: 'verify proof',
    logStreams: [],
    task: 'verifyProof',
    maxAttempts: 0,
    args: '{"contractAddress":"B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD","proof":"{\\n  \\"publicInput\\": [],\\n  \\"publicOutput\\": [\\n    \\"866\\",\\n    \\"1000\\"\\n  ],\\n  \\"maxProofsVerified\\": 2,\\n  \\"proof\\": \\"KChzdGF0ZW1lbnQoKHByb29mX3N0YXRlKChkZWZlcnJlZF92YWx1ZXMoKHBsb25rKChhbHBoYSgoaW5uZXIoYWM1MTVkY2Q4NDg2MzM4MiBkZjliZWE1YzFiMTM2MTVjKSkpKShiZXRhKGQyMDhlYTkxMmU1MDY2Y2EgYzExMDFlMWE0NDYzZjdkNSkpKGdhbW1hKDhiNTA0ZGVmZDU2NzliOGMgN2U5OTU3OTFlZjcwZGFkZikpKHpldGEoKGlubmVyKGQwNmZmMzVhNWM1YmUyYmIgNzdkMjZkOGQxZDhhYTE2ZCkpKSkoam9pbnRfY29tYmluZXIoKSkoZmVhdHVyZV9mbGFncygocmFuZ2VfY2hlY2swIGZhbHNlKShyYW5nZV9jaGVjazEgZmFsc2UpKGZvcmVpZ25fZmllbGRfYWRkIGZhbHNlKShmb3JlaWduX2ZpZWxkX211bCBmYWxzZSkoeG9yIGZhbHNlKShyb3QgZmFsc2UpKGxvb2t1cCBmYWxzZSkocnVudGltZV90YWJsZXMgZmFsc2UpKSkpKShidWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgocHJlY2hhbGxlbmdlKChpbm5lcihmYWY3ZjQ0MDcwZWJlZTJhIDYwNDk3MDIzMGI4NTcwZGIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmYTcwNTBhMmE0MjYyNDFhIDVkMTAwMzI4YThkOGMyZDUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNGJmOGI2ZTJlMDA3MTU1IDdmZDBjNmY3ZTRkNzJkZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NThmMmMzMzc3NTA4NGNmIDJkMGE4NmExOWY5YmIwZDQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0MGM2NjRjMjk0MThlNjhiIDQ3MTVkZmUzYmE2NmQ4NGIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5ZGFlNmYxOGRkZGJlNTJkIDUxZjk0MmM1YjcwMDcwNjYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwYjZiZDM4N2QyZTQ3MTNlIDI2NGE1YTcyMTQ4MDA4MjQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjNmUxYmFjNmRjY2E3NTQyIDdjMTE5ZTA4MzU0YTU1ZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5N2ZlYWE2MTIzZmZlMWU3IGExZWQyNDJkNzY1MDg0NWQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNTQ0NjFjNzhhZmQzYTk5IGZkZWM1ZDgzMTg4ZDY2NDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkNjdlODE0NDMxYmFlOWY0IDUzMDI3MTY5NGUwMjIxYWIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmNjZhODEzNzM0MGI3OGNhIDEwNGU3YTI4ZTg3NGI4NzYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxOTUzOGQ5MDI3Yzk2ODVlIDdmOGUxOGVkNzk5MTVhNzEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjNTNjM2NhYTQ4OWE0MGIwIDIyMWQ3NGFkNTRlZWU5NmEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlNTEwMGY2NTE4MGI3MzI1IDI4NDY5YjI1OGU3NjE0Y2MpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NGE0ZDcwZTgwZmU4YmJlIGQ2NTE5YmIzNWZiY2IzYjQpKSkpKSkpKGJyYW5jaF9kYXRhKChwcm9vZnNfdmVyaWZpZWQgTjIpKGRvbWFpbl9sb2cyIlwwMTUiKSkpKSkoc3BvbmdlX2RpZ2VzdF9iZWZvcmVfZXZhbHVhdGlvbnMoNGRmNDcxMTYxMjM0ZTJhZCA3YTQ5ZmMxZmJmYzgyMWUzIGFmMDRhNTI0MjM0NTU5MWEgMzUwMDlkNDBjZGI3Y2NhNSkpKG1lc3NhZ2VzX2Zvcl9uZXh0X3dyYXBfcHJvb2YoKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnQoMHgyRTg5NkM1Q0Y0Qzg2RTk4OEM2RjIwMDZGQjU0MTczNDUxRDU4QTg0MTQ0QjRCODJENjRFNkQxOUNBNEM0ODI4IDB4MEU0RDM3MUU5ODI1OTNBRkYyNTlDRTU1QzkxQkJDQzkwNEJBRDUzOUQ0RTgxREQ5OTI2MjAyOEQ1MTU0QjQ5NikpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTUxZDYzMGI0Y2NkMGFmMCA5ZGFlMjhkYzhhMjc2YTFjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMDlmYzc3Zjc3MDBhOWY0MCAxNjM2ZWM4ZTZkNGZhMjZmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNDRiZWNkYzJhNzY3NjJmYSA4YTQ3MjhkZGRhNTgxNWY5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWRmZjM5ODkzOGNkNWI2OCBhNjA2OWE5MjEyZTJmMmVhKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoN2M5YWRiMDRlZjBhYzA0NSBkNDgyZDA4NmRmYzU3ZWFjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoOTVjMjUzYzIyODc0YjMxMyA2ODEyZTlkY2M4NDNlMGIzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMTcwYWRmOTJlMmNlMGYwYSBlOWNhYzA5Y2UzY2E2MGQ2KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMmZlMTg2MDhjZjliNmFlNiA3ODkzZDJhMzczNjA1NjNmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNGIxM2NmMGNjMTczMGNiMSA4NDVmZTNiMTJlNjU4NzcxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoOGFhOGQ0ODVkN2Y2OTBlYSBmNDIzMmZmNDM2MTg0YzVmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWExYmM2MjhjMTkxZTIzZSA3NTYzNTE3NjMwN2FkZTdiKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoM2IwY2ZiZDQ4MDU5MWNhOSBjOGNlNjA5YmUyYTZlMTM5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMmUxOTQ4Y2M4YTM2MTFiOCA0YWE0Njk3ZjU4MGIxMmEwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNTFmMTk1NzcyODljZGJmZiA2YmNlOWZhYmY4MmRmZDkzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMjFkNDMzN2Y0NzZlNGI5MCBlZDEzZGM3NzBmYTExYjA3KSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcihkYjQzY2UyZmU4YWQ2MTc1IGRmYmY4ZDZiMTE3MmQ5ZTkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyMGUxNTkwOWY3ODcxZGNlIDI2OWY1YmMzYjhiNWJjMWEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5Y2RlNzA5OTY1ZmIwMzRjIDM0N2I2ODliNzk5NzkwYTQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0ZDc2YTQ3YjJkNGRiYjRkIDhlMThlOTA2NjBhMjE1MDApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NGI4ZDQzY2ExY2NiNTIxIDc5OTZhYmIwNWQ5MmI2ZTcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1ZDIzZDRkN2VjZThiNDVkIDNjZjIwOGM0NzZjMzA4MjUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjODNlODkyNjA5YjI4ZTE0IGVmMmQ2OWJiZjNhZWUzZTUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1MDNkZjlmMDEyYTEzM2YyIDYxNzRjOWViMTc3ODY2NWQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihiMzZjNmVmNGZhYWYyYjBjIGQ5NGFmMjRhZDc5MmI2MWEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2Y2I1MTQ3ZTVlMzE2YjdkIDJhY2I4OWUzZWJmOGYyMzYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkZGNmYTJjNTQxYTRhMDgwIDcyYzVlNmRkZTI0ODZkNzkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwMWZkYmJlNjlkYzJhMjAyIDNjODBlMDBiNmZkNzQ5NDEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwODJiMjI4ZjA0MWE5MjVmIDQ5YzNlODdkZjFjODc5YTkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2MTc5YWEzNGZmMjIwYjA2IDA3MDE2YTE0OTNkODM5YzIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2YTZiYzg3MDY3MDk1OTk0IDhhNGZkYmY5NjhjZDA2MzEpKSkpKSkpKSkpKSkobWVzc2FnZXNfZm9yX25leHRfc3RlcF9wcm9vZigoYXBwX3N0YXRlKCkpKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnRzKCgweDAwNTAxNkU0QkI5NjBBOUNERUZGN0JGNzQ4QjdGMjA4RDQ0N0NBMzQ4MDY3RjVDNDU0NkI0QjVBQzA1RDRGMDEgMHgxMkUzNEMxNzBGMUQ5NTcxMEUyRjMzNjRBNDE2QjQwRUZBMEY4MkEzMTM5MjYyRjM4NDlCN0E3MTQ5NTY5RUE4KSgweDI5MDczNTA5ODNCQjVEQjg2MzNGM0I2RDNGQjcwNDUxMUM3RDhFMzM1MjY1MkJGMDc4OTQ1MzAyOEU1MDgyQUQgMHgxRTRBNzVCMzNEMUZGMjY5MzUxMjQ2NUNCNDEzNzgzMkQwRUE4RDJENjdBQkRGNENBNjVCNEVCMjVDOEZDRDQ4KSkpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTNmYWNhMmUwMjQyZGVlZiBjMDYzZTRkY2I2OTViNTg5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZmM2NTE4YzI5NDJlNDU5NyA1NjU1NTUyY2JkNzc3ZGI0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZDY0NmRmZjE4YWY1ZmU2NCBkNjQ3MDZhYjlkYzNlOGVkKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjJkZTkwZjkyMDY2ZmZkOCA0OGYzMGMzYTdkZDZjNmFkKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNjFkNzYwMmZlNzIyMGMxZSAxZjM5MjU0NjU4YmZiZWZjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYjIyOTQxODc5YWFjZjc2YyBiM2VhNmRiNmI1OTlkM2VjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTJhZmU1MzA0NDcxMWE1YSAxOTE2MzY3OTgyMTc3MDMwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWQwMWEyNGFlY2IxZjg3NiA2M2MwMDE4MGZjYTliN2E4KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYzJmNmY2YWNmYzdjMWI0YyAzMGRjZDBkZDk5YzM4ZDU5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYWM3OWNiODg5NGU1MGQ1NyBiNjc5NjZkNTE0N2NmMTYzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZTU2YTQ4NTU4NTU0M2U0YyAwMmJlNDI3N2JhNTQ3YTMzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjI5NTliNWFiZjMzYTYwMCBmYzk0ZGEyZTM3MWE3MDhlKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMDdlY2I5ZWI1ZjZiM2U0NCAyNjk5NzYzNmRhMTRhZTE0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTZmZWI3YzJjZDA0MjY4ZSAxMGY0YjkzMDYzNDBjOWYwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjExNTQyMDA1NzYzMmMwOSAwNGJhYTk5OTM3ZjQxNGZiKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNzY2Y2RlNTQxNGM4YWQyYSA0YWMzOWU1ZTFmZmJiOGYzKSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcigxMmM0ZTgxMTE3NjFhZWNiIDQzOWZlZDkwZmE0NjMxMWQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1NDRhYjY2YWMxZDYzYjRhIGEzYmJmMGYxMTg3ZDMyNGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4OWQ1M2ExN2MyYTFmNGM1IDY4NzFkODRiYzMwOTVkOGQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwZGQ2MjkzMzk2ZTQ3ODQxIGE5NTc4ZGExYzZiMzM3MzgpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5ZGJiYjE4OGJmMzdlODBhIDMzODQyZjcyOTBjYjljNjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5YmM4MzRlYmVmN2E5ZTlhIDAyMDdjYjM0YzBkNTU2NDQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4NGZlNDUxNTBkOTc0YTkwIDhhM2JkMGVlNmUxMjgxZDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3NDEzYzJhMjA3NmMyNWQ0IGQwODk5NTNlMDU4MTAxNjEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhMDNjNDNhMjg2OGNmZTFhIDMxNzdhMTU4OTk0MzgyYTUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxNTBmZjczNDVjOWQ1OGNmIGMzN2MzMzNhMTM1OGUwY2QpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihiNjcxNjRkZWFkYTkzMGJlIGExMDM0ZTc2N2NiZjZlMGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmNzk2YzhmMjE3ZGZjYmU3IDBjMDNmNjlmMmQ1NDYxNWIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihiNzc2MDczM2VhYzBlMDQxIGNmYmI3ZGUzNWMzNDZjZGUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3OTFiNzIxZjExMGYzMjMwIDUzZTBmMDFhZWRiYTQ2NDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkMTk0YzZjYTQzYjc1YTNjIGM1MjlhNTc0YjdkN2ViZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjNTcyZGZhNjVhOWVjNTU5IGFmMzg4ODUxOGJlYzg1ZDMpKSkpKSkpKSkpKSkocHJldl9ldmFscygoZXZhbHMoKHB1YmxpY19pbnB1dCgweDNBMTQ2RDEyMkMwRUU0MzI0NjUzMDdENzVFNEE2OEFGODQ1MkFBRkM5NDc2M0M0QTdFRjEwREM1MjQ1NDI3NjEgMHgyQkQ4MEM4MDAyQTEzNTkzQ0M0REQ3MUM4N0I4QTlFQjBEMEZCQjIzNjM4QUVGNTM0NzU2Q0I0MDAyRDc0MUU5KSkoZXZhbHMoKHcoKCgweDIxM0UwQ0U5MzMzRTg1ODYxMkM1NzlFNjc1NDEwMUM3QzcwRjZFQkE0RjM5RTEzNkMzNkIzNzM2RkE0RjRCMEUpKDB4MTUyNjIyMDk2MzczREM0N0U2NzY4QUVDM0VFRTI3NjQwN0M1NUVGRUZCMjhBNkRBMzlGRENCQkMyMDVFQ0ExMSkpKCgweDFGMUU0MjU2RUIzRUMxQTE0NjY4NkJFQTg5MDFFQzE3QkNEQUE5QjBGNEUxMkFFNEMzMjRDMTcxMDhBNDZBNDcpKDB4MjNGMkQ3NzlEMTYxNEQ4MTYxQ0IwQzY0QzFFNUQzMjkzOTlGMDhFNDA4OEVCNUIwNTQ3RUZDRTAwMDM5RUY0NykpKCgweDJDRjk5NDNEQzUzMjA3NzlCQ0VDRDlCRTUxMTc1QUE5RkQyQkNBNjYzQzI3ODE4QjNGRkNGNkIzMzM4RDc2QTgpKDB4MEFFRDgzMjIwMEJCOTA2MDI4MjcxQzFFMTFERkU3RDYxMjA5Q0QyQ0JDQ0Q5NUQ5NkZDRkJDRDg4MTlGMDE0QSkpKCgweDM1NzlGM0JBQjRDMkI5NzBFOTc3NTMyOUZCQzkyRjhCMEM5NDY4Nzc2OTUwNkNEOEI5NTY1M0ZDMUQ3QjI4MDUpKDB4MEFDOUM1MkE1REMzMzJENDRGQThCRTk2QjJDMzIyQjIwODdFMDlFQ0FFM0NBMTYyREIwMjIzQTEzQkNEMjdFOSkpKCgweDJFMEQ3MEJEN0UxRTRFNUYzNDBCOEIxNzZBMDk5RUYzN0U4MzI5MUI0MTBBQTdGQUJEODkyNzc5MTMzNUIwNjEpKDB4MEI1QjI2NDIwQjJBRTM2M0IyNzgzRTQ4M0E1N0FFNEQ3QTUwNkExMUU2NzJENDUzMkQ1REQyN0NGNUE1QkMyNikpKCgweDA3NDY5ODc3NTAyNEM3OEJFMEZEM0JEQUU5Qjk5M0ZGM0U4MTlGMjZBODkwMEQ1REEwQjVGOEZCRDExNkI1NzApKDB4MTM3Rjg0MUI4RjFBRjE5QTQ2OTA0MzMzNjk0NkI1Q0EzRDVEMDBDNDUxMDVENzU4OThFQTlFNzQyRUQxN0M4QykpKCgweDFFMDQwQTZCODIxNzE5MThENjMxRDg5QkMyN0RGQUNBMzZFMjgyQ0Y1MDBCNEU4ODY2MjkwM0YzQjE3MzE5QTMpKDB4MjZDMzE5NzE3ODYwNTc2OEQ2MzEyRDFFQjFCNzYzQkFFMDhCQTRFMkFDNTNCREQ2RDBBNTU1RTVDOTYwNEZEOCkpKCgweDNGQTVFRkExNkVBQ0JGOTg4MkNDRDkxQjkxOENDODdBM0JDQUZDRUMzNkMwOEU5QTI2NDExOUQyMjMwRDM0NUMpKDB4Mjk1QjFDNjg1MTA1REIyRDg1MjBBMDlBQjZDOEE2RTAyQUM0NEU1RTQ2NzI5Njc1NEU0OTQ3MjM5REQ1MDhFQikpKCgweDJBRUI4RjE3MkZGRkRFNTZENUMxM0NCQjJCN0ZEOEUwNTRFNTVBODU5NkQ0RUYxRkY0NzVBOTgwNTBCM0JFNzUpKDB4Mjg4MDcyNDBCMjAxQUU1QzA1N0I2NjJGMDI1OEU0QjIyREUyMDkzRjdDRjBDRjcyMEE5OUEzQjlCRTJGOUUyMikpKCgweDNENDAwMEQ3Rj'... 25397 more characters,
    timeCreated: 1715548892992,
    timeCreatedString: '2024-05-12T21:21:32.992Z',
    jobId: '6459034946.1715548892992.JS071U568vQ8DYNcBmxiFPIlMLLgWXTl',
    repo: 'worker-example',
    developer: 'DFST',
    chain: 'devnet',
    txNumber: 1,
    jobStatus: 'created',
    id: '6459034946'
  }
}

[12:21:44 AM] 2024-05-12T21:21:33.149Z	INFO	RSS memory start: 3555 MB, changed by -480 MB

[12:21:44 AM] 2024-05-12T21:21:33.149Z	INFO	CloudWorker: constructor {
  id: '6459034946',
  jobId: '6459034946.1715548892992.JS071U568vQ8DYNcBmxiFPIlMLLgWXTl',
  developer: 'DFST',
  repo: 'worker-example',
  task: 'verifyProof',
  taskId: undefined,
  userId: undefined,
  args: '{"contractAddress":"B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD","proof":"{\\n  \\"publicInput\\": [],\\n  \\"publicOutput\\": [\\n    \\"866\\",\\n    \\"1000\\"\\n  ],\\n  \\"maxProofsVerified\\": 2,\\n  \\"proof\\": \\"KChzdGF0ZW1lbnQoKHByb29mX3N0YXRlKChkZWZlcnJlZF92YWx1ZXMoKHBsb25rKChhbHBoYSgoaW5uZXIoYWM1MTVkY2Q4NDg2MzM4MiBkZjliZWE1YzFiMTM2MTVjKSkpKShiZXRhKGQyMDhlYTkxMmU1MDY2Y2EgYzExMDFlMWE0NDYzZjdkNSkpKGdhbW1hKDhiNTA0ZGVmZDU2NzliOGMgN2U5OTU3OTFlZjcwZGFkZikpKHpldGEoKGlubmVyKGQwNmZmMzVhNWM1YmUyYmIgNzdkMjZkOGQxZDhhYTE2ZCkpKSkoam9pbnRfY29tYmluZXIoKSkoZmVhdHVyZV9mbGFncygocmFuZ2VfY2hlY2swIGZhbHNlKShyYW5nZV9jaGVjazEgZmFsc2UpKGZvcmVpZ25fZmllbGRfYWRkIGZhbHNlKShmb3JlaWduX2ZpZWxkX211bCBmYWxzZSkoeG9yIGZhbHNlKShyb3QgZmFsc2UpKGxvb2t1cCBmYWxzZSkocnVudGltZV90YWJsZXMgZmFsc2UpKSkpKShidWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgocHJlY2hhbGxlbmdlKChpbm5lcihmYWY3ZjQ0MDcwZWJlZTJhIDYwNDk3MDIzMGI4NTcwZGIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmYTcwNTBhMmE0MjYyNDFhIDVkMTAwMzI4YThkOGMyZDUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNGJmOGI2ZTJlMDA3MTU1IDdmZDBjNmY3ZTRkNzJkZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NThmMmMzMzc3NTA4NGNmIDJkMGE4NmExOWY5YmIwZDQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0MGM2NjRjMjk0MThlNjhiIDQ3MTVkZmUzYmE2NmQ4NGIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5ZGFlNmYxOGRkZGJlNTJkIDUxZjk0MmM1YjcwMDcwNjYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwYjZiZDM4N2QyZTQ3MTNlIDI2NGE1YTcyMTQ4MDA4MjQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjNmUxYmFjNmRjY2E3NTQyIDdjMTE5ZTA4MzU0YTU1ZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5N2ZlYWE2MTIzZmZlMWU3IGExZWQyNDJkNzY1MDg0NWQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNTQ0NjFjNzhhZmQzYTk5IGZkZWM1ZDgzMTg4ZDY2NDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkNjdlODE0NDMxYmFlOWY0IDUzMDI3MTY5NGUwMjIxYWIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmNjZhODEzNzM0MGI3OGNhIDEwNGU3YTI4ZTg3NGI4NzYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxOTUzOGQ5MDI3Yzk2ODVlIDdmOGUxOGVkNzk5MTVhNzEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjNTNjM2NhYTQ4OWE0MGIwIDIyMWQ3NGFkNTRlZWU5NmEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlNTEwMGY2NTE4MGI3MzI1IDI4NDY5YjI1OGU3NjE0Y2MpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NGE0ZDcwZTgwZmU4YmJlIGQ2NTE5YmIzNWZiY2IzYjQpKSkpKSkpKGJyYW5jaF9kYXRhKChwcm9vZnNfdmVyaWZpZWQgTjIpKGRvbWFpbl9sb2cyIlwwMTUiKSkpKSkoc3BvbmdlX2RpZ2VzdF9iZWZvcmVfZXZhbHVhdGlvbnMoNGRmNDcxMTYxMjM0ZTJhZCA3YTQ5ZmMxZmJmYzgyMWUzIGFmMDRhNTI0MjM0NTU5MWEgMzUwMDlkNDBjZGI3Y2NhNSkpKG1lc3NhZ2VzX2Zvcl9uZXh0X3dyYXBfcHJvb2YoKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnQoMHgyRTg5NkM1Q0Y0Qzg2RTk4OEM2RjIwMDZGQjU0MTczNDUxRDU4QTg0MTQ0QjRCODJENjRFNkQxOUNBNEM0ODI4IDB4MEU0RDM3MUU5ODI1OTNBRkYyNTlDRTU1QzkxQkJDQzkwNEJBRDUzOUQ0RTgxREQ5OTI2MjAyOEQ1MTU0QjQ5NikpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTUxZDYzMGI0Y2NkMGFmMCA5ZGFlMjhkYzhhMjc2YTFjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMDlmYzc3Zjc3MDBhOWY0MCAxNjM2ZWM4ZTZkNGZhMjZmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNDRiZWNkYzJhNzY3NjJmYSA4YTQ3MjhkZGRhNTgxNWY5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWRmZjM5ODkzOGNkNWI2OCBhNjA2OWE5MjEyZTJmMmVhKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoN2M5YWRiMDRlZjBhYzA0NSBkNDgyZDA4NmRmYzU3ZWFjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoOTVjMjUzYzIyODc0YjMxMyA2ODEyZTlkY2M4NDNlMGIzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMTcwYWRmOTJlMmNlMGYwYSBlOWNhYzA5Y2UzY2E2MGQ2KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMmZlMTg2MDhjZjliNmFlNiA3ODkzZDJhMzczNjA1NjNmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNGIxM2NmMGNjMTczMGNiMSA4NDVmZTNiMTJlNjU4NzcxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoOGFhOGQ0ODVkN2Y2OTBlYSBmNDIzMmZmNDM2MTg0YzVmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWExYmM2MjhjMTkxZTIzZSA3NTYzNTE3NjMwN2FkZTdiKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoM2IwY2ZiZDQ4MDU5MWNhOSBjOGNlNjA5YmUyYTZlMTM5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMmUxOTQ4Y2M4YTM2MTFiOCA0YWE0Njk3ZjU4MGIxMmEwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNTFmMTk1NzcyODljZGJmZiA2YmNlOWZhYmY4MmRmZDkzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMjFkNDMzN2Y0NzZlNGI5MCBlZDEzZGM3NzBmYTExYjA3KSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcihkYjQzY2UyZmU4YWQ2MTc1IGRmYmY4ZDZiMTE3MmQ5ZTkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyMGUxNTkwOWY3ODcxZGNlIDI2OWY1YmMzYjhiNWJjMWEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5Y2RlNzA5OTY1ZmIwMzRjIDM0N2I2ODliNzk5NzkwYTQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0ZDc2YTQ3YjJkNGRiYjRkIDhlMThlOTA2NjBhMjE1MDApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NGI4ZDQzY2ExY2NiNTIxIDc5OTZhYmIwNWQ5MmI2ZTcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1ZDIzZDRkN2VjZThiNDVkIDNjZjIwOGM0NzZjMzA4MjUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjODNlODkyNjA5YjI4ZTE0IGVmMmQ2OWJiZjNhZWUzZTUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1MDNkZjlmMDEyYTEzM2YyIDYxNzRjOWViMTc3ODY2NWQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihiMzZjNmVmNGZhYWYyYjBjIGQ5NGFmMjRhZDc5MmI2MWEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2Y2I1MTQ3ZTVlMzE2YjdkIDJhY2I4OWUzZWJmOGYyMzYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkZGNmYTJjNTQxYTRhMDgwIDcyYzVlNmRkZTI0ODZkNzkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwMWZkYmJlNjlkYzJhMjAyIDNjODBlMDBiNmZkNzQ5NDEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwODJiMjI4ZjA0MWE5MjVmIDQ5YzNlODdkZjFjODc5YTkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2MTc5YWEzNGZmMjIwYjA2IDA3MDE2YTE0OTNkODM5YzIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2YTZiYzg3MDY3MDk1OTk0IDhhNGZkYmY5NjhjZDA2MzEpKSkpKSkpKSkpKSkobWVzc2FnZXNfZm9yX25leHRfc3RlcF9wcm9vZigoYXBwX3N0YXRlKCkpKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnRzKCgweDAwNTAxNkU0QkI5NjBBOUNERUZGN0JGNzQ4QjdGMjA4RDQ0N0NBMzQ4MDY3RjVDNDU0NkI0QjVBQzA1RDRGMDEgMHgxMkUzNEMxNzBGMUQ5NTcxMEUyRjMzNjRBNDE2QjQwRUZBMEY4MkEzMTM5MjYyRjM4NDlCN0E3MTQ5NTY5RUE4KSgweDI5MDczNTA5ODNCQjVEQjg2MzNGM0I2RDNGQjcwNDUxMUM3RDhFMzM1MjY1MkJGMDc4OTQ1MzAyOEU1MDgyQUQgMHgxRTRBNzVCMzNEMUZGMjY5MzUxMjQ2NUNCNDEzNzgzMkQwRUE4RDJENjdBQkRGNENBNjVCNEVCMjVDOEZDRDQ4KSkpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTNmYWNhMmUwMjQyZGVlZiBjMDYzZTRkY2I2OTViNTg5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZmM2NTE4YzI5NDJlNDU5NyA1NjU1NTUyY2JkNzc3ZGI0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZDY0NmRmZjE4YWY1ZmU2NCBkNjQ3MDZhYjlkYzNlOGVkKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjJkZTkwZjkyMDY2ZmZkOCA0OGYzMGMzYTdkZDZjNmFkKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNjFkNzYwMmZlNzIyMGMxZSAxZjM5MjU0NjU4YmZiZWZjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYjIyOTQxODc5YWFjZjc2YyBiM2VhNmRiNmI1OTlkM2VjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTJhZmU1MzA0NDcxMWE1YSAxOTE2MzY3OTgyMTc3MDMwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWQwMWEyNGFlY2IxZjg3NiA2M2MwMDE4MGZjYTliN2E4KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYzJmNmY2YWNmYzdjMWI0YyAzMGRjZDBkZDk5YzM4ZDU5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYWM3OWNiODg5NGU1MGQ1NyBiNjc5NjZkNTE0N2NmMTYzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZTU2YTQ4NTU4NTU0M2U0YyAwMmJlNDI3N2JhNTQ3YTMzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjI5NTliNWFiZjMzYTYwMCBmYzk0ZGEyZTM3MWE3MDhlKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMDdlY2I5ZWI1ZjZiM2U0NCAyNjk5NzYzNmRhMTRhZTE0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTZmZWI3YzJjZDA0MjY4ZSAxMGY0YjkzMDYzNDBjOWYwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjExNTQyMDA1NzYzMmMwOSAwNGJhYTk5OTM3ZjQxNGZiKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNzY2Y2RlNTQxNGM4YWQyYSA0YWMzOWU1ZTFmZmJiOGYzKSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcigxMmM0ZTgxMTE3NjFhZWNiIDQzOWZlZDkwZmE0NjMxMWQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1NDRhYjY2YWMxZDYzYjRhIGEzYmJmMGYxMTg3ZDMyNGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4OWQ1M2ExN2MyYTFmNGM1IDY4NzFkODRiYzMwOTVkOGQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwZGQ2MjkzMzk2ZTQ3ODQxIGE5NTc4ZGExYzZiMzM3MzgpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5ZGJiYjE4OGJmMzdlODBhIDMzODQyZjcyOTBjYjljNjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5YmM4MzRlYmVmN2E5ZTlhIDAyMDdjYjM0YzBkNTU2NDQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4NGZlNDUxNTBkOTc0YTkwIDhhM2JkMGVlNmUxMjgxZDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3NDEzYzJhMjA3NmMyNWQ0IGQwODk5NTNlMDU4MTAxNjEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhMDNjNDNhMjg2OGNmZTFhIDMxNzdhMTU4OTk0MzgyYTUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxNTBmZjczNDVjOWQ1OGNmIGMzN2MzMzNhMTM1OGUwY2QpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihiNjcxNjRkZWFkYTkzMGJlIGExMDM0ZTc2N2NiZjZlMGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmNzk2YzhmMjE3ZGZjYmU3IDBjMDNmNjlmMmQ1NDYxNWIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihiNzc2MDczM2VhYzBlMDQxIGNmYmI3ZGUzNWMzNDZjZGUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3OTFiNzIxZjExMGYzMjMwIDUzZTBmMDFhZWRiYTQ2NDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkMTk0YzZjYTQzYjc1YTNjIGM1MjlhNTc0YjdkN2ViZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjNTcyZGZhNjVhOWVjNTU5IGFmMzg4ODUxOGJlYzg1ZDMpKSkpKSkpKSkpKSkocHJldl9ldmFscygoZXZhbHMoKHB1YmxpY19pbnB1dCgweDNBMTQ2RDEyMkMwRUU0MzI0NjUzMDdENzVFNEE2OEFGODQ1MkFBRkM5NDc2M0M0QTdFRjEwREM1MjQ1NDI3NjEgMHgyQkQ4MEM4MDAyQTEzNTkzQ0M0REQ3MUM4N0I4QTlFQjBEMEZCQjIzNjM4QUVGNTM0NzU2Q0I0MDAyRDc0MUU5KSkoZXZhbHMoKHcoKCgweDIxM0UwQ0U5MzMzRTg1ODYxMkM1NzlFNjc1NDEwMUM3QzcwRjZFQkE0RjM5RTEzNkMzNkIzNzM2RkE0RjRCMEUpKDB4MTUyNjIyMDk2MzczREM0N0U2NzY4QUVDM0VFRTI3NjQwN0M1NUVGRUZCMjhBNkRBMzlGRENCQkMyMDVFQ0ExMSkpKCgweDFGMUU0MjU2RUIzRUMxQTE0NjY4NkJFQTg5MDFFQzE3QkNEQUE5QjBGNEUxMkFFNEMzMjRDMTcxMDhBNDZBNDcpKDB4MjNGMkQ3NzlEMTYxNEQ4MTYxQ0IwQzY0QzFFNUQzMjkzOTlGMDhFNDA4OEVCNUIwNTQ3RUZDRTAwMDM5RUY0NykpKCgweDJDRjk5NDNEQzUzMjA3NzlCQ0VDRDlCRTUxMTc1QUE5RkQyQkNBNjYzQzI3ODE4QjNGRkNGNkIzMzM4RDc2QTgpKDB4MEFFRDgzMjIwMEJCOTA2MDI4MjcxQzFFMTFERkU3RDYxMjA5Q0QyQ0JDQ0Q5NUQ5NkZDRkJDRDg4MTlGMDE0QSkpKCgweDM1NzlGM0JBQjRDMkI5NzBFOTc3NTMyOUZCQzkyRjhCMEM5NDY4Nzc2OTUwNkNEOEI5NTY1M0ZDMUQ3QjI4MDUpKDB4MEFDOUM1MkE1REMzMzJENDRGQThCRTk2QjJDMzIyQjIwODdFMDlFQ0FFM0NBMTYyREIwMjIzQTEzQkNEMjdFOSkpKCgweDJFMEQ3MEJEN0UxRTRFNUYzNDBCOEIxNzZBMDk5RUYzN0U4MzI5MUI0MTBBQTdGQUJEODkyNzc5MTMzNUIwNjEpKDB4MEI1QjI2NDIwQjJBRTM2M0IyNzgzRTQ4M0E1N0FFNEQ3QTUwNkExMUU2NzJENDUzMkQ1REQyN0NGNUE1QkMyNikpKCgweDA3NDY5ODc3NTAyNEM3OEJFMEZEM0JEQUU5Qjk5M0ZGM0U4MTlGMjZBODkwMEQ1REEwQjVGOEZCRDExNkI1NzApKDB4MTM3Rjg0MUI4RjFBRjE5QTQ2OTA0MzMzNjk0NkI1Q0EzRDVEMDBDNDUxMDVENzU4OThFQTlFNzQyRUQxN0M4QykpKCgweDFFMDQwQTZCODIxNzE5MThENjMxRDg5QkMyN0RGQUNBMzZFMjgyQ0Y1MDBCNEU4ODY2MjkwM0YzQjE3MzE5QTMpKDB4MjZDMzE5NzE3ODYwNTc2OEQ2MzEyRDFFQjFCNzYzQkFFMDhCQTRFMkFDNTNCREQ2RDBBNTU1RTVDOTYwNEZEOCkpKCgweDNGQTVFRkExNkVBQ0JGOTg4MkNDRDkxQjkxOENDODdBM0JDQUZDRUMzNkMwOEU5QTI2NDExOUQyMjMwRDM0NUMpKDB4Mjk1QjFDNjg1MTA1REIyRDg1MjBBMDlBQjZDOEE2RTAyQUM0NEU1RTQ2NzI5Njc1NEU0OTQ3MjM5REQ1MDhFQikpKCgweDJBRUI4RjE3MkZGRkRFNTZENUMxM0NCQjJCN0ZEOEUwNTRFNTVBODU5NkQ0RUYxRkY0NzVBOTgwNTBCM0JFNzUpKDB4Mjg4MDcyNDBCMjAxQUU1QzA1N0I2NjJGMDI1OEU0QjIyREUyMDkzRjdDRjBDRjcyMEE5OUEzQjlCRTJGOUUyMikpKCgweDNENDAwMEQ3Rj'... 25397 more characters,
  metadata: 'verify proof',
  cache: '/mnt/efs/cache',
  chain: 'devnet',
  webhook: undefined
}

[12:21:44 AM] 2024-05-12T21:21:33.173Z	INFO	getWorker result: {
  repo: 'worker-example',
  size: 10815,
  version: '0.2.2',
  developer: 'DFST',
  countUsed: 12,
  timeUsed: 1715548829088,
  timeDeployed: 1715547885099,
  id: '6459034946',
  protected: false
}

[12:21:44 AM] 2024-05-12T21:21:33.173Z	INFO	Running worker { developer: 'DFST', repo: 'worker-example', version: '0.2.2' }

[12:21:44 AM] 2024-05-12T21:21:33.174Z	INFO	starting worker example version 0.2.2 on chain devnet

[12:21:44 AM] 2024-05-12T21:21:33.260Z	INFO	compiled: 0.016ms

[12:21:44 AM] 2024-05-12T21:21:35.234Z	INFO	RSS memory finished: 3401 MB, changed by -154 MB

[12:21:44 AM] 2024-05-12T21:21:35.234Z	INFO	zkCloudWorker Execute Sync: 2.086s

[12:21:44 AM] 2024-05-12T21:21:35.264Z	INFO	zkCloudWorker Execute: 2.122s

[12:21:44 AM] REPORT RequestId: Duration: 2176.83 ms	Billed Duration: 2177 ms	Memory Size: 10240 MB	Max Memory Used: 4864 MB

[12:21:44 AM] Verify result: Proof verified
[12:21:45 AM] answer: {
  success: true,
  jobId: '6459034946.1715548904948.PCMuwvyRLwMcIcESY1HQRCAhpVU0TWp1',
  result: undefined,
  error: undefined
}
[12:21:56 AM] 2024-05-12T21:21:45.068Z	INFO	worker {
  command: 'execute',
  id: '6459034946',
  jobId: '6459034946.1715548904948.PCMuwvyRLwMcIcESY1HQRCAhpVU0TWp1',
  developer: 'DFST',
  repo: 'worker-example',
  args: '{"contractAddress":"B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD","isMany":true,"proof":"{\\n  \\"publicInput\\": [],\\n  \\"publicOutput\\": [\\n    \\"866\\",\\n    \\"1000\\"\\n  ],\\n  \\"maxProofsVerified\\": 2,\\n  \\"proof\\": \\"KChzdGF0ZW1lbnQoKHByb29mX3N0YXRlKChkZWZlcnJlZF92YWx1ZXMoKHBsb25rKChhbHBoYSgoaW5uZXIoYWM1MTVkY2Q4NDg2MzM4MiBkZjliZWE1YzFiMTM2MTVjKSkpKShiZXRhKGQyMDhlYTkxMmU1MDY2Y2EgYzExMDFlMWE0NDYzZjdkNSkpKGdhbW1hKDhiNTA0ZGVmZDU2NzliOGMgN2U5OTU3OTFlZjcwZGFkZikpKHpldGEoKGlubmVyKGQwNmZmMzVhNWM1YmUyYmIgNzdkMjZkOGQxZDhhYTE2ZCkpKSkoam9pbnRfY29tYmluZXIoKSkoZmVhdHVyZV9mbGFncygocmFuZ2VfY2hlY2swIGZhbHNlKShyYW5nZV9jaGVjazEgZmFsc2UpKGZvcmVpZ25fZmllbGRfYWRkIGZhbHNlKShmb3JlaWduX2ZpZWxkX211bCBmYWxzZSkoeG9yIGZhbHNlKShyb3QgZmFsc2UpKGxvb2t1cCBmYWxzZSkocnVudGltZV90YWJsZXMgZmFsc2UpKSkpKShidWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgocHJlY2hhbGxlbmdlKChpbm5lcihmYWY3ZjQ0MDcwZWJlZTJhIDYwNDk3MDIzMGI4NTcwZGIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmYTcwNTBhMmE0MjYyNDFhIDVkMTAwMzI4YThkOGMyZDUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNGJmOGI2ZTJlMDA3MTU1IDdmZDBjNmY3ZTRkNzJkZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NThmMmMzMzc3NTA4NGNmIDJkMGE4NmExOWY5YmIwZDQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0MGM2NjRjMjk0MThlNjhiIDQ3MTVkZmUzYmE2NmQ4NGIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5ZGFlNmYxOGRkZGJlNTJkIDUxZjk0MmM1YjcwMDcwNjYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwYjZiZDM4N2QyZTQ3MTNlIDI2NGE1YTcyMTQ4MDA4MjQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjNmUxYmFjNmRjY2E3NTQyIDdjMTE5ZTA4MzU0YTU1ZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5N2ZlYWE2MTIzZmZlMWU3IGExZWQyNDJkNzY1MDg0NWQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNTQ0NjFjNzhhZmQzYTk5IGZkZWM1ZDgzMTg4ZDY2NDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkNjdlODE0NDMxYmFlOWY0IDUzMDI3MTY5NGUwMjIxYWIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmNjZhODEzNzM0MGI3OGNhIDEwNGU3YTI4ZTg3NGI4NzYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxOTUzOGQ5MDI3Yzk2ODVlIDdmOGUxOGVkNzk5MTVhNzEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjNTNjM2NhYTQ4OWE0MGIwIDIyMWQ3NGFkNTRlZWU5NmEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlNTEwMGY2NTE4MGI3MzI1IDI4NDY5YjI1OGU3NjE0Y2MpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NGE0ZDcwZTgwZmU4YmJlIGQ2NTE5YmIzNWZiY2IzYjQpKSkpKSkpKGJyYW5jaF9kYXRhKChwcm9vZnNfdmVyaWZpZWQgTjIpKGRvbWFpbl9sb2cyIlwwMTUiKSkpKSkoc3BvbmdlX2RpZ2VzdF9iZWZvcmVfZXZhbHVhdGlvbnMoNGRmNDcxMTYxMjM0ZTJhZCA3YTQ5ZmMxZmJmYzgyMWUzIGFmMDRhNTI0MjM0NTU5MWEgMzUwMDlkNDBjZGI3Y2NhNSkpKG1lc3NhZ2VzX2Zvcl9uZXh0X3dyYXBfcHJvb2YoKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnQoMHgyRTg5NkM1Q0Y0Qzg2RTk4OEM2RjIwMDZGQjU0MTczNDUxRDU4QTg0MTQ0QjRCODJENjRFNkQxOUNBNEM0ODI4IDB4MEU0RDM3MUU5ODI1OTNBRkYyNTlDRTU1QzkxQkJDQzkwNEJBRDUzOUQ0RTgxREQ5OTI2MjAyOEQ1MTU0QjQ5NikpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTUxZDYzMGI0Y2NkMGFmMCA5ZGFlMjhkYzhhMjc2YTFjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMDlmYzc3Zjc3MDBhOWY0MCAxNjM2ZWM4ZTZkNGZhMjZmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNDRiZWNkYzJhNzY3NjJmYSA4YTQ3MjhkZGRhNTgxNWY5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWRmZjM5ODkzOGNkNWI2OCBhNjA2OWE5MjEyZTJmMmVhKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoN2M5YWRiMDRlZjBhYzA0NSBkNDgyZDA4NmRmYzU3ZWFjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoOTVjMjUzYzIyODc0YjMxMyA2ODEyZTlkY2M4NDNlMGIzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMTcwYWRmOTJlMmNlMGYwYSBlOWNhYzA5Y2UzY2E2MGQ2KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMmZlMTg2MDhjZjliNmFlNiA3ODkzZDJhMzczNjA1NjNmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNGIxM2NmMGNjMTczMGNiMSA4NDVmZTNiMTJlNjU4NzcxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoOGFhOGQ0ODVkN2Y2OTBlYSBmNDIzMmZmNDM2MTg0YzVmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWExYmM2MjhjMTkxZTIzZSA3NTYzNTE3NjMwN2FkZTdiKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoM2IwY2ZiZDQ4MDU5MWNhOSBjOGNlNjA5YmUyYTZlMTM5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMmUxOTQ4Y2M4YTM2MTFiOCA0YWE0Njk3ZjU4MGIxMmEwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNTFmMTk1NzcyODljZGJmZiA2YmNlOWZhYmY4MmRmZDkzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMjFkNDMzN2Y0NzZlNGI5MCBlZDEzZGM3NzBmYTExYjA3KSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcihkYjQzY2UyZmU4YWQ2MTc1IGRmYmY4ZDZiMTE3MmQ5ZTkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyMGUxNTkwOWY3ODcxZGNlIDI2OWY1YmMzYjhiNWJjMWEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5Y2RlNzA5OTY1ZmIwMzRjIDM0N2I2ODliNzk5NzkwYTQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0ZDc2YTQ3YjJkNGRiYjRkIDhlMThlOTA2NjBhMjE1MDApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NGI4ZDQzY2ExY2NiNTIxIDc5OTZhYmIwNWQ5MmI2ZTcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1ZDIzZDRkN2VjZThiNDVkIDNjZjIwOGM0NzZjMzA4MjUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjODNlODkyNjA5YjI4ZTE0IGVmMmQ2OWJiZjNhZWUzZTUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1MDNkZjlmMDEyYTEzM2YyIDYxNzRjOWViMTc3ODY2NWQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihiMzZjNmVmNGZhYWYyYjBjIGQ5NGFmMjRhZDc5MmI2MWEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2Y2I1MTQ3ZTVlMzE2YjdkIDJhY2I4OWUzZWJmOGYyMzYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkZGNmYTJjNTQxYTRhMDgwIDcyYzVlNmRkZTI0ODZkNzkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwMWZkYmJlNjlkYzJhMjAyIDNjODBlMDBiNmZkNzQ5NDEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwODJiMjI4ZjA0MWE5MjVmIDQ5YzNlODdkZjFjODc5YTkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2MTc5YWEzNGZmMjIwYjA2IDA3MDE2YTE0OTNkODM5YzIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2YTZiYzg3MDY3MDk1OTk0IDhhNGZkYmY5NjhjZDA2MzEpKSkpKSkpKSkpKSkobWVzc2FnZXNfZm9yX25leHRfc3RlcF9wcm9vZigoYXBwX3N0YXRlKCkpKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnRzKCgweDAwNTAxNkU0QkI5NjBBOUNERUZGN0JGNzQ4QjdGMjA4RDQ0N0NBMzQ4MDY3RjVDNDU0NkI0QjVBQzA1RDRGMDEgMHgxMkUzNEMxNzBGMUQ5NTcxMEUyRjMzNjRBNDE2QjQwRUZBMEY4MkEzMTM5MjYyRjM4NDlCN0E3MTQ5NTY5RUE4KSgweDI5MDczNTA5ODNCQjVEQjg2MzNGM0I2RDNGQjcwNDUxMUM3RDhFMzM1MjY1MkJGMDc4OTQ1MzAyOEU1MDgyQUQgMHgxRTRBNzVCMzNEMUZGMjY5MzUxMjQ2NUNCNDEzNzgzMkQwRUE4RDJENjdBQkRGNENBNjVCNEVCMjVDOEZDRDQ4KSkpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTNmYWNhMmUwMjQyZGVlZiBjMDYzZTRkY2I2OTViNTg5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZmM2NTE4YzI5NDJlNDU5NyA1NjU1NTUyY2JkNzc3ZGI0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZDY0NmRmZjE4YWY1ZmU2NCBkNjQ3MDZhYjlkYzNlOGVkKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjJkZTkwZjkyMDY2ZmZkOCA0OGYzMGMzYTdkZDZjNmFkKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNjFkNzYwMmZlNzIyMGMxZSAxZjM5MjU0NjU4YmZiZWZjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYjIyOTQxODc5YWFjZjc2YyBiM2VhNmRiNmI1OTlkM2VjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTJhZmU1MzA0NDcxMWE1YSAxOTE2MzY3OTgyMTc3MDMwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWQwMWEyNGFlY2IxZjg3NiA2M2MwMDE4MGZjYTliN2E4KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYzJmNmY2YWNmYzdjMWI0YyAzMGRjZDBkZDk5YzM4ZDU5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYWM3OWNiODg5NGU1MGQ1NyBiNjc5NjZkNTE0N2NmMTYzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZTU2YTQ4NTU4NTU0M2U0YyAwMmJlNDI3N2JhNTQ3YTMzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjI5NTliNWFiZjMzYTYwMCBmYzk0ZGEyZTM3MWE3MDhlKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMDdlY2I5ZWI1ZjZiM2U0NCAyNjk5NzYzNmRhMTRhZTE0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTZmZWI3YzJjZDA0MjY4ZSAxMGY0YjkzMDYzNDBjOWYwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjExNTQyMDA1NzYzMmMwOSAwNGJhYTk5OTM3ZjQxNGZiKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNzY2Y2RlNTQxNGM4YWQyYSA0YWMzOWU1ZTFmZmJiOGYzKSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcigxMmM0ZTgxMTE3NjFhZWNiIDQzOWZlZDkwZmE0NjMxMWQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1NDRhYjY2YWMxZDYzYjRhIGEzYmJmMGYxMTg3ZDMyNGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4OWQ1M2ExN2MyYTFmNGM1IDY4NzFkODRiYzMwOTVkOGQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwZGQ2MjkzMzk2ZTQ3ODQxIGE5NTc4ZGExYzZiMzM3MzgpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5ZGJiYjE4OGJmMzdlODBhIDMzODQyZjcyOTBjYjljNjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5YmM4MzRlYmVmN2E5ZTlhIDAyMDdjYjM0YzBkNTU2NDQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4NGZlNDUxNTBkOTc0YTkwIDhhM2JkMGVlNmUxMjgxZDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3NDEzYzJhMjA3NmMyNWQ0IGQwODk5NTNlMDU4MTAxNjEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhMDNjNDNhMjg2OGNmZTFhIDMxNzdhMTU4OTk0MzgyYTUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxNTBmZjczNDVjOWQ1OGNmIGMzN2MzMzNhMTM1OGUwY2QpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihiNjcxNjRkZWFkYTkzMGJlIGExMDM0ZTc2N2NiZjZlMGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmNzk2YzhmMjE3ZGZjYmU3IDBjMDNmNjlmMmQ1NDYxNWIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihiNzc2MDczM2VhYzBlMDQxIGNmYmI3ZGUzNWMzNDZjZGUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3OTFiNzIxZjExMGYzMjMwIDUzZTBmMDFhZWRiYTQ2NDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkMTk0YzZjYTQzYjc1YTNjIGM1MjlhNTc0YjdkN2ViZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjNTcyZGZhNjVhOWVjNTU5IGFmMzg4ODUxOGJlYzg1ZDMpKSkpKSkpKSkpKSkocHJldl9ldmFscygoZXZhbHMoKHB1YmxpY19pbnB1dCgweDNBMTQ2RDEyMkMwRUU0MzI0NjUzMDdENzVFNEE2OEFGODQ1MkFBRkM5NDc2M0M0QTdFRjEwREM1MjQ1NDI3NjEgMHgyQkQ4MEM4MDAyQTEzNTkzQ0M0REQ3MUM4N0I4QTlFQjBEMEZCQjIzNjM4QUVGNTM0NzU2Q0I0MDAyRDc0MUU5KSkoZXZhbHMoKHcoKCgweDIxM0UwQ0U5MzMzRTg1ODYxMkM1NzlFNjc1NDEwMUM3QzcwRjZFQkE0RjM5RTEzNkMzNkIzNzM2RkE0RjRCMEUpKDB4MTUyNjIyMDk2MzczREM0N0U2NzY4QUVDM0VFRTI3NjQwN0M1NUVGRUZCMjhBNkRBMzlGRENCQkMyMDVFQ0ExMSkpKCgweDFGMUU0MjU2RUIzRUMxQTE0NjY4NkJFQTg5MDFFQzE3QkNEQUE5QjBGNEUxMkFFNEMzMjRDMTcxMDhBNDZBNDcpKDB4MjNGMkQ3NzlEMTYxNEQ4MTYxQ0IwQzY0QzFFNUQzMjkzOTlGMDhFNDA4OEVCNUIwNTQ3RUZDRTAwMDM5RUY0NykpKCgweDJDRjk5NDNEQzUzMjA3NzlCQ0VDRDlCRTUxMTc1QUE5RkQyQkNBNjYzQzI3ODE4QjNGRkNGNkIzMzM4RDc2QTgpKDB4MEFFRDgzMjIwMEJCOTA2MDI4MjcxQzFFMTFERkU3RDYxMjA5Q0QyQ0JDQ0Q5NUQ5NkZDRkJDRDg4MTlGMDE0QSkpKCgweDM1NzlGM0JBQjRDMkI5NzBFOTc3NTMyOUZCQzkyRjhCMEM5NDY4Nzc2OTUwNkNEOEI5NTY1M0ZDMUQ3QjI4MDUpKDB4MEFDOUM1MkE1REMzMzJENDRGQThCRTk2QjJDMzIyQjIwODdFMDlFQ0FFM0NBMTYyREIwMjIzQTEzQkNEMjdFOSkpKCgweDJFMEQ3MEJEN0UxRTRFNUYzNDBCOEIxNzZBMDk5RUYzN0U4MzI5MUI0MTBBQTdGQUJEODkyNzc5MTMzNUIwNjEpKDB4MEI1QjI2NDIwQjJBRTM2M0IyNzgzRTQ4M0E1N0FFNEQ3QTUwNkExMUU2NzJENDUzMkQ1REQyN0NGNUE1QkMyNikpKCgweDA3NDY5ODc3NTAyNEM3OEJFMEZEM0JEQUU5Qjk5M0ZGM0U4MTlGMjZBODkwMEQ1REEwQjVGOEZCRDExNkI1NzApKDB4MTM3Rjg0MUI4RjFBRjE5QTQ2OTA0MzMzNjk0NkI1Q0EzRDVEMDBDNDUxMDVENzU4OThFQTlFNzQyRUQxN0M4QykpKCgweDFFMDQwQTZCODIxNzE5MThENjMxRDg5QkMyN0RGQUNBMzZFMjgyQ0Y1MDBCNEU4ODY2MjkwM0YzQjE3MzE5QTMpKDB4MjZDMzE5NzE3ODYwNTc2OEQ2MzEyRDFFQjFCNzYzQkFFMDhCQTRFMkFDNTNCREQ2RDBBNTU1RTVDOTYwNEZEOCkpKCgweDNGQTVFRkExNkVBQ0JGOTg4MkNDRDkxQjkxOENDODdBM0JDQUZDRUMzNkMwOEU5QTI2NDExOUQyMjMwRDM0NUMpKDB4Mjk1QjFDNjg1MTA1REIyRDg1MjBBMDlBQjZDOEE2RTAyQUM0NEU1RTQ2NzI5Njc1NEU0OTQ3MjM5REQ1MDhFQikpKCgweDJBRUI4RjE3MkZGRkRFNTZENUMxM0NCQjJCN0ZEOEUwNTRFNTVBODU5NkQ0RUYxRkY0NzVBOTgwNTBCM0JFNzUpKDB4Mjg4MDcyNDBCMjAxQUU1QzA1N0I2NjJGMDI1OEU0QjIyREUyMDkzRjdDRjBDRjcyMEE5OUEzQjlCRTJGOUUyMikpKCgw'... 25411 more characters
}

[12:21:56 AM] 2024-05-12T21:21:45.104Z	INFO	zkCloudWorker Execute start: {
  command: 'execute',
  developer: 'DFST',
  repo: 'worker-example',
  id: '6459034946',
  jobId: '6459034946.1715548904948.PCMuwvyRLwMcIcESY1HQRCAhpVU0TWp1',
  job: {
    metadata: 'many',
    logStreams: [],
    task: 'many',
    maxAttempts: 0,
    args: '{"contractAddress":"B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD","isMany":true,"proof":"{\\n  \\"publicInput\\": [],\\n  \\"publicOutput\\": [\\n    \\"866\\",\\n    \\"1000\\"\\n  ],\\n  \\"maxProofsVerified\\": 2,\\n  \\"proof\\": \\"KChzdGF0ZW1lbnQoKHByb29mX3N0YXRlKChkZWZlcnJlZF92YWx1ZXMoKHBsb25rKChhbHBoYSgoaW5uZXIoYWM1MTVkY2Q4NDg2MzM4MiBkZjliZWE1YzFiMTM2MTVjKSkpKShiZXRhKGQyMDhlYTkxMmU1MDY2Y2EgYzExMDFlMWE0NDYzZjdkNSkpKGdhbW1hKDhiNTA0ZGVmZDU2NzliOGMgN2U5OTU3OTFlZjcwZGFkZikpKHpldGEoKGlubmVyKGQwNmZmMzVhNWM1YmUyYmIgNzdkMjZkOGQxZDhhYTE2ZCkpKSkoam9pbnRfY29tYmluZXIoKSkoZmVhdHVyZV9mbGFncygocmFuZ2VfY2hlY2swIGZhbHNlKShyYW5nZV9jaGVjazEgZmFsc2UpKGZvcmVpZ25fZmllbGRfYWRkIGZhbHNlKShmb3JlaWduX2ZpZWxkX211bCBmYWxzZSkoeG9yIGZhbHNlKShyb3QgZmFsc2UpKGxvb2t1cCBmYWxzZSkocnVudGltZV90YWJsZXMgZmFsc2UpKSkpKShidWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgocHJlY2hhbGxlbmdlKChpbm5lcihmYWY3ZjQ0MDcwZWJlZTJhIDYwNDk3MDIzMGI4NTcwZGIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmYTcwNTBhMmE0MjYyNDFhIDVkMTAwMzI4YThkOGMyZDUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNGJmOGI2ZTJlMDA3MTU1IDdmZDBjNmY3ZTRkNzJkZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NThmMmMzMzc3NTA4NGNmIDJkMGE4NmExOWY5YmIwZDQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0MGM2NjRjMjk0MThlNjhiIDQ3MTVkZmUzYmE2NmQ4NGIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5ZGFlNmYxOGRkZGJlNTJkIDUxZjk0MmM1YjcwMDcwNjYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwYjZiZDM4N2QyZTQ3MTNlIDI2NGE1YTcyMTQ4MDA4MjQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjNmUxYmFjNmRjY2E3NTQyIDdjMTE5ZTA4MzU0YTU1ZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5N2ZlYWE2MTIzZmZlMWU3IGExZWQyNDJkNzY1MDg0NWQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNTQ0NjFjNzhhZmQzYTk5IGZkZWM1ZDgzMTg4ZDY2NDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkNjdlODE0NDMxYmFlOWY0IDUzMDI3MTY5NGUwMjIxYWIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmNjZhODEzNzM0MGI3OGNhIDEwNGU3YTI4ZTg3NGI4NzYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxOTUzOGQ5MDI3Yzk2ODVlIDdmOGUxOGVkNzk5MTVhNzEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjNTNjM2NhYTQ4OWE0MGIwIDIyMWQ3NGFkNTRlZWU5NmEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlNTEwMGY2NTE4MGI3MzI1IDI4NDY5YjI1OGU3NjE0Y2MpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NGE0ZDcwZTgwZmU4YmJlIGQ2NTE5YmIzNWZiY2IzYjQpKSkpKSkpKGJyYW5jaF9kYXRhKChwcm9vZnNfdmVyaWZpZWQgTjIpKGRvbWFpbl9sb2cyIlwwMTUiKSkpKSkoc3BvbmdlX2RpZ2VzdF9iZWZvcmVfZXZhbHVhdGlvbnMoNGRmNDcxMTYxMjM0ZTJhZCA3YTQ5ZmMxZmJmYzgyMWUzIGFmMDRhNTI0MjM0NTU5MWEgMzUwMDlkNDBjZGI3Y2NhNSkpKG1lc3NhZ2VzX2Zvcl9uZXh0X3dyYXBfcHJvb2YoKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnQoMHgyRTg5NkM1Q0Y0Qzg2RTk4OEM2RjIwMDZGQjU0MTczNDUxRDU4QTg0MTQ0QjRCODJENjRFNkQxOUNBNEM0ODI4IDB4MEU0RDM3MUU5ODI1OTNBRkYyNTlDRTU1QzkxQkJDQzkwNEJBRDUzOUQ0RTgxREQ5OTI2MjAyOEQ1MTU0QjQ5NikpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTUxZDYzMGI0Y2NkMGFmMCA5ZGFlMjhkYzhhMjc2YTFjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMDlmYzc3Zjc3MDBhOWY0MCAxNjM2ZWM4ZTZkNGZhMjZmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNDRiZWNkYzJhNzY3NjJmYSA4YTQ3MjhkZGRhNTgxNWY5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWRmZjM5ODkzOGNkNWI2OCBhNjA2OWE5MjEyZTJmMmVhKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoN2M5YWRiMDRlZjBhYzA0NSBkNDgyZDA4NmRmYzU3ZWFjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoOTVjMjUzYzIyODc0YjMxMyA2ODEyZTlkY2M4NDNlMGIzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMTcwYWRmOTJlMmNlMGYwYSBlOWNhYzA5Y2UzY2E2MGQ2KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMmZlMTg2MDhjZjliNmFlNiA3ODkzZDJhMzczNjA1NjNmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNGIxM2NmMGNjMTczMGNiMSA4NDVmZTNiMTJlNjU4NzcxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoOGFhOGQ0ODVkN2Y2OTBlYSBmNDIzMmZmNDM2MTg0YzVmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWExYmM2MjhjMTkxZTIzZSA3NTYzNTE3NjMwN2FkZTdiKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoM2IwY2ZiZDQ4MDU5MWNhOSBjOGNlNjA5YmUyYTZlMTM5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMmUxOTQ4Y2M4YTM2MTFiOCA0YWE0Njk3ZjU4MGIxMmEwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNTFmMTk1NzcyODljZGJmZiA2YmNlOWZhYmY4MmRmZDkzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMjFkNDMzN2Y0NzZlNGI5MCBlZDEzZGM3NzBmYTExYjA3KSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcihkYjQzY2UyZmU4YWQ2MTc1IGRmYmY4ZDZiMTE3MmQ5ZTkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyMGUxNTkwOWY3ODcxZGNlIDI2OWY1YmMzYjhiNWJjMWEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5Y2RlNzA5OTY1ZmIwMzRjIDM0N2I2ODliNzk5NzkwYTQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0ZDc2YTQ3YjJkNGRiYjRkIDhlMThlOTA2NjBhMjE1MDApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NGI4ZDQzY2ExY2NiNTIxIDc5OTZhYmIwNWQ5MmI2ZTcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1ZDIzZDRkN2VjZThiNDVkIDNjZjIwOGM0NzZjMzA4MjUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjODNlODkyNjA5YjI4ZTE0IGVmMmQ2OWJiZjNhZWUzZTUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1MDNkZjlmMDEyYTEzM2YyIDYxNzRjOWViMTc3ODY2NWQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihiMzZjNmVmNGZhYWYyYjBjIGQ5NGFmMjRhZDc5MmI2MWEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2Y2I1MTQ3ZTVlMzE2YjdkIDJhY2I4OWUzZWJmOGYyMzYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkZGNmYTJjNTQxYTRhMDgwIDcyYzVlNmRkZTI0ODZkNzkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwMWZkYmJlNjlkYzJhMjAyIDNjODBlMDBiNmZkNzQ5NDEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwODJiMjI4ZjA0MWE5MjVmIDQ5YzNlODdkZjFjODc5YTkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2MTc5YWEzNGZmMjIwYjA2IDA3MDE2YTE0OTNkODM5YzIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2YTZiYzg3MDY3MDk1OTk0IDhhNGZkYmY5NjhjZDA2MzEpKSkpKSkpKSkpKSkobWVzc2FnZXNfZm9yX25leHRfc3RlcF9wcm9vZigoYXBwX3N0YXRlKCkpKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnRzKCgweDAwNTAxNkU0QkI5NjBBOUNERUZGN0JGNzQ4QjdGMjA4RDQ0N0NBMzQ4MDY3RjVDNDU0NkI0QjVBQzA1RDRGMDEgMHgxMkUzNEMxNzBGMUQ5NTcxMEUyRjMzNjRBNDE2QjQwRUZBMEY4MkEzMTM5MjYyRjM4NDlCN0E3MTQ5NTY5RUE4KSgweDI5MDczNTA5ODNCQjVEQjg2MzNGM0I2RDNGQjcwNDUxMUM3RDhFMzM1MjY1MkJGMDc4OTQ1MzAyOEU1MDgyQUQgMHgxRTRBNzVCMzNEMUZGMjY5MzUxMjQ2NUNCNDEzNzgzMkQwRUE4RDJENjdBQkRGNENBNjVCNEVCMjVDOEZDRDQ4KSkpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTNmYWNhMmUwMjQyZGVlZiBjMDYzZTRkY2I2OTViNTg5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZmM2NTE4YzI5NDJlNDU5NyA1NjU1NTUyY2JkNzc3ZGI0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZDY0NmRmZjE4YWY1ZmU2NCBkNjQ3MDZhYjlkYzNlOGVkKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjJkZTkwZjkyMDY2ZmZkOCA0OGYzMGMzYTdkZDZjNmFkKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNjFkNzYwMmZlNzIyMGMxZSAxZjM5MjU0NjU4YmZiZWZjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYjIyOTQxODc5YWFjZjc2YyBiM2VhNmRiNmI1OTlkM2VjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTJhZmU1MzA0NDcxMWE1YSAxOTE2MzY3OTgyMTc3MDMwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWQwMWEyNGFlY2IxZjg3NiA2M2MwMDE4MGZjYTliN2E4KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYzJmNmY2YWNmYzdjMWI0YyAzMGRjZDBkZDk5YzM4ZDU5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYWM3OWNiODg5NGU1MGQ1NyBiNjc5NjZkNTE0N2NmMTYzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZTU2YTQ4NTU4NTU0M2U0YyAwMmJlNDI3N2JhNTQ3YTMzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjI5NTliNWFiZjMzYTYwMCBmYzk0ZGEyZTM3MWE3MDhlKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMDdlY2I5ZWI1ZjZiM2U0NCAyNjk5NzYzNmRhMTRhZTE0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTZmZWI3YzJjZDA0MjY4ZSAxMGY0YjkzMDYzNDBjOWYwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjExNTQyMDA1NzYzMmMwOSAwNGJhYTk5OTM3ZjQxNGZiKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNzY2Y2RlNTQxNGM4YWQyYSA0YWMzOWU1ZTFmZmJiOGYzKSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcigxMmM0ZTgxMTE3NjFhZWNiIDQzOWZlZDkwZmE0NjMxMWQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1NDRhYjY2YWMxZDYzYjRhIGEzYmJmMGYxMTg3ZDMyNGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4OWQ1M2ExN2MyYTFmNGM1IDY4NzFkODRiYzMwOTVkOGQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwZGQ2MjkzMzk2ZTQ3ODQxIGE5NTc4ZGExYzZiMzM3MzgpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5ZGJiYjE4OGJmMzdlODBhIDMzODQyZjcyOTBjYjljNjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5YmM4MzRlYmVmN2E5ZTlhIDAyMDdjYjM0YzBkNTU2NDQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4NGZlNDUxNTBkOTc0YTkwIDhhM2JkMGVlNmUxMjgxZDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3NDEzYzJhMjA3NmMyNWQ0IGQwODk5NTNlMDU4MTAxNjEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhMDNjNDNhMjg2OGNmZTFhIDMxNzdhMTU4OTk0MzgyYTUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxNTBmZjczNDVjOWQ1OGNmIGMzN2MzMzNhMTM1OGUwY2QpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihiNjcxNjRkZWFkYTkzMGJlIGExMDM0ZTc2N2NiZjZlMGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmNzk2YzhmMjE3ZGZjYmU3IDBjMDNmNjlmMmQ1NDYxNWIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihiNzc2MDczM2VhYzBlMDQxIGNmYmI3ZGUzNWMzNDZjZGUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3OTFiNzIxZjExMGYzMjMwIDUzZTBmMDFhZWRiYTQ2NDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkMTk0YzZjYTQzYjc1YTNjIGM1MjlhNTc0YjdkN2ViZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjNTcyZGZhNjVhOWVjNTU5IGFmMzg4ODUxOGJlYzg1ZDMpKSkpKSkpKSkpKSkocHJldl9ldmFscygoZXZhbHMoKHB1YmxpY19pbnB1dCgweDNBMTQ2RDEyMkMwRUU0MzI0NjUzMDdENzVFNEE2OEFGODQ1MkFBRkM5NDc2M0M0QTdFRjEwREM1MjQ1NDI3NjEgMHgyQkQ4MEM4MDAyQTEzNTkzQ0M0REQ3MUM4N0I4QTlFQjBEMEZCQjIzNjM4QUVGNTM0NzU2Q0I0MDAyRDc0MUU5KSkoZXZhbHMoKHcoKCgweDIxM0UwQ0U5MzMzRTg1ODYxMkM1NzlFNjc1NDEwMUM3QzcwRjZFQkE0RjM5RTEzNkMzNkIzNzM2RkE0RjRCMEUpKDB4MTUyNjIyMDk2MzczREM0N0U2NzY4QUVDM0VFRTI3NjQwN0M1NUVGRUZCMjhBNkRBMzlGRENCQkMyMDVFQ0ExMSkpKCgweDFGMUU0MjU2RUIzRUMxQTE0NjY4NkJFQTg5MDFFQzE3QkNEQUE5QjBGNEUxMkFFNEMzMjRDMTcxMDhBNDZBNDcpKDB4MjNGMkQ3NzlEMTYxNEQ4MTYxQ0IwQzY0QzFFNUQzMjkzOTlGMDhFNDA4OEVCNUIwNTQ3RUZDRTAwMDM5RUY0NykpKCgweDJDRjk5NDNEQzUzMjA3NzlCQ0VDRDlCRTUxMTc1QUE5RkQyQkNBNjYzQzI3ODE4QjNGRkNGNkIzMzM4RDc2QTgpKDB4MEFFRDgzMjIwMEJCOTA2MDI4MjcxQzFFMTFERkU3RDYxMjA5Q0QyQ0JDQ0Q5NUQ5NkZDRkJDRDg4MTlGMDE0QSkpKCgweDM1NzlGM0JBQjRDMkI5NzBFOTc3NTMyOUZCQzkyRjhCMEM5NDY4Nzc2OTUwNkNEOEI5NTY1M0ZDMUQ3QjI4MDUpKDB4MEFDOUM1MkE1REMzMzJENDRGQThCRTk2QjJDMzIyQjIwODdFMDlFQ0FFM0NBMTYyREIwMjIzQTEzQkNEMjdFOSkpKCgweDJFMEQ3MEJEN0UxRTRFNUYzNDBCOEIxNzZBMDk5RUYzN0U4MzI5MUI0MTBBQTdGQUJEODkyNzc5MTMzNUIwNjEpKDB4MEI1QjI2NDIwQjJBRTM2M0IyNzgzRTQ4M0E1N0FFNEQ3QTUwNkExMUU2NzJENDUzMkQ1REQyN0NGNUE1QkMyNikpKCgweDA3NDY5ODc3NTAyNEM3OEJFMEZEM0JEQUU5Qjk5M0ZGM0U4MTlGMjZBODkwMEQ1REEwQjVGOEZCRDExNkI1NzApKDB4MTM3Rjg0MUI4RjFBRjE5QTQ2OTA0MzMzNjk0NkI1Q0EzRDVEMDBDNDUxMDVENzU4OThFQTlFNzQyRUQxN0M4QykpKCgweDFFMDQwQTZCODIxNzE5MThENjMxRDg5QkMyN0RGQUNBMzZFMjgyQ0Y1MDBCNEU4ODY2MjkwM0YzQjE3MzE5QTMpKDB4MjZDMzE5NzE3ODYwNTc2OEQ2MzEyRDFFQjFCNzYzQkFFMDhCQTRFMkFDNTNCREQ2RDBBNTU1RTVDOTYwNEZEOCkpKCgweDNGQTVFRkExNkVBQ0JGOTg4MkNDRDkxQjkxOENDODdBM0JDQUZDRUMzNkMwOEU5QTI2NDExOUQyMjMwRDM0NUMpKDB4Mjk1QjFDNjg1MTA1REIyRDg1MjBBMDlBQjZDOEE2RTAyQUM0NEU1RTQ2NzI5Njc1NEU0OTQ3MjM5REQ1MDhFQikpKCgweDJBRUI4RjE3MkZGRkRFNTZENUMxM0NCQjJCN0ZEOEUwNTRFNTVBODU5NkQ0RUYxRkY0NzVBOTgwNTBCM0JFNzUpKDB4Mjg4MDcyNDBCMjAxQUU1QzA1N0I2NjJGMDI1OEU0QjIyREUyMDkzRjdDRjBDRjcyMEE5OUEzQjlCRTJGOUUyMikpKCgw'... 25411 more characters,
    timeCreated: 1715548904948,
    timeCreatedString: '2024-05-12T21:21:44.948Z',
    jobId: '6459034946.1715548904948.PCMuwvyRLwMcIcESY1HQRCAhpVU0TWp1',
    repo: 'worker-example',
    developer: 'DFST',
    chain: 'devnet',
    txNumber: 1,
    jobStatus: 'created',
    id: '6459034946'
  }
}

[12:21:56 AM] 2024-05-12T21:21:45.104Z	INFO	RSS memory start: 3401 MB, changed by 0 MB

[12:21:56 AM] 2024-05-12T21:21:45.105Z	INFO	CloudWorker: constructor {
  id: '6459034946',
  jobId: '6459034946.1715548904948.PCMuwvyRLwMcIcESY1HQRCAhpVU0TWp1',
  developer: 'DFST',
  repo: 'worker-example',
  task: 'many',
  taskId: undefined,
  userId: undefined,
  args: '{"contractAddress":"B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD","isMany":true,"proof":"{\\n  \\"publicInput\\": [],\\n  \\"publicOutput\\": [\\n    \\"866\\",\\n    \\"1000\\"\\n  ],\\n  \\"maxProofsVerified\\": 2,\\n  \\"proof\\": \\"KChzdGF0ZW1lbnQoKHByb29mX3N0YXRlKChkZWZlcnJlZF92YWx1ZXMoKHBsb25rKChhbHBoYSgoaW5uZXIoYWM1MTVkY2Q4NDg2MzM4MiBkZjliZWE1YzFiMTM2MTVjKSkpKShiZXRhKGQyMDhlYTkxMmU1MDY2Y2EgYzExMDFlMWE0NDYzZjdkNSkpKGdhbW1hKDhiNTA0ZGVmZDU2NzliOGMgN2U5OTU3OTFlZjcwZGFkZikpKHpldGEoKGlubmVyKGQwNmZmMzVhNWM1YmUyYmIgNzdkMjZkOGQxZDhhYTE2ZCkpKSkoam9pbnRfY29tYmluZXIoKSkoZmVhdHVyZV9mbGFncygocmFuZ2VfY2hlY2swIGZhbHNlKShyYW5nZV9jaGVjazEgZmFsc2UpKGZvcmVpZ25fZmllbGRfYWRkIGZhbHNlKShmb3JlaWduX2ZpZWxkX211bCBmYWxzZSkoeG9yIGZhbHNlKShyb3QgZmFsc2UpKGxvb2t1cCBmYWxzZSkocnVudGltZV90YWJsZXMgZmFsc2UpKSkpKShidWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgocHJlY2hhbGxlbmdlKChpbm5lcihmYWY3ZjQ0MDcwZWJlZTJhIDYwNDk3MDIzMGI4NTcwZGIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmYTcwNTBhMmE0MjYyNDFhIDVkMTAwMzI4YThkOGMyZDUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNGJmOGI2ZTJlMDA3MTU1IDdmZDBjNmY3ZTRkNzJkZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NThmMmMzMzc3NTA4NGNmIDJkMGE4NmExOWY5YmIwZDQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0MGM2NjRjMjk0MThlNjhiIDQ3MTVkZmUzYmE2NmQ4NGIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5ZGFlNmYxOGRkZGJlNTJkIDUxZjk0MmM1YjcwMDcwNjYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwYjZiZDM4N2QyZTQ3MTNlIDI2NGE1YTcyMTQ4MDA4MjQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjNmUxYmFjNmRjY2E3NTQyIDdjMTE5ZTA4MzU0YTU1ZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5N2ZlYWE2MTIzZmZlMWU3IGExZWQyNDJkNzY1MDg0NWQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNTQ0NjFjNzhhZmQzYTk5IGZkZWM1ZDgzMTg4ZDY2NDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkNjdlODE0NDMxYmFlOWY0IDUzMDI3MTY5NGUwMjIxYWIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmNjZhODEzNzM0MGI3OGNhIDEwNGU3YTI4ZTg3NGI4NzYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxOTUzOGQ5MDI3Yzk2ODVlIDdmOGUxOGVkNzk5MTVhNzEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjNTNjM2NhYTQ4OWE0MGIwIDIyMWQ3NGFkNTRlZWU5NmEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlNTEwMGY2NTE4MGI3MzI1IDI4NDY5YjI1OGU3NjE0Y2MpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NGE0ZDcwZTgwZmU4YmJlIGQ2NTE5YmIzNWZiY2IzYjQpKSkpKSkpKGJyYW5jaF9kYXRhKChwcm9vZnNfdmVyaWZpZWQgTjIpKGRvbWFpbl9sb2cyIlwwMTUiKSkpKSkoc3BvbmdlX2RpZ2VzdF9iZWZvcmVfZXZhbHVhdGlvbnMoNGRmNDcxMTYxMjM0ZTJhZCA3YTQ5ZmMxZmJmYzgyMWUzIGFmMDRhNTI0MjM0NTU5MWEgMzUwMDlkNDBjZGI3Y2NhNSkpKG1lc3NhZ2VzX2Zvcl9uZXh0X3dyYXBfcHJvb2YoKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnQoMHgyRTg5NkM1Q0Y0Qzg2RTk4OEM2RjIwMDZGQjU0MTczNDUxRDU4QTg0MTQ0QjRCODJENjRFNkQxOUNBNEM0ODI4IDB4MEU0RDM3MUU5ODI1OTNBRkYyNTlDRTU1QzkxQkJDQzkwNEJBRDUzOUQ0RTgxREQ5OTI2MjAyOEQ1MTU0QjQ5NikpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTUxZDYzMGI0Y2NkMGFmMCA5ZGFlMjhkYzhhMjc2YTFjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMDlmYzc3Zjc3MDBhOWY0MCAxNjM2ZWM4ZTZkNGZhMjZmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNDRiZWNkYzJhNzY3NjJmYSA4YTQ3MjhkZGRhNTgxNWY5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWRmZjM5ODkzOGNkNWI2OCBhNjA2OWE5MjEyZTJmMmVhKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoN2M5YWRiMDRlZjBhYzA0NSBkNDgyZDA4NmRmYzU3ZWFjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoOTVjMjUzYzIyODc0YjMxMyA2ODEyZTlkY2M4NDNlMGIzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMTcwYWRmOTJlMmNlMGYwYSBlOWNhYzA5Y2UzY2E2MGQ2KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMmZlMTg2MDhjZjliNmFlNiA3ODkzZDJhMzczNjA1NjNmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNGIxM2NmMGNjMTczMGNiMSA4NDVmZTNiMTJlNjU4NzcxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoOGFhOGQ0ODVkN2Y2OTBlYSBmNDIzMmZmNDM2MTg0YzVmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWExYmM2MjhjMTkxZTIzZSA3NTYzNTE3NjMwN2FkZTdiKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoM2IwY2ZiZDQ4MDU5MWNhOSBjOGNlNjA5YmUyYTZlMTM5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMmUxOTQ4Y2M4YTM2MTFiOCA0YWE0Njk3ZjU4MGIxMmEwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNTFmMTk1NzcyODljZGJmZiA2YmNlOWZhYmY4MmRmZDkzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMjFkNDMzN2Y0NzZlNGI5MCBlZDEzZGM3NzBmYTExYjA3KSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcihkYjQzY2UyZmU4YWQ2MTc1IGRmYmY4ZDZiMTE3MmQ5ZTkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyMGUxNTkwOWY3ODcxZGNlIDI2OWY1YmMzYjhiNWJjMWEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5Y2RlNzA5OTY1ZmIwMzRjIDM0N2I2ODliNzk5NzkwYTQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0ZDc2YTQ3YjJkNGRiYjRkIDhlMThlOTA2NjBhMjE1MDApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NGI4ZDQzY2ExY2NiNTIxIDc5OTZhYmIwNWQ5MmI2ZTcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1ZDIzZDRkN2VjZThiNDVkIDNjZjIwOGM0NzZjMzA4MjUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjODNlODkyNjA5YjI4ZTE0IGVmMmQ2OWJiZjNhZWUzZTUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1MDNkZjlmMDEyYTEzM2YyIDYxNzRjOWViMTc3ODY2NWQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihiMzZjNmVmNGZhYWYyYjBjIGQ5NGFmMjRhZDc5MmI2MWEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2Y2I1MTQ3ZTVlMzE2YjdkIDJhY2I4OWUzZWJmOGYyMzYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkZGNmYTJjNTQxYTRhMDgwIDcyYzVlNmRkZTI0ODZkNzkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwMWZkYmJlNjlkYzJhMjAyIDNjODBlMDBiNmZkNzQ5NDEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwODJiMjI4ZjA0MWE5MjVmIDQ5YzNlODdkZjFjODc5YTkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2MTc5YWEzNGZmMjIwYjA2IDA3MDE2YTE0OTNkODM5YzIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2YTZiYzg3MDY3MDk1OTk0IDhhNGZkYmY5NjhjZDA2MzEpKSkpKSkpKSkpKSkobWVzc2FnZXNfZm9yX25leHRfc3RlcF9wcm9vZigoYXBwX3N0YXRlKCkpKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnRzKCgweDAwNTAxNkU0QkI5NjBBOUNERUZGN0JGNzQ4QjdGMjA4RDQ0N0NBMzQ4MDY3RjVDNDU0NkI0QjVBQzA1RDRGMDEgMHgxMkUzNEMxNzBGMUQ5NTcxMEUyRjMzNjRBNDE2QjQwRUZBMEY4MkEzMTM5MjYyRjM4NDlCN0E3MTQ5NTY5RUE4KSgweDI5MDczNTA5ODNCQjVEQjg2MzNGM0I2RDNGQjcwNDUxMUM3RDhFMzM1MjY1MkJGMDc4OTQ1MzAyOEU1MDgyQUQgMHgxRTRBNzVCMzNEMUZGMjY5MzUxMjQ2NUNCNDEzNzgzMkQwRUE4RDJENjdBQkRGNENBNjVCNEVCMjVDOEZDRDQ4KSkpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTNmYWNhMmUwMjQyZGVlZiBjMDYzZTRkY2I2OTViNTg5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZmM2NTE4YzI5NDJlNDU5NyA1NjU1NTUyY2JkNzc3ZGI0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZDY0NmRmZjE4YWY1ZmU2NCBkNjQ3MDZhYjlkYzNlOGVkKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjJkZTkwZjkyMDY2ZmZkOCA0OGYzMGMzYTdkZDZjNmFkKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNjFkNzYwMmZlNzIyMGMxZSAxZjM5MjU0NjU4YmZiZWZjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYjIyOTQxODc5YWFjZjc2YyBiM2VhNmRiNmI1OTlkM2VjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTJhZmU1MzA0NDcxMWE1YSAxOTE2MzY3OTgyMTc3MDMwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWQwMWEyNGFlY2IxZjg3NiA2M2MwMDE4MGZjYTliN2E4KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYzJmNmY2YWNmYzdjMWI0YyAzMGRjZDBkZDk5YzM4ZDU5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYWM3OWNiODg5NGU1MGQ1NyBiNjc5NjZkNTE0N2NmMTYzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZTU2YTQ4NTU4NTU0M2U0YyAwMmJlNDI3N2JhNTQ3YTMzKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjI5NTliNWFiZjMzYTYwMCBmYzk0ZGEyZTM3MWE3MDhlKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMDdlY2I5ZWI1ZjZiM2U0NCAyNjk5NzYzNmRhMTRhZTE0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTZmZWI3YzJjZDA0MjY4ZSAxMGY0YjkzMDYzNDBjOWYwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjExNTQyMDA1NzYzMmMwOSAwNGJhYTk5OTM3ZjQxNGZiKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNzY2Y2RlNTQxNGM4YWQyYSA0YWMzOWU1ZTFmZmJiOGYzKSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcigxMmM0ZTgxMTE3NjFhZWNiIDQzOWZlZDkwZmE0NjMxMWQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1NDRhYjY2YWMxZDYzYjRhIGEzYmJmMGYxMTg3ZDMyNGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4OWQ1M2ExN2MyYTFmNGM1IDY4NzFkODRiYzMwOTVkOGQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwZGQ2MjkzMzk2ZTQ3ODQxIGE5NTc4ZGExYzZiMzM3MzgpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5ZGJiYjE4OGJmMzdlODBhIDMzODQyZjcyOTBjYjljNjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5YmM4MzRlYmVmN2E5ZTlhIDAyMDdjYjM0YzBkNTU2NDQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4NGZlNDUxNTBkOTc0YTkwIDhhM2JkMGVlNmUxMjgxZDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3NDEzYzJhMjA3NmMyNWQ0IGQwODk5NTNlMDU4MTAxNjEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhMDNjNDNhMjg2OGNmZTFhIDMxNzdhMTU4OTk0MzgyYTUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxNTBmZjczNDVjOWQ1OGNmIGMzN2MzMzNhMTM1OGUwY2QpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihiNjcxNjRkZWFkYTkzMGJlIGExMDM0ZTc2N2NiZjZlMGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmNzk2YzhmMjE3ZGZjYmU3IDBjMDNmNjlmMmQ1NDYxNWIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihiNzc2MDczM2VhYzBlMDQxIGNmYmI3ZGUzNWMzNDZjZGUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3OTFiNzIxZjExMGYzMjMwIDUzZTBmMDFhZWRiYTQ2NDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkMTk0YzZjYTQzYjc1YTNjIGM1MjlhNTc0YjdkN2ViZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjNTcyZGZhNjVhOWVjNTU5IGFmMzg4ODUxOGJlYzg1ZDMpKSkpKSkpKSkpKSkocHJldl9ldmFscygoZXZhbHMoKHB1YmxpY19pbnB1dCgweDNBMTQ2RDEyMkMwRUU0MzI0NjUzMDdENzVFNEE2OEFGODQ1MkFBRkM5NDc2M0M0QTdFRjEwREM1MjQ1NDI3NjEgMHgyQkQ4MEM4MDAyQTEzNTkzQ0M0REQ3MUM4N0I4QTlFQjBEMEZCQjIzNjM4QUVGNTM0NzU2Q0I0MDAyRDc0MUU5KSkoZXZhbHMoKHcoKCgweDIxM0UwQ0U5MzMzRTg1ODYxMkM1NzlFNjc1NDEwMUM3QzcwRjZFQkE0RjM5RTEzNkMzNkIzNzM2RkE0RjRCMEUpKDB4MTUyNjIyMDk2MzczREM0N0U2NzY4QUVDM0VFRTI3NjQwN0M1NUVGRUZCMjhBNkRBMzlGRENCQkMyMDVFQ0ExMSkpKCgweDFGMUU0MjU2RUIzRUMxQTE0NjY4NkJFQTg5MDFFQzE3QkNEQUE5QjBGNEUxMkFFNEMzMjRDMTcxMDhBNDZBNDcpKDB4MjNGMkQ3NzlEMTYxNEQ4MTYxQ0IwQzY0QzFFNUQzMjkzOTlGMDhFNDA4OEVCNUIwNTQ3RUZDRTAwMDM5RUY0NykpKCgweDJDRjk5NDNEQzUzMjA3NzlCQ0VDRDlCRTUxMTc1QUE5RkQyQkNBNjYzQzI3ODE4QjNGRkNGNkIzMzM4RDc2QTgpKDB4MEFFRDgzMjIwMEJCOTA2MDI4MjcxQzFFMTFERkU3RDYxMjA5Q0QyQ0JDQ0Q5NUQ5NkZDRkJDRDg4MTlGMDE0QSkpKCgweDM1NzlGM0JBQjRDMkI5NzBFOTc3NTMyOUZCQzkyRjhCMEM5NDY4Nzc2OTUwNkNEOEI5NTY1M0ZDMUQ3QjI4MDUpKDB4MEFDOUM1MkE1REMzMzJENDRGQThCRTk2QjJDMzIyQjIwODdFMDlFQ0FFM0NBMTYyREIwMjIzQTEzQkNEMjdFOSkpKCgweDJFMEQ3MEJEN0UxRTRFNUYzNDBCOEIxNzZBMDk5RUYzN0U4MzI5MUI0MTBBQTdGQUJEODkyNzc5MTMzNUIwNjEpKDB4MEI1QjI2NDIwQjJBRTM2M0IyNzgzRTQ4M0E1N0FFNEQ3QTUwNkExMUU2NzJENDUzMkQ1REQyN0NGNUE1QkMyNikpKCgweDA3NDY5ODc3NTAyNEM3OEJFMEZEM0JEQUU5Qjk5M0ZGM0U4MTlGMjZBODkwMEQ1REEwQjVGOEZCRDExNkI1NzApKDB4MTM3Rjg0MUI4RjFBRjE5QTQ2OTA0MzMzNjk0NkI1Q0EzRDVEMDBDNDUxMDVENzU4OThFQTlFNzQyRUQxN0M4QykpKCgweDFFMDQwQTZCODIxNzE5MThENjMxRDg5QkMyN0RGQUNBMzZFMjgyQ0Y1MDBCNEU4ODY2MjkwM0YzQjE3MzE5QTMpKDB4MjZDMzE5NzE3ODYwNTc2OEQ2MzEyRDFFQjFCNzYzQkFFMDhCQTRFMkFDNTNCREQ2RDBBNTU1RTVDOTYwNEZEOCkpKCgweDNGQTVFRkExNkVBQ0JGOTg4MkNDRDkxQjkxOENDODdBM0JDQUZDRUMzNkMwOEU5QTI2NDExOUQyMjMwRDM0NUMpKDB4Mjk1QjFDNjg1MTA1REIyRDg1MjBBMDlBQjZDOEE2RTAyQUM0NEU1RTQ2NzI5Njc1NEU0OTQ3MjM5REQ1MDhFQikpKCgweDJBRUI4RjE3MkZGRkRFNTZENUMxM0NCQjJCN0ZEOEUwNTRFNTVBODU5NkQ0RUYxRkY0NzVBOTgwNTBCM0JFNzUpKDB4Mjg4MDcyNDBCMjAxQUU1QzA1N0I2NjJGMDI1OEU0QjIyREUyMDkzRjdDRjBDRjcyMEE5OUEzQjlCRTJGOUUyMikpKCgw'... 25411 more characters,
  metadata: 'many',
  cache: '/mnt/efs/cache',
  chain: 'devnet',
  webhook: undefined
}

[12:21:56 AM] 2024-05-12T21:21:45.132Z	INFO	getWorker result: {
  repo: 'worker-example',
  size: 10815,
  version: '0.2.2',
  developer: 'DFST',
  countUsed: 13,
  timeUsed: 1715548893174,
  timeDeployed: 1715547885099,
  id: '6459034946',
  protected: false
}

[12:21:56 AM] 2024-05-12T21:21:45.133Z	INFO	Running worker { developer: 'DFST', repo: 'worker-example', version: '0.2.2' }

[12:21:56 AM] 2024-05-12T21:21:45.133Z	INFO	starting worker example version 0.2.2 on chain devnet

[12:21:56 AM] 2024-05-12T21:21:45.144Z	INFO	isMany: true

[12:21:56 AM] 2024-05-12T21:21:45.149Z	INFO	Address B62qqWMLtBDkVUJRsgPXnYamCKcMaeK7fsyXC43UxMn5u1ysy2rpRW2

[12:21:56 AM] 2024-05-12T21:21:45.150Z	INFO	Sending tx...

[12:21:56 AM] 2024-05-12T21:21:46.351Z	INFO	getDeployer: providing deployer B62qoAd8ST9qkskDb7zW4vyDPSzuMzPw7B2c3vVPqLrErv7NR5Fjtbj with balance 284

[12:21:56 AM] 2024-05-12T21:21:46.351Z	INFO	cloud deployer: EKDxBcUefVbwCcbMhLEcsyDdhrhnquBGWT6xp1EuTnTmNWvjgBRA

[12:21:56 AM] 2024-05-12T21:21:46.697Z	INFO	sender: B62qoAd8ST9qkskDb7zW4vyDPSzuMzPw7B2c3vVPqLrErv7NR5Fjtbj

[12:21:56 AM] 2024-05-12T21:21:46.828Z	INFO	Sender balance: 284.460074

[12:21:56 AM] 2024-05-12T21:21:46.828Z	INFO	compiled: 0.01ms

[12:22:38 AM] 2024-05-12T21:22:20.237Z	INFO	prepared tx: 35.087s

[12:22:38 AM] 2024-05-12T21:22:21.061Z	INFO	many tx sent: hash: 5JtwXzWjDXmidQzvW9uiYefzhbhFCZSWHPaqbKsGxrMjN2YVydq7 status: pending

[12:22:38 AM] 2024-05-12T21:22:21.061Z	INFO	Cloud: releaseDeployer {
  publicKey: 'B62qoAd8ST9qkskDb7zW4vyDPSzuMzPw7B2c3vVPqLrErv7NR5Fjtbj',
  txsHashes: [ '5JtwXzWjDXmidQzvW9uiYefzhbhFCZSWHPaqbKsGxrMjN2YVydq7' ]
}

[12:22:38 AM] 2024-05-12T21:22:21.084Z	INFO	RSS memory finished: 3717 MB, changed by 316 MB

[12:22:38 AM] 2024-05-12T21:22:21.085Z	INFO	zkCloudWorker Execute Sync: 35.980s

[12:22:38 AM] 2024-05-12T21:22:21.112Z	INFO	zkCloudWorker Execute: 36.008s

[12:22:38 AM] REPORT RequestId: Duration: 36051.86 ms	Billed Duration: 36052 ms	Memory Size: 10240 MB	Max Memory Used: 4864 MB

[12:22:38 AM] Many result: 5JtwXzWjDXmidQzvW9uiYefzhbhFCZSWHPaqbKsGxrMjN2YVydq7
[12:22:38 AM] Many txs sent: 3:43.377 (m:ss.mmm)
[12:22:38 AM] RSS memory Many txs sent: 325 MB, changed by 1 MB
 PASS  tests/contract.test.ts
  Add Worker
    ✓ should prepare data (12 ms)
    ✓ should initialize blockchain (549 ms)
    ✓ should send one transactions (43012 ms)
    ✓ should send transactions with recursive proofs (223378 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        267.83 s, estimated 447 s
Ran all test suites.
```

### Zeko test log

```
worker-example % yarn zeko.run
[12:40:33 AM] Preparing data...
[12:40:33 AM] prepared data: 0.033ms
[12:40:33 AM] RSS memory initializing blockchain: 312 MB
[12:40:33 AM] non-local chain: zeko
[12:40:33 AM] contract address: B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD
[12:40:33 AM] sender: B62qrvVL5oJWT8K4ijnq83V3MYHv95jhrJ2T3X56GL7nfowNFvcDFST
[12:40:34 AM] Sender balance: 281213.576710656
[12:40:34 AM] RSS memory blockchain initialized: 332 MB, changed by 20 MB
[12:40:34 AM] Sending one tx 1/1...
[12:40:35 AM] answer: {
  success: true,
  jobId: '6459034946.1715550034665.9a8m44I4yjND0PRo7iyzxqsIFPU8R9oa',
  result: undefined,
  error: undefined
}
[12:40:45 AM] 2024-05-12T21:40:34.771Z	INFO	worker {
  command: 'execute',
  id: '6459034946',
  jobId: '6459034946.1715550034665.9a8m44I4yjND0PRo7iyzxqsIFPU8R9oa',
  developer: 'DFST',
  repo: 'worker-example',
  args: '{"contractAddress":"B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD","isMany":false,"addValue":"C.KSWHJ3De9t2KouRDszxbbxykUjmK7G15ufU0O6zhkqD.XP.oP"}'
}

[12:40:45 AM] 2024-05-12T21:40:34.805Z	INFO	zkCloudWorker Execute start: {
  command: 'execute',
  developer: 'DFST',
  repo: 'worker-example',
  id: '6459034946',
  jobId: '6459034946.1715550034665.9a8m44I4yjND0PRo7iyzxqsIFPU8R9oa',
  job: {
    metadata: 'one',
    logStreams: [],
    task: 'one',
    maxAttempts: 0,
    args: '{"contractAddress":"B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD","isMany":false,"addValue":"C.KSWHJ3De9t2KouRDszxbbxykUjmK7G15ufU0O6zhkqD.XP.oP"}',
    timeCreated: 1715550034665,
    timeCreatedString: '2024-05-12T21:40:34.665Z',
    jobId: '6459034946.1715550034665.9a8m44I4yjND0PRo7iyzxqsIFPU8R9oa',
    repo: 'worker-example',
    developer: 'DFST',
    chain: 'zeko',
    txNumber: 1,
    jobStatus: 'created',
    id: '6459034946'
  }
}

[12:40:45 AM] 2024-05-12T21:40:34.807Z	INFO	RSS memory start: 288 MB, changed by 1 MB

[12:40:45 AM] 2024-05-12T21:40:34.807Z	INFO	CloudWorker: constructor {
  id: '6459034946',
  jobId: '6459034946.1715550034665.9a8m44I4yjND0PRo7iyzxqsIFPU8R9oa',
  developer: 'DFST',
  repo: 'worker-example',
  task: 'one',
  taskId: undefined,
  userId: undefined,
  args: '{"contractAddress":"B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD","isMany":false,"addValue":"C.KSWHJ3De9t2KouRDszxbbxykUjmK7G15ufU0O6zhkqD.XP.oP"}',
  metadata: 'one',
  cache: '/mnt/efs/cache',
  chain: 'zeko',
  webhook: undefined
}

[12:40:45 AM] 2024-05-12T21:40:34.841Z	INFO	getWorker result: {
  repo: 'worker-example',
  size: 23045,
  version: '0.2.3',
  developer: 'DFST',
  countUsed: 6,
  timeUsed: 1715549927300,
  timeDeployed: 1715549296710,
  id: '6459034946',
  protected: false
}

[12:40:45 AM] 2024-05-12T21:40:34.841Z	INFO	Running worker { developer: 'DFST', repo: 'worker-example', version: '0.2.3' }

[12:40:45 AM] 2024-05-12T21:40:36.919Z	INFO	starting worker example version 0.2.3 on chain zeko

[12:40:45 AM] 2024-05-12T21:40:38.252Z	INFO	isMany: false

[12:40:45 AM] 2024-05-12T21:40:38.258Z	INFO	Address B62qog1cc7B5aW6QBA9xbUvNXuZCcAkrvRp415ZuxevJsSgK2aeAA66

[12:40:45 AM] 2024-05-12T21:40:38.259Z	INFO	Sending tx...

[12:40:45 AM] 2024-05-12T21:40:39.567Z	INFO	getDeployer: providing deployer B62qjFU9g1ie345NV4Au4nEfAVesiVuCJx55b7aaRcHgRcXRuxxjfVF with balance 281473

[12:40:45 AM] 2024-05-12T21:40:39.568Z	INFO	cloud deployer: EKFXvLsHTrdDdcYSqC2y14YbVwJEaHCN1baouroHTgqv7JuLEUs4

[12:40:45 AM] 2024-05-12T21:40:39.724Z	INFO	sender: B62qjFU9g1ie345NV4Au4nEfAVesiVuCJx55b7aaRcHgRcXRuxxjfVF

[12:40:45 AM] 2024-05-12T21:40:39.762Z	INFO	Sender balance: 281473.976710656

[12:41:06 AM] 2024-05-12T21:40:56.038Z	INFO	compiled AddProgram: 16.276s

[12:41:06 AM] 2024-05-12T21:41:02.341Z	INFO	compiled AddContract: 6.303s

[12:41:06 AM] 2024-05-12T21:41:02.341Z	INFO	compiled: 22.579s

[12:41:06 AM] 2024-05-12T21:41:02.343Z	INFO	addValue: { value: '983', limit: '1000' }

[12:41:37 AM] 2024-05-12T21:41:28.621Z	INFO	prepared tx: 50.361s

[12:41:37 AM] 2024-05-12T21:41:29.610Z	INFO	one tx sent: hash: 5JuBSY5Gp1kKukrbRyqvGPDZJFWHHzZ11d9azF81KW9r6nzNQgRH status: pending

[12:41:37 AM] 2024-05-12T21:41:29.610Z	INFO	Cloud: releaseDeployer {
  publicKey: 'B62qjFU9g1ie345NV4Au4nEfAVesiVuCJx55b7aaRcHgRcXRuxxjfVF',
  txsHashes: [ '5JuBSY5Gp1kKukrbRyqvGPDZJFWHHzZ11d9azF81KW9r6nzNQgRH' ]
}

[12:41:37 AM] 2024-05-12T21:41:29.639Z	INFO	RSS memory finished: 1819 MB, changed by 1531 MB

[12:41:37 AM] 2024-05-12T21:41:29.639Z	INFO	zkCloudWorker Execute Sync: 54.833s

[12:41:37 AM] 2024-05-12T21:41:29.665Z	INFO	zkCloudWorker Execute: 54.859s

[12:41:37 AM] REPORT RequestId: Duration: 54903.23 ms	Billed Duration: 54904 ms	Memory Size: 10240 MB	Max Memory Used: 2198 MB

[12:41:37 AM] One result: 5JuBSY5Gp1kKukrbRyqvGPDZJFWHHzZ11d9azF81KW9r6nzNQgRH
[12:41:37 AM] One txs sent: 1:03.781 (m:ss.mmm)
[12:41:37 AM] RSS memory One txs sent: 307 MB, changed by -25 MB
[12:41:37 AM] Sending many tx 1/1...
[12:41:38 AM] proof answer: {
  success: true,
  jobId: '6459034946.1715550098401.M8Jq14M586ABptzkGa7UXmDv55xKoUti',
  error: undefined
}
[12:41:49 AM] 2024-05-12T21:41:38.519Z	INFO	run {
  task: 'start',
  id: '6459034946',
  jobId: '6459034946.1715550098401.M8Jq14M586ABptzkGa7UXmDv55xKoUti'
}

[12:41:49 AM] 2024-05-12T21:41:38.676Z	INFO	Sequencer: startJob: number of transactions: 3

[12:41:49 AM] 2024-05-12T21:41:38.754Z	INFO	Lambda call: step id: a217d01f-fbdf-48ce-8478-6c142481c016

[12:41:49 AM] 2024-05-12T21:41:39.302Z	INFO	Lambda call: step id: f098de55-853f-476b-9652-2c5f9a26a43f

[12:41:49 AM] 2024-05-12T21:41:39.846Z	INFO	Lambda call: step id: cca94ef4-87f3-4ade-aa12-16e7b1cdbcb8

[12:42:22 AM] 2024-05-12T21:42:10.506Z	INFO	Sequencer: run: results 3

[12:42:22 AM] 2024-05-12T21:42:11.784Z	INFO	Lambda call: step id: a17cb1e9-1867-44f9-beb9-612b7ffd694c

[12:42:22 AM] 2024-05-12T21:42:12.289Z	INFO	Sequencer: run: started merging 2 proofs
step1 started in 166 ms, calculated in 22 sec,
step2 started in 145 ms, calculated in 22 sec

[12:43:25 AM] 2024-05-12T21:43:10.516Z	INFO	Sequencer: run: results 2

[12:43:25 AM] 2024-05-12T21:43:11.836Z	INFO	Lambda call: step id: 4ff9e4c0-dd51-4431-9375-fc1f19c3aa48

[12:43:25 AM] 2024-05-12T21:43:12.336Z	INFO	Sequencer: run: started merging 3 proofs
step1 started in 184 ms, calculated in 52 sec,
step2 started in 186 ms, calculated in 21 sec

[12:44:17 AM] 2024-05-12T21:44:01.047Z	INFO	Sequencer: run: final result written

[12:44:17 AM] 2024-05-12T21:44:01.107Z	INFO	Sequencer: run: finished

[12:44:17 AM] REPORT RequestId: Duration: 142691.57 ms	Billed Duration: 142692 ms	Memory Size: 384 MB	Max Memory Used: 140 MB

[12:44:18 AM] verifyAnswer: {
  success: true,
  jobId: '6459034946.1715550257768.pvUbej05hujItNsB2rIJov1ArVu0pwzY',
  result: undefined,
  error: undefined
}
[12:44:29 AM] 2024-05-12T21:44:17.884Z	INFO	worker {
  command: 'execute',
  id: '6459034946',
  jobId: '6459034946.1715550257768.pvUbej05hujItNsB2rIJov1ArVu0pwzY',
  developer: 'DFST',
  repo: 'worker-example',
  args: '{"contractAddress":"B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD","proof":"{\\n  \\"publicInput\\": [],\\n  \\"publicOutput\\": [\\n    \\"1570\\",\\n    \\"1000\\"\\n  ],\\n  \\"maxProofsVerified\\": 2,\\n  \\"proof\\": \\"KChzdGF0ZW1lbnQoKHByb29mX3N0YXRlKChkZWZlcnJlZF92YWx1ZXMoKHBsb25rKChhbHBoYSgoaW5uZXIoZDExZGM4OTZhYTNhYzJiYiA3NjNjMzg0NjA5NDkzYzYwKSkpKShiZXRhKDYzZmEyYWFjMTczYTBhZGIgMjM1MWQ4ZDk4OTNhZjg4NSkpKGdhbW1hKDRiNDY5OTBmNTI4Yzc3NWQgZDUxZmJlMTc3MDY2YzdmMikpKHpldGEoKGlubmVyKDIyMjE0MWUxM2M3YmZmZjcgM2I3NmU3ZWNhNWUyYmQ1MikpKSkoam9pbnRfY29tYmluZXIoKSkoZmVhdHVyZV9mbGFncygocmFuZ2VfY2hlY2swIGZhbHNlKShyYW5nZV9jaGVjazEgZmFsc2UpKGZvcmVpZ25fZmllbGRfYWRkIGZhbHNlKShmb3JlaWduX2ZpZWxkX211bCBmYWxzZSkoeG9yIGZhbHNlKShyb3QgZmFsc2UpKGxvb2t1cCBmYWxzZSkocnVudGltZV90YWJsZXMgZmFsc2UpKSkpKShidWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgocHJlY2hhbGxlbmdlKChpbm5lcihkYjgyZmVhN2NhOWVjMzIxIDI4OGYxNTY2ZGNjNzliY2EpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhMmIzZmI1ZTUzYTRjMzQwIDNiZjZjZDhhZjY2YWRjOTkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5YzMwN2U1MjIxMGUxMzFiIDlhYWQyOTBmYTVmMGU1MmYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigzYTdhOTU0NGNlNThhMWVjIGJmMzA4NWY3MTUzMDQ2MjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjYjc5Njk4MmFkNDJkNGRhIDQ1OWExOGY2ZjQ1ZmQzNTMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhYWFjOWY2OGVlMjA1ODlhIDFmY2YyMmJmOTU4YWM4Y2QpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4MzgzNzIwZGVkMDk4ODA0IDRiMzFkY2IwMmEyNDg0NTQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4MzIwMjEzNmQ2NjI4NTdhIGUwNjU3MTAzOTI2MGQyMzApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhOGRiNzNkMWY1NWQ5MWI0IDk5Yjg4NzMxMzNlMTc5MjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1NTEzMzlhNWE4OTljNzdhIDJhZjIxZTgwOGZhMjM1NDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4ZmQwZTcyOWM3YjEwYmRmIDdiMTcyMmY0YjJkMzFjYTUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0OTA3NjNjNTZkNGZjZTA3IDY5Yjg3NDg3YTMxYzQ0ZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0NjZiM2Y3OGUwNTRmYjk0IGIyNWQ0YjZhODM3NDc3ZjApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigzMjRjNjE3NjFmMjE1NGEwIDFhMzM5MmJlZDc5NzFjYzUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyOGIwOTdiYTQyNmUxNTUxIGNhMmVlMmI3N2ZhOWI1ZDEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkNTJmODc0YTg0NWU0NjI0IDE5Mjc4OGM1YTBiOGY2MmIpKSkpKSkpKGJyYW5jaF9kYXRhKChwcm9vZnNfdmVyaWZpZWQgTjIpKGRvbWFpbl9sb2cyIlwwMTUiKSkpKSkoc3BvbmdlX2RpZ2VzdF9iZWZvcmVfZXZhbHVhdGlvbnMoMDYwM2E1YjQ1M2Y4NzRkMSBlNTdlOTA2OTQ1YWM1NmY4IDFlYmEyMzM4YzlmZDA4MzUgMzUzZWNjYmNiOGY3NTc0OSkpKG1lc3NhZ2VzX2Zvcl9uZXh0X3dyYXBfcHJvb2YoKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnQoMHgwN0U3OTg4NEQ3MkFDRDBGMzdEQzFFMzEwMjM3N0NBNjdDQkM5MTk0MkJDQTNGRkFGMUQ1REE0RTVDMTI4QjVFIDB4Mzk1MTVFQjlDRUE5NzNEMjZBQjQ0RkYwQjRBRjczRThEREI4MjNGQkIzOERFNTkxMDdGQjdDMzkyMDk4MjVBRCkpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoYjk5N2ZkN2U1YzdmZGZhNSAwODcxOGExY2I3ZGE5Y2JmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZGQyOTMxMTgxODRkMWJmOSAxNzI4MDQwNWUzYzI2MWVhKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoOTA2YTRiN2MzMjg4OWE0NyAyNjM5MTc5OTcwZGY2ZjAxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMzIxYmI2ZDg1NjNjNDAyMiAyNDNjNmZlZjE0YjU2ZDg0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZTdjMDk5NjY4ZWQ3YTA3MCBhOGMwN2NmNTU2ZGQzMzE2KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMzUwMjFjNzdiNDBlNWEwOSAxZmIwY2MwOWQzYzllZGU5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZThhYmFkMDRkMjViOThkZiBmNjJkMDk4NjQxNDgyMmY0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMWMzMmIxNDAyYWUxODA4NSA3NzBhYTY4NmU1MGM2MWVlKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMTNjNjMwZGVmZmFmMjZjYSAzNWVjNTRhMDE4MzM0ZjBjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZDQwMWY1YWRiODRiNjU5MSBjZGIyZGY2YTkzOWY5NTE0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYzYwZDMzNzYzODcyZGZiZiBiZWI5OWEwYzFmMDUyZmMyKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoODQzYmNjZWVjNjI2ZDFkYiBmZWRhMmQyMjhjNjg3YTEwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjg4NWI2YzA2NjFkZmNjOSA3OTc3NDBjNmQwMzc4YjYxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZWZlZjJiMTFjMzI1YjNjZSA4NTIzZDNhODA1NTM5YjcwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZWJmNTViNTc3ZDI3OWExMSBlN2M3NTZkMTcwZGFkMzdkKSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcig1Zjg3ZTAyYTVmNTQxZGE0IGQxNWEwZDhlNjQ2ODI3ZGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkMGE2NTUyZWQ1NmY3ZTA5IGFmNTZjNTcxZmIwMWU3YjcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3ZmYyMTJmN2MwOWExMzIxIDk2MTYzYzdhYzczM2RhZTYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyM2UzNzQxZTY3NmQ3YmZhIGFhNzk0NmM1ODQ1ZjNhYjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkYTRkNjcyNDAzODNhOWY1IGQ4ZTE4OTRhOGFjMWQ4NjUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwZWMwZmRjMmY4YzY5NjFiIGI4YjA2YjA1YWU3NjZkODIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0NGQ0MjNmYWFiNjVlMjAwIDQxZTkxNDExMzZhNTQwYTQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3NjRiNTIwMDcwOGNmNWI1IGI0YThjOGM1N2RjOTY5ZDcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNjMzYzg0MGM5MjM5NjQwIDYyMzBlMmIxM2ZmOTY0NjApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxOGIwYjBiMTk3YjNkZTU3IGM0YjY1NmRhYWU5NTc1OWUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0ZTFjYzVmM2RkN2UzMmU4IGNkNWFmMjVkMWZiYThlZTApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxZmQ3YmM3NzIwY2VhOWVjIDg4ZWNhOTU2OGQ3MWQzOTIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlMzU4NTk5OGJhMTI0NTZjIDg0MDI3OWQ3MTYxZmUxOTMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwZTFjYTc5ZjM2NTNhZGVjIGU1MGU5MzAzMDliZTFlMmUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlM2UwMjk0NzZmYTk1NWEyIGVmNjljZDIzNzdjYzE0YzEpKSkpKSkpKSkpKSkobWVzc2FnZXNfZm9yX25leHRfc3RlcF9wcm9vZigoYXBwX3N0YXRlKCkpKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnRzKCgweDBCQ0VBQzVGMTlCNjI5Qjk2M0E3MTVCRUYwNkFENzJBNTMxMDAyNDREQ0JCRjE4ODlBRjk1MTI1MUU5QTBGNTkgMHgwMjBCQzk1RURDRDVBNkEzRTEwRTI1OTEzQjE1RENDNzVCMzE4MEFGMUNBRkIwOUIzM0Q2Mzg1RTFFOUM2NEEwKSgweDEwMkQ3QzJDQzVEMkUxOEQ3MUYxNEQwMkJFNEM0RkRGMDVFREFGMjExNUI3OEFERkJBQzg1NUNEQUNCM0NCMkEgMHgwMzkyMDQ5MkM2RTYyQjczMDBDMEY2QzE1ODU2MEM0QzUzNTg0MTBFOTFGMUYyMTEyNTU1MjI5MkZEQUFGQTUyKSkpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoZGQ3MTE3OGUwMzRiZjI5ZiA1NDE2MTUxN2VjNjc2NWUxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYmFjMTNlYzg1NTA5MDliNiBmZTg5NzUwNzU4MmZjZTg4KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTY5Njg4YWUzNzQwMGYyMCBjNTVhZDcwZGZkMThhZjA3KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMTRhNDY0YzRmYjExMTg0NCBkODJmMzI2N2FiNTE5ZDQ5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYmZhZmM5MjdiZjkwODc5YyBlMGYzNjliYzVlZDZiYzc0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoN2Q3ZDAzODdmZTc1NWZiYyBjODA1ZTc1MjVmNWNmZWRmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNmIwNTVkYzkyNmI4ZDAwMiBhMTcxMzQxZDM2ZmRjMzIwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYjZjZTcxODE5MGQ0MGQxYyBhMWFlNzM1NjBiNzA1ZWJlKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMjNkMWY5YzU3NDkwZWUwZiAyMmYzOWFiNjVhZjdiOGVjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMmNkODk1MjBhNTc5MmNhOSAxYzNmMjI0M2JiNWE0NzI4KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoM2Q5NDMyYjFkNzZlYzQ5MSBmYjJiNjZkNGE1MmFkMjUxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoM2E5ODY1NGVlYmFlZmQ5YSBlZjJiM2UyMDQxOTlmYjE1KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWE3M2RhNzMzNzJmNmUwZCBmNjdlMWQ3N2UxNzZkNTc2KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNmYxODA1NTdhNDNjZDIyMiA2MDcxY2E0NzZkZGFhM2JmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMDgwM2Q1NmE0ZmUxODQ2YyAzNzFjNDIxODRhYTZkNTllKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjIxZmEwNDQzNmY3MWU5ZiBmNGE4OTFkMGIxZjE0NmNlKSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcihhYmE0M2QyODBmNzJmZDE5IGRkNzdiMDMzMGRlZjkzOWIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyMzhmYzhmNzAyMjUwM2Q3IGQzNTJjZjdmMjlkMzBhY2MpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2OGEwMDE3NmFlM2I3MzIzIDAzODcxNmM5ZDFmMDE0YWYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0MTM0MzRlY2U3ZDMxMTIyIDQ0MzgzNDU5NDIzZmRkZDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNWFlZGYxNmQ3MzJkYWVmIDBhNDkzMzBjZGZhMTJiYjcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3YjQzNDhkYzBkNTBhNDNlIGYxM2ZlNjhhYTMzNjE3ZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0MzZmOTg5MjJkMzJiNzU4IDI0MDg4Njk0NzQ4ZmY2M2QpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5ZDhkYjA2Zjk5ZmI4NWRjIDM3ZWI0YmZjZTg1MjBjNWEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkMTJmM2MxMDE5NzU0MzM2IDljYzNkMTJkZmYwMjhlMGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxNDI0Y2MxYzIyZjBjNzQ2IDAwNjJjNWQ2YWJjMmZjZDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwOWRjYmM4YjQzMjRjZDZiIDdjNGJiYTExODdiMjNjYmEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlNDYwMmMwYTgwMzkxZWU3IGVkYWYyZjQwMzlmNjQyNjcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwNDM3MTQyOWY0YmYxNTlmIDUzYzBhNzJkN2JlMDdlZDYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2ZmU3MGY0MzI0YzBkNjNhIDIzNWFjZjJlZmY5ZDVlY2MpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmNGY2MDFhMGU1ZTU0OTBmIGFiMDM4NjFiZWIxNGRkYTMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NjViNTg4YWJlZGE1M2VkIDA4ZjI3MTc2Yjg3ZjM3MWQpKSkpKSkpKSkpKSkocHJldl9ldmFscygoZXZhbHMoKHB1YmxpY19pbnB1dCgweDI2QTIwQURCMEI3MDczMDQwOTk1ODZENDMxNDRBMEQzMTZEMDk5OThGOEY5NDFDQTkzMDI3RUY5NkUzMEIxNjggMHgyRjFGN0RBNzNGN0ZBQzE0REREOTQ3N0UxODhERTExQjk3MUYxN0MyRUYxRkFGNDk0NTNGQjUyNTE2RUFGRkMzKSkoZXZhbHMoKHcoKCgweDA4NzU3MzdGMjg5RTY0MEIzNjIyMzJDOTAwM0E4ODdCMDVBOUY2Mzg0QTlDMzU3RjJEQkQ4RTdENDQwNEEyNTQpKDB4MkE2N0E0NjM5RDZDRThGMThERTZDOTkyRDA0MEIxMkFGRTVCRDkwNDNBQTg2MzMzOEEyNTI2NURCNUFBMzA1NykpKCgweDBCNDM0MTRFQTg3QkZEMDg5NzYyQTI5NzdDRjk4M0NGQkEzRjgxRDcwOUIwNjMzQzk0QzVBMUJCRjYwQzZEQTcpKDB4MjA2MzYwNzQxNDA4OTdCRjZGQzIzOEE0REIyODI2MjUxOUQ0NjI4NDdCQTIxN0IwN0Y0RDg0MDIyRTAwQkIzNSkpKCgweDJEOEQ5RTdFRkNBMTg0MkQyNjdERTEyMjBBNjVCMjY3QkUwOThBQTQyRTYyRDdBOTAwNkUxQ0QzMjYwMjEzNkEpKDB4MUFGODU5QUQxMTRFRUE4MDI2OURCRTMxOTA4QTEyREE1QjQ4NUJFQzE0RDQyQTZBQzNDMzM4OEM1NDdCRDM2NykpKCgweDAwQ0JBMkY3NjQ5NTREMTg0ODQ5MjQyMjJCRUFGQ0U3OUVENDczNDVBOUU0NjIzQkRGNUZDQjNGMkE3QkY1RTQpKDB4MDJDNDJEQURCOUE4NUE1RDlEMTEwQUQ5QjFDQ0IwNEU4Mjc4QTdBMTZDNjM1RjlFQzYxM0I5NThENjFBMDQ4MSkpKCgweDE5RjE5NTE4NDdGM0ZDNUQ0RDZERjVFRDdGOTNDNzEwRTVFRkZGQjA5MkJFNjI4Njg0RDVDMDQ4MThGRDE5MjMpKDB4MzdDMkU2RjM4OTJEOUY4QjJDQjJBRDFENjZBQjgzQkYwREVDQzdBM0ExQzQyRTc2OEMxOTQ4QjFDREJGNTVGNSkpKCgweDA2OTYyNkUxQzUxNjM0MjVGNzJERjUwNzM1N0I5NTMwRjJGQTVBMDExNDI3M0Q3NEE0MzYxODFCNzUyNzYwMTYpKDB4MDRBOTk3MUVGMjY1MjVDMDZFNUVDMDJCMzdDNkM0MDFCMDRCM0U5RDNFQUExNzJGMTNCODI3NTA3ODg2MDY5MikpKCgweDFEQzJCQjYzMzk3QTEzMjJGRkVDMDVGQTU1Q0FGQzA3MTQ1REY4MEMzOUY1NEIxNDdDMDg2RkIyNzg4RDBCQUQpKDB4MTYzMUZCMUM4REUxN0EzMjI1RjZDQkQ0RjFCRUU5NjkyMzk3QzNFOTlBN0E5MzQ1QkU2RTYxMzI2QjEyQjJDRSkpKCgweDE1OEJGMDQ3NDlCQUVGN0M4MEFGQjkzMUYwRTg5MjZGMEJEQzhBMDJFRDFFQzg4NERGOTJCNjQ3OTBFOTM3NkEpKDB4MUQzRjI5RDkwNENCRDk5RTFBNkJGNTdDMDQ3OEE5NTJFMDIwNThBM0UxODUxMDJENjFDM0YzRkJGN0EyMzlEMikpKCgweDM0N0Q2N0RDOUJGOTE5NEE5RURFRTYyMjgxOUZDMjA3OTg5MUYzNzNFRDVEOTRGNTlENTI2RDJBRDVBOUU4NkIpKDB4MkJBRUU5MDE0MkEyQjQyQ0JEMUYzQkIzMjE1MjIxN0VBNDQ3QjUwOTE3OUFDNjlBQUJCODFDRDU3RTkzMjEyNCkpKCgweDEzMjZDNjdDN'... 25398 more characters
}

[12:44:29 AM] 2024-05-12T21:44:17.920Z	INFO	zkCloudWorker Execute start: {
  command: 'execute',
  developer: 'DFST',
  repo: 'worker-example',
  id: '6459034946',
  jobId: '6459034946.1715550257768.pvUbej05hujItNsB2rIJov1ArVu0pwzY',
  job: {
    metadata: 'verify proof',
    logStreams: [],
    task: 'verifyProof',
    maxAttempts: 0,
    args: '{"contractAddress":"B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD","proof":"{\\n  \\"publicInput\\": [],\\n  \\"publicOutput\\": [\\n    \\"1570\\",\\n    \\"1000\\"\\n  ],\\n  \\"maxProofsVerified\\": 2,\\n  \\"proof\\": \\"KChzdGF0ZW1lbnQoKHByb29mX3N0YXRlKChkZWZlcnJlZF92YWx1ZXMoKHBsb25rKChhbHBoYSgoaW5uZXIoZDExZGM4OTZhYTNhYzJiYiA3NjNjMzg0NjA5NDkzYzYwKSkpKShiZXRhKDYzZmEyYWFjMTczYTBhZGIgMjM1MWQ4ZDk4OTNhZjg4NSkpKGdhbW1hKDRiNDY5OTBmNTI4Yzc3NWQgZDUxZmJlMTc3MDY2YzdmMikpKHpldGEoKGlubmVyKDIyMjE0MWUxM2M3YmZmZjcgM2I3NmU3ZWNhNWUyYmQ1MikpKSkoam9pbnRfY29tYmluZXIoKSkoZmVhdHVyZV9mbGFncygocmFuZ2VfY2hlY2swIGZhbHNlKShyYW5nZV9jaGVjazEgZmFsc2UpKGZvcmVpZ25fZmllbGRfYWRkIGZhbHNlKShmb3JlaWduX2ZpZWxkX211bCBmYWxzZSkoeG9yIGZhbHNlKShyb3QgZmFsc2UpKGxvb2t1cCBmYWxzZSkocnVudGltZV90YWJsZXMgZmFsc2UpKSkpKShidWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgocHJlY2hhbGxlbmdlKChpbm5lcihkYjgyZmVhN2NhOWVjMzIxIDI4OGYxNTY2ZGNjNzliY2EpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhMmIzZmI1ZTUzYTRjMzQwIDNiZjZjZDhhZjY2YWRjOTkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5YzMwN2U1MjIxMGUxMzFiIDlhYWQyOTBmYTVmMGU1MmYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigzYTdhOTU0NGNlNThhMWVjIGJmMzA4NWY3MTUzMDQ2MjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjYjc5Njk4MmFkNDJkNGRhIDQ1OWExOGY2ZjQ1ZmQzNTMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhYWFjOWY2OGVlMjA1ODlhIDFmY2YyMmJmOTU4YWM4Y2QpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4MzgzNzIwZGVkMDk4ODA0IDRiMzFkY2IwMmEyNDg0NTQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4MzIwMjEzNmQ2NjI4NTdhIGUwNjU3MTAzOTI2MGQyMzApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhOGRiNzNkMWY1NWQ5MWI0IDk5Yjg4NzMxMzNlMTc5MjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1NTEzMzlhNWE4OTljNzdhIDJhZjIxZTgwOGZhMjM1NDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4ZmQwZTcyOWM3YjEwYmRmIDdiMTcyMmY0YjJkMzFjYTUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0OTA3NjNjNTZkNGZjZTA3IDY5Yjg3NDg3YTMxYzQ0ZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0NjZiM2Y3OGUwNTRmYjk0IGIyNWQ0YjZhODM3NDc3ZjApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigzMjRjNjE3NjFmMjE1NGEwIDFhMzM5MmJlZDc5NzFjYzUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyOGIwOTdiYTQyNmUxNTUxIGNhMmVlMmI3N2ZhOWI1ZDEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkNTJmODc0YTg0NWU0NjI0IDE5Mjc4OGM1YTBiOGY2MmIpKSkpKSkpKGJyYW5jaF9kYXRhKChwcm9vZnNfdmVyaWZpZWQgTjIpKGRvbWFpbl9sb2cyIlwwMTUiKSkpKSkoc3BvbmdlX2RpZ2VzdF9iZWZvcmVfZXZhbHVhdGlvbnMoMDYwM2E1YjQ1M2Y4NzRkMSBlNTdlOTA2OTQ1YWM1NmY4IDFlYmEyMzM4YzlmZDA4MzUgMzUzZWNjYmNiOGY3NTc0OSkpKG1lc3NhZ2VzX2Zvcl9uZXh0X3dyYXBfcHJvb2YoKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnQoMHgwN0U3OTg4NEQ3MkFDRDBGMzdEQzFFMzEwMjM3N0NBNjdDQkM5MTk0MkJDQTNGRkFGMUQ1REE0RTVDMTI4QjVFIDB4Mzk1MTVFQjlDRUE5NzNEMjZBQjQ0RkYwQjRBRjczRThEREI4MjNGQkIzOERFNTkxMDdGQjdDMzkyMDk4MjVBRCkpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoYjk5N2ZkN2U1YzdmZGZhNSAwODcxOGExY2I3ZGE5Y2JmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZGQyOTMxMTgxODRkMWJmOSAxNzI4MDQwNWUzYzI2MWVhKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoOTA2YTRiN2MzMjg4OWE0NyAyNjM5MTc5OTcwZGY2ZjAxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMzIxYmI2ZDg1NjNjNDAyMiAyNDNjNmZlZjE0YjU2ZDg0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZTdjMDk5NjY4ZWQ3YTA3MCBhOGMwN2NmNTU2ZGQzMzE2KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMzUwMjFjNzdiNDBlNWEwOSAxZmIwY2MwOWQzYzllZGU5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZThhYmFkMDRkMjViOThkZiBmNjJkMDk4NjQxNDgyMmY0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMWMzMmIxNDAyYWUxODA4NSA3NzBhYTY4NmU1MGM2MWVlKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMTNjNjMwZGVmZmFmMjZjYSAzNWVjNTRhMDE4MzM0ZjBjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZDQwMWY1YWRiODRiNjU5MSBjZGIyZGY2YTkzOWY5NTE0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYzYwZDMzNzYzODcyZGZiZiBiZWI5OWEwYzFmMDUyZmMyKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoODQzYmNjZWVjNjI2ZDFkYiBmZWRhMmQyMjhjNjg3YTEwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjg4NWI2YzA2NjFkZmNjOSA3OTc3NDBjNmQwMzc4YjYxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZWZlZjJiMTFjMzI1YjNjZSA4NTIzZDNhODA1NTM5YjcwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZWJmNTViNTc3ZDI3OWExMSBlN2M3NTZkMTcwZGFkMzdkKSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcig1Zjg3ZTAyYTVmNTQxZGE0IGQxNWEwZDhlNjQ2ODI3ZGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkMGE2NTUyZWQ1NmY3ZTA5IGFmNTZjNTcxZmIwMWU3YjcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3ZmYyMTJmN2MwOWExMzIxIDk2MTYzYzdhYzczM2RhZTYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyM2UzNzQxZTY3NmQ3YmZhIGFhNzk0NmM1ODQ1ZjNhYjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkYTRkNjcyNDAzODNhOWY1IGQ4ZTE4OTRhOGFjMWQ4NjUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwZWMwZmRjMmY4YzY5NjFiIGI4YjA2YjA1YWU3NjZkODIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0NGQ0MjNmYWFiNjVlMjAwIDQxZTkxNDExMzZhNTQwYTQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3NjRiNTIwMDcwOGNmNWI1IGI0YThjOGM1N2RjOTY5ZDcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNjMzYzg0MGM5MjM5NjQwIDYyMzBlMmIxM2ZmOTY0NjApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxOGIwYjBiMTk3YjNkZTU3IGM0YjY1NmRhYWU5NTc1OWUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0ZTFjYzVmM2RkN2UzMmU4IGNkNWFmMjVkMWZiYThlZTApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxZmQ3YmM3NzIwY2VhOWVjIDg4ZWNhOTU2OGQ3MWQzOTIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlMzU4NTk5OGJhMTI0NTZjIDg0MDI3OWQ3MTYxZmUxOTMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwZTFjYTc5ZjM2NTNhZGVjIGU1MGU5MzAzMDliZTFlMmUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlM2UwMjk0NzZmYTk1NWEyIGVmNjljZDIzNzdjYzE0YzEpKSkpKSkpKSkpKSkobWVzc2FnZXNfZm9yX25leHRfc3RlcF9wcm9vZigoYXBwX3N0YXRlKCkpKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnRzKCgweDBCQ0VBQzVGMTlCNjI5Qjk2M0E3MTVCRUYwNkFENzJBNTMxMDAyNDREQ0JCRjE4ODlBRjk1MTI1MUU5QTBGNTkgMHgwMjBCQzk1RURDRDVBNkEzRTEwRTI1OTEzQjE1RENDNzVCMzE4MEFGMUNBRkIwOUIzM0Q2Mzg1RTFFOUM2NEEwKSgweDEwMkQ3QzJDQzVEMkUxOEQ3MUYxNEQwMkJFNEM0RkRGMDVFREFGMjExNUI3OEFERkJBQzg1NUNEQUNCM0NCMkEgMHgwMzkyMDQ5MkM2RTYyQjczMDBDMEY2QzE1ODU2MEM0QzUzNTg0MTBFOTFGMUYyMTEyNTU1MjI5MkZEQUFGQTUyKSkpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoZGQ3MTE3OGUwMzRiZjI5ZiA1NDE2MTUxN2VjNjc2NWUxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYmFjMTNlYzg1NTA5MDliNiBmZTg5NzUwNzU4MmZjZTg4KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTY5Njg4YWUzNzQwMGYyMCBjNTVhZDcwZGZkMThhZjA3KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMTRhNDY0YzRmYjExMTg0NCBkODJmMzI2N2FiNTE5ZDQ5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYmZhZmM5MjdiZjkwODc5YyBlMGYzNjliYzVlZDZiYzc0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoN2Q3ZDAzODdmZTc1NWZiYyBjODA1ZTc1MjVmNWNmZWRmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNmIwNTVkYzkyNmI4ZDAwMiBhMTcxMzQxZDM2ZmRjMzIwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYjZjZTcxODE5MGQ0MGQxYyBhMWFlNzM1NjBiNzA1ZWJlKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMjNkMWY5YzU3NDkwZWUwZiAyMmYzOWFiNjVhZjdiOGVjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMmNkODk1MjBhNTc5MmNhOSAxYzNmMjI0M2JiNWE0NzI4KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoM2Q5NDMyYjFkNzZlYzQ5MSBmYjJiNjZkNGE1MmFkMjUxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoM2E5ODY1NGVlYmFlZmQ5YSBlZjJiM2UyMDQxOTlmYjE1KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWE3M2RhNzMzNzJmNmUwZCBmNjdlMWQ3N2UxNzZkNTc2KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNmYxODA1NTdhNDNjZDIyMiA2MDcxY2E0NzZkZGFhM2JmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMDgwM2Q1NmE0ZmUxODQ2YyAzNzFjNDIxODRhYTZkNTllKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjIxZmEwNDQzNmY3MWU5ZiBmNGE4OTFkMGIxZjE0NmNlKSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcihhYmE0M2QyODBmNzJmZDE5IGRkNzdiMDMzMGRlZjkzOWIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyMzhmYzhmNzAyMjUwM2Q3IGQzNTJjZjdmMjlkMzBhY2MpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2OGEwMDE3NmFlM2I3MzIzIDAzODcxNmM5ZDFmMDE0YWYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0MTM0MzRlY2U3ZDMxMTIyIDQ0MzgzNDU5NDIzZmRkZDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNWFlZGYxNmQ3MzJkYWVmIDBhNDkzMzBjZGZhMTJiYjcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3YjQzNDhkYzBkNTBhNDNlIGYxM2ZlNjhhYTMzNjE3ZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0MzZmOTg5MjJkMzJiNzU4IDI0MDg4Njk0NzQ4ZmY2M2QpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5ZDhkYjA2Zjk5ZmI4NWRjIDM3ZWI0YmZjZTg1MjBjNWEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkMTJmM2MxMDE5NzU0MzM2IDljYzNkMTJkZmYwMjhlMGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxNDI0Y2MxYzIyZjBjNzQ2IDAwNjJjNWQ2YWJjMmZjZDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwOWRjYmM4YjQzMjRjZDZiIDdjNGJiYTExODdiMjNjYmEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlNDYwMmMwYTgwMzkxZWU3IGVkYWYyZjQwMzlmNjQyNjcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwNDM3MTQyOWY0YmYxNTlmIDUzYzBhNzJkN2JlMDdlZDYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2ZmU3MGY0MzI0YzBkNjNhIDIzNWFjZjJlZmY5ZDVlY2MpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmNGY2MDFhMGU1ZTU0OTBmIGFiMDM4NjFiZWIxNGRkYTMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NjViNTg4YWJlZGE1M2VkIDA4ZjI3MTc2Yjg3ZjM3MWQpKSkpKSkpKSkpKSkocHJldl9ldmFscygoZXZhbHMoKHB1YmxpY19pbnB1dCgweDI2QTIwQURCMEI3MDczMDQwOTk1ODZENDMxNDRBMEQzMTZEMDk5OThGOEY5NDFDQTkzMDI3RUY5NkUzMEIxNjggMHgyRjFGN0RBNzNGN0ZBQzE0REREOTQ3N0UxODhERTExQjk3MUYxN0MyRUYxRkFGNDk0NTNGQjUyNTE2RUFGRkMzKSkoZXZhbHMoKHcoKCgweDA4NzU3MzdGMjg5RTY0MEIzNjIyMzJDOTAwM0E4ODdCMDVBOUY2Mzg0QTlDMzU3RjJEQkQ4RTdENDQwNEEyNTQpKDB4MkE2N0E0NjM5RDZDRThGMThERTZDOTkyRDA0MEIxMkFGRTVCRDkwNDNBQTg2MzMzOEEyNTI2NURCNUFBMzA1NykpKCgweDBCNDM0MTRFQTg3QkZEMDg5NzYyQTI5NzdDRjk4M0NGQkEzRjgxRDcwOUIwNjMzQzk0QzVBMUJCRjYwQzZEQTcpKDB4MjA2MzYwNzQxNDA4OTdCRjZGQzIzOEE0REIyODI2MjUxOUQ0NjI4NDdCQTIxN0IwN0Y0RDg0MDIyRTAwQkIzNSkpKCgweDJEOEQ5RTdFRkNBMTg0MkQyNjdERTEyMjBBNjVCMjY3QkUwOThBQTQyRTYyRDdBOTAwNkUxQ0QzMjYwMjEzNkEpKDB4MUFGODU5QUQxMTRFRUE4MDI2OURCRTMxOTA4QTEyREE1QjQ4NUJFQzE0RDQyQTZBQzNDMzM4OEM1NDdCRDM2NykpKCgweDAwQ0JBMkY3NjQ5NTREMTg0ODQ5MjQyMjJCRUFGQ0U3OUVENDczNDVBOUU0NjIzQkRGNUZDQjNGMkE3QkY1RTQpKDB4MDJDNDJEQURCOUE4NUE1RDlEMTEwQUQ5QjFDQ0IwNEU4Mjc4QTdBMTZDNjM1RjlFQzYxM0I5NThENjFBMDQ4MSkpKCgweDE5RjE5NTE4NDdGM0ZDNUQ0RDZERjVFRDdGOTNDNzEwRTVFRkZGQjA5MkJFNjI4Njg0RDVDMDQ4MThGRDE5MjMpKDB4MzdDMkU2RjM4OTJEOUY4QjJDQjJBRDFENjZBQjgzQkYwREVDQzdBM0ExQzQyRTc2OEMxOTQ4QjFDREJGNTVGNSkpKCgweDA2OTYyNkUxQzUxNjM0MjVGNzJERjUwNzM1N0I5NTMwRjJGQTVBMDExNDI3M0Q3NEE0MzYxODFCNzUyNzYwMTYpKDB4MDRBOTk3MUVGMjY1MjVDMDZFNUVDMDJCMzdDNkM0MDFCMDRCM0U5RDNFQUExNzJGMTNCODI3NTA3ODg2MDY5MikpKCgweDFEQzJCQjYzMzk3QTEzMjJGRkVDMDVGQTU1Q0FGQzA3MTQ1REY4MEMzOUY1NEIxNDdDMDg2RkIyNzg4RDBCQUQpKDB4MTYzMUZCMUM4REUxN0EzMjI1RjZDQkQ0RjFCRUU5NjkyMzk3QzNFOTlBN0E5MzQ1QkU2RTYxMzI2QjEyQjJDRSkpKCgweDE1OEJGMDQ3NDlCQUVGN0M4MEFGQjkzMUYwRTg5MjZGMEJEQzhBMDJFRDFFQzg4NERGOTJCNjQ3OTBFOTM3NkEpKDB4MUQzRjI5RDkwNENCRDk5RTFBNkJGNTdDMDQ3OEE5NTJFMDIwNThBM0UxODUxMDJENjFDM0YzRkJGN0EyMzlEMikpKCgweDM0N0Q2N0RDOUJGOTE5NEE5RURFRTYyMjgxOUZDMjA3OTg5MUYzNzNFRDVEOTRGNTlENTI2RDJBRDVBOUU4NkIpKDB4MkJBRUU5MDE0MkEyQjQyQ0JEMUYzQkIzMjE1MjIxN0VBNDQ3QjUwOTE3OUFDNjlBQUJCODFDRDU3RTkzMjEyNCkpKCgweDEzMjZDNjdDN'... 25398 more characters,
    timeCreated: 1715550257768,
    timeCreatedString: '2024-05-12T21:44:17.768Z',
    jobId: '6459034946.1715550257768.pvUbej05hujItNsB2rIJov1ArVu0pwzY',
    repo: 'worker-example',
    developer: 'DFST',
    chain: 'zeko',
    txNumber: 1,
    jobStatus: 'created',
    id: '6459034946'
  }
}

[12:44:29 AM] 2024-05-12T21:44:17.921Z	INFO	RSS memory start: 1819 MB, changed by 0 MB

[12:44:29 AM] 2024-05-12T21:44:17.921Z	INFO	CloudWorker: constructor {
  id: '6459034946',
  jobId: '6459034946.1715550257768.pvUbej05hujItNsB2rIJov1ArVu0pwzY',
  developer: 'DFST',
  repo: 'worker-example',
  task: 'verifyProof',
  taskId: undefined,
  userId: undefined,
  args: '{"contractAddress":"B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD","proof":"{\\n  \\"publicInput\\": [],\\n  \\"publicOutput\\": [\\n    \\"1570\\",\\n    \\"1000\\"\\n  ],\\n  \\"maxProofsVerified\\": 2,\\n  \\"proof\\": \\"KChzdGF0ZW1lbnQoKHByb29mX3N0YXRlKChkZWZlcnJlZF92YWx1ZXMoKHBsb25rKChhbHBoYSgoaW5uZXIoZDExZGM4OTZhYTNhYzJiYiA3NjNjMzg0NjA5NDkzYzYwKSkpKShiZXRhKDYzZmEyYWFjMTczYTBhZGIgMjM1MWQ4ZDk4OTNhZjg4NSkpKGdhbW1hKDRiNDY5OTBmNTI4Yzc3NWQgZDUxZmJlMTc3MDY2YzdmMikpKHpldGEoKGlubmVyKDIyMjE0MWUxM2M3YmZmZjcgM2I3NmU3ZWNhNWUyYmQ1MikpKSkoam9pbnRfY29tYmluZXIoKSkoZmVhdHVyZV9mbGFncygocmFuZ2VfY2hlY2swIGZhbHNlKShyYW5nZV9jaGVjazEgZmFsc2UpKGZvcmVpZ25fZmllbGRfYWRkIGZhbHNlKShmb3JlaWduX2ZpZWxkX211bCBmYWxzZSkoeG9yIGZhbHNlKShyb3QgZmFsc2UpKGxvb2t1cCBmYWxzZSkocnVudGltZV90YWJsZXMgZmFsc2UpKSkpKShidWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgocHJlY2hhbGxlbmdlKChpbm5lcihkYjgyZmVhN2NhOWVjMzIxIDI4OGYxNTY2ZGNjNzliY2EpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhMmIzZmI1ZTUzYTRjMzQwIDNiZjZjZDhhZjY2YWRjOTkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5YzMwN2U1MjIxMGUxMzFiIDlhYWQyOTBmYTVmMGU1MmYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigzYTdhOTU0NGNlNThhMWVjIGJmMzA4NWY3MTUzMDQ2MjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjYjc5Njk4MmFkNDJkNGRhIDQ1OWExOGY2ZjQ1ZmQzNTMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhYWFjOWY2OGVlMjA1ODlhIDFmY2YyMmJmOTU4YWM4Y2QpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4MzgzNzIwZGVkMDk4ODA0IDRiMzFkY2IwMmEyNDg0NTQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4MzIwMjEzNmQ2NjI4NTdhIGUwNjU3MTAzOTI2MGQyMzApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhOGRiNzNkMWY1NWQ5MWI0IDk5Yjg4NzMxMzNlMTc5MjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1NTEzMzlhNWE4OTljNzdhIDJhZjIxZTgwOGZhMjM1NDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4ZmQwZTcyOWM3YjEwYmRmIDdiMTcyMmY0YjJkMzFjYTUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0OTA3NjNjNTZkNGZjZTA3IDY5Yjg3NDg3YTMxYzQ0ZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0NjZiM2Y3OGUwNTRmYjk0IGIyNWQ0YjZhODM3NDc3ZjApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigzMjRjNjE3NjFmMjE1NGEwIDFhMzM5MmJlZDc5NzFjYzUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyOGIwOTdiYTQyNmUxNTUxIGNhMmVlMmI3N2ZhOWI1ZDEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkNTJmODc0YTg0NWU0NjI0IDE5Mjc4OGM1YTBiOGY2MmIpKSkpKSkpKGJyYW5jaF9kYXRhKChwcm9vZnNfdmVyaWZpZWQgTjIpKGRvbWFpbl9sb2cyIlwwMTUiKSkpKSkoc3BvbmdlX2RpZ2VzdF9iZWZvcmVfZXZhbHVhdGlvbnMoMDYwM2E1YjQ1M2Y4NzRkMSBlNTdlOTA2OTQ1YWM1NmY4IDFlYmEyMzM4YzlmZDA4MzUgMzUzZWNjYmNiOGY3NTc0OSkpKG1lc3NhZ2VzX2Zvcl9uZXh0X3dyYXBfcHJvb2YoKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnQoMHgwN0U3OTg4NEQ3MkFDRDBGMzdEQzFFMzEwMjM3N0NBNjdDQkM5MTk0MkJDQTNGRkFGMUQ1REE0RTVDMTI4QjVFIDB4Mzk1MTVFQjlDRUE5NzNEMjZBQjQ0RkYwQjRBRjczRThEREI4MjNGQkIzOERFNTkxMDdGQjdDMzkyMDk4MjVBRCkpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoYjk5N2ZkN2U1YzdmZGZhNSAwODcxOGExY2I3ZGE5Y2JmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZGQyOTMxMTgxODRkMWJmOSAxNzI4MDQwNWUzYzI2MWVhKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoOTA2YTRiN2MzMjg4OWE0NyAyNjM5MTc5OTcwZGY2ZjAxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMzIxYmI2ZDg1NjNjNDAyMiAyNDNjNmZlZjE0YjU2ZDg0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZTdjMDk5NjY4ZWQ3YTA3MCBhOGMwN2NmNTU2ZGQzMzE2KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMzUwMjFjNzdiNDBlNWEwOSAxZmIwY2MwOWQzYzllZGU5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZThhYmFkMDRkMjViOThkZiBmNjJkMDk4NjQxNDgyMmY0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMWMzMmIxNDAyYWUxODA4NSA3NzBhYTY4NmU1MGM2MWVlKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMTNjNjMwZGVmZmFmMjZjYSAzNWVjNTRhMDE4MzM0ZjBjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZDQwMWY1YWRiODRiNjU5MSBjZGIyZGY2YTkzOWY5NTE0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYzYwZDMzNzYzODcyZGZiZiBiZWI5OWEwYzFmMDUyZmMyKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoODQzYmNjZWVjNjI2ZDFkYiBmZWRhMmQyMjhjNjg3YTEwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjg4NWI2YzA2NjFkZmNjOSA3OTc3NDBjNmQwMzc4YjYxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZWZlZjJiMTFjMzI1YjNjZSA4NTIzZDNhODA1NTM5YjcwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZWJmNTViNTc3ZDI3OWExMSBlN2M3NTZkMTcwZGFkMzdkKSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcig1Zjg3ZTAyYTVmNTQxZGE0IGQxNWEwZDhlNjQ2ODI3ZGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkMGE2NTUyZWQ1NmY3ZTA5IGFmNTZjNTcxZmIwMWU3YjcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3ZmYyMTJmN2MwOWExMzIxIDk2MTYzYzdhYzczM2RhZTYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyM2UzNzQxZTY3NmQ3YmZhIGFhNzk0NmM1ODQ1ZjNhYjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkYTRkNjcyNDAzODNhOWY1IGQ4ZTE4OTRhOGFjMWQ4NjUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwZWMwZmRjMmY4YzY5NjFiIGI4YjA2YjA1YWU3NjZkODIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0NGQ0MjNmYWFiNjVlMjAwIDQxZTkxNDExMzZhNTQwYTQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3NjRiNTIwMDcwOGNmNWI1IGI0YThjOGM1N2RjOTY5ZDcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNjMzYzg0MGM5MjM5NjQwIDYyMzBlMmIxM2ZmOTY0NjApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxOGIwYjBiMTk3YjNkZTU3IGM0YjY1NmRhYWU5NTc1OWUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0ZTFjYzVmM2RkN2UzMmU4IGNkNWFmMjVkMWZiYThlZTApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxZmQ3YmM3NzIwY2VhOWVjIDg4ZWNhOTU2OGQ3MWQzOTIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlMzU4NTk5OGJhMTI0NTZjIDg0MDI3OWQ3MTYxZmUxOTMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwZTFjYTc5ZjM2NTNhZGVjIGU1MGU5MzAzMDliZTFlMmUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlM2UwMjk0NzZmYTk1NWEyIGVmNjljZDIzNzdjYzE0YzEpKSkpKSkpKSkpKSkobWVzc2FnZXNfZm9yX25leHRfc3RlcF9wcm9vZigoYXBwX3N0YXRlKCkpKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnRzKCgweDBCQ0VBQzVGMTlCNjI5Qjk2M0E3MTVCRUYwNkFENzJBNTMxMDAyNDREQ0JCRjE4ODlBRjk1MTI1MUU5QTBGNTkgMHgwMjBCQzk1RURDRDVBNkEzRTEwRTI1OTEzQjE1RENDNzVCMzE4MEFGMUNBRkIwOUIzM0Q2Mzg1RTFFOUM2NEEwKSgweDEwMkQ3QzJDQzVEMkUxOEQ3MUYxNEQwMkJFNEM0RkRGMDVFREFGMjExNUI3OEFERkJBQzg1NUNEQUNCM0NCMkEgMHgwMzkyMDQ5MkM2RTYyQjczMDBDMEY2QzE1ODU2MEM0QzUzNTg0MTBFOTFGMUYyMTEyNTU1MjI5MkZEQUFGQTUyKSkpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoZGQ3MTE3OGUwMzRiZjI5ZiA1NDE2MTUxN2VjNjc2NWUxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYmFjMTNlYzg1NTA5MDliNiBmZTg5NzUwNzU4MmZjZTg4KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTY5Njg4YWUzNzQwMGYyMCBjNTVhZDcwZGZkMThhZjA3KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMTRhNDY0YzRmYjExMTg0NCBkODJmMzI2N2FiNTE5ZDQ5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYmZhZmM5MjdiZjkwODc5YyBlMGYzNjliYzVlZDZiYzc0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoN2Q3ZDAzODdmZTc1NWZiYyBjODA1ZTc1MjVmNWNmZWRmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNmIwNTVkYzkyNmI4ZDAwMiBhMTcxMzQxZDM2ZmRjMzIwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYjZjZTcxODE5MGQ0MGQxYyBhMWFlNzM1NjBiNzA1ZWJlKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMjNkMWY5YzU3NDkwZWUwZiAyMmYzOWFiNjVhZjdiOGVjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMmNkODk1MjBhNTc5MmNhOSAxYzNmMjI0M2JiNWE0NzI4KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoM2Q5NDMyYjFkNzZlYzQ5MSBmYjJiNjZkNGE1MmFkMjUxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoM2E5ODY1NGVlYmFlZmQ5YSBlZjJiM2UyMDQxOTlmYjE1KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWE3M2RhNzMzNzJmNmUwZCBmNjdlMWQ3N2UxNzZkNTc2KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNmYxODA1NTdhNDNjZDIyMiA2MDcxY2E0NzZkZGFhM2JmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMDgwM2Q1NmE0ZmUxODQ2YyAzNzFjNDIxODRhYTZkNTllKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjIxZmEwNDQzNmY3MWU5ZiBmNGE4OTFkMGIxZjE0NmNlKSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcihhYmE0M2QyODBmNzJmZDE5IGRkNzdiMDMzMGRlZjkzOWIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyMzhmYzhmNzAyMjUwM2Q3IGQzNTJjZjdmMjlkMzBhY2MpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2OGEwMDE3NmFlM2I3MzIzIDAzODcxNmM5ZDFmMDE0YWYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0MTM0MzRlY2U3ZDMxMTIyIDQ0MzgzNDU5NDIzZmRkZDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNWFlZGYxNmQ3MzJkYWVmIDBhNDkzMzBjZGZhMTJiYjcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3YjQzNDhkYzBkNTBhNDNlIGYxM2ZlNjhhYTMzNjE3ZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0MzZmOTg5MjJkMzJiNzU4IDI0MDg4Njk0NzQ4ZmY2M2QpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5ZDhkYjA2Zjk5ZmI4NWRjIDM3ZWI0YmZjZTg1MjBjNWEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkMTJmM2MxMDE5NzU0MzM2IDljYzNkMTJkZmYwMjhlMGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxNDI0Y2MxYzIyZjBjNzQ2IDAwNjJjNWQ2YWJjMmZjZDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwOWRjYmM4YjQzMjRjZDZiIDdjNGJiYTExODdiMjNjYmEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlNDYwMmMwYTgwMzkxZWU3IGVkYWYyZjQwMzlmNjQyNjcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwNDM3MTQyOWY0YmYxNTlmIDUzYzBhNzJkN2JlMDdlZDYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2ZmU3MGY0MzI0YzBkNjNhIDIzNWFjZjJlZmY5ZDVlY2MpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmNGY2MDFhMGU1ZTU0OTBmIGFiMDM4NjFiZWIxNGRkYTMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NjViNTg4YWJlZGE1M2VkIDA4ZjI3MTc2Yjg3ZjM3MWQpKSkpKSkpKSkpKSkocHJldl9ldmFscygoZXZhbHMoKHB1YmxpY19pbnB1dCgweDI2QTIwQURCMEI3MDczMDQwOTk1ODZENDMxNDRBMEQzMTZEMDk5OThGOEY5NDFDQTkzMDI3RUY5NkUzMEIxNjggMHgyRjFGN0RBNzNGN0ZBQzE0REREOTQ3N0UxODhERTExQjk3MUYxN0MyRUYxRkFGNDk0NTNGQjUyNTE2RUFGRkMzKSkoZXZhbHMoKHcoKCgweDA4NzU3MzdGMjg5RTY0MEIzNjIyMzJDOTAwM0E4ODdCMDVBOUY2Mzg0QTlDMzU3RjJEQkQ4RTdENDQwNEEyNTQpKDB4MkE2N0E0NjM5RDZDRThGMThERTZDOTkyRDA0MEIxMkFGRTVCRDkwNDNBQTg2MzMzOEEyNTI2NURCNUFBMzA1NykpKCgweDBCNDM0MTRFQTg3QkZEMDg5NzYyQTI5NzdDRjk4M0NGQkEzRjgxRDcwOUIwNjMzQzk0QzVBMUJCRjYwQzZEQTcpKDB4MjA2MzYwNzQxNDA4OTdCRjZGQzIzOEE0REIyODI2MjUxOUQ0NjI4NDdCQTIxN0IwN0Y0RDg0MDIyRTAwQkIzNSkpKCgweDJEOEQ5RTdFRkNBMTg0MkQyNjdERTEyMjBBNjVCMjY3QkUwOThBQTQyRTYyRDdBOTAwNkUxQ0QzMjYwMjEzNkEpKDB4MUFGODU5QUQxMTRFRUE4MDI2OURCRTMxOTA4QTEyREE1QjQ4NUJFQzE0RDQyQTZBQzNDMzM4OEM1NDdCRDM2NykpKCgweDAwQ0JBMkY3NjQ5NTREMTg0ODQ5MjQyMjJCRUFGQ0U3OUVENDczNDVBOUU0NjIzQkRGNUZDQjNGMkE3QkY1RTQpKDB4MDJDNDJEQURCOUE4NUE1RDlEMTEwQUQ5QjFDQ0IwNEU4Mjc4QTdBMTZDNjM1RjlFQzYxM0I5NThENjFBMDQ4MSkpKCgweDE5RjE5NTE4NDdGM0ZDNUQ0RDZERjVFRDdGOTNDNzEwRTVFRkZGQjA5MkJFNjI4Njg0RDVDMDQ4MThGRDE5MjMpKDB4MzdDMkU2RjM4OTJEOUY4QjJDQjJBRDFENjZBQjgzQkYwREVDQzdBM0ExQzQyRTc2OEMxOTQ4QjFDREJGNTVGNSkpKCgweDA2OTYyNkUxQzUxNjM0MjVGNzJERjUwNzM1N0I5NTMwRjJGQTVBMDExNDI3M0Q3NEE0MzYxODFCNzUyNzYwMTYpKDB4MDRBOTk3MUVGMjY1MjVDMDZFNUVDMDJCMzdDNkM0MDFCMDRCM0U5RDNFQUExNzJGMTNCODI3NTA3ODg2MDY5MikpKCgweDFEQzJCQjYzMzk3QTEzMjJGRkVDMDVGQTU1Q0FGQzA3MTQ1REY4MEMzOUY1NEIxNDdDMDg2RkIyNzg4RDBCQUQpKDB4MTYzMUZCMUM4REUxN0EzMjI1RjZDQkQ0RjFCRUU5NjkyMzk3QzNFOTlBN0E5MzQ1QkU2RTYxMzI2QjEyQjJDRSkpKCgweDE1OEJGMDQ3NDlCQUVGN0M4MEFGQjkzMUYwRTg5MjZGMEJEQzhBMDJFRDFFQzg4NERGOTJCNjQ3OTBFOTM3NkEpKDB4MUQzRjI5RDkwNENCRDk5RTFBNkJGNTdDMDQ3OEE5NTJFMDIwNThBM0UxODUxMDJENjFDM0YzRkJGN0EyMzlEMikpKCgweDM0N0Q2N0RDOUJGOTE5NEE5RURFRTYyMjgxOUZDMjA3OTg5MUYzNzNFRDVEOTRGNTlENTI2RDJBRDVBOUU4NkIpKDB4MkJBRUU5MDE0MkEyQjQyQ0JEMUYzQkIzMjE1MjIxN0VBNDQ3QjUwOTE3OUFDNjlBQUJCODFDRDU3RTkzMjEyNCkpKCgweDEzMjZDNjdDN'... 25398 more characters,
  metadata: 'verify proof',
  cache: '/mnt/efs/cache',
  chain: 'zeko',
  webhook: undefined
}

[12:44:29 AM] 2024-05-12T21:44:17.945Z	INFO	getWorker result: {
  repo: 'worker-example',
  size: 23045,
  version: '0.2.3',
  developer: 'DFST',
  countUsed: 12,
  timeUsed: 1715550191901,
  timeDeployed: 1715549296710,
  id: '6459034946',
  protected: false
}

[12:44:29 AM] 2024-05-12T21:44:17.946Z	INFO	Running worker { developer: 'DFST', repo: 'worker-example', version: '0.2.3' }

[12:44:29 AM] 2024-05-12T21:44:17.946Z	INFO	starting worker example version 0.2.3 on chain zeko

[12:44:29 AM] 2024-05-12T21:44:17.999Z	INFO	compiled: 0.009ms

[12:44:29 AM] 2024-05-12T21:44:19.988Z	INFO	RSS memory finished: 1246 MB, changed by -573 MB

[12:44:29 AM] 2024-05-12T21:44:19.988Z	INFO	zkCloudWorker Execute Sync: 2.067s

[12:44:29 AM] 2024-05-12T21:44:20.011Z	INFO	zkCloudWorker Execute: 2.092s

[12:44:29 AM] REPORT RequestId: Duration: 2141.32 ms	Billed Duration: 2142 ms	Memory Size: 10240 MB	Max Memory Used: 2198 MB

[12:44:29 AM] Verify result: Proof verified
[12:44:30 AM] answer: {
  success: true,
  jobId: '6459034946.1715550269706.RhrUdaz4nUb9IVmNzV4vIqFKq83AMmO1',
  result: undefined,
  error: undefined
}
[12:44:41 AM] 2024-05-12T21:44:29.822Z	INFO	worker {
  command: 'execute',
  id: '6459034946',
  jobId: '6459034946.1715550269706.RhrUdaz4nUb9IVmNzV4vIqFKq83AMmO1',
  developer: 'DFST',
  repo: 'worker-example',
  args: '{"contractAddress":"B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD","isMany":true,"proof":"{\\n  \\"publicInput\\": [],\\n  \\"publicOutput\\": [\\n    \\"1570\\",\\n    \\"1000\\"\\n  ],\\n  \\"maxProofsVerified\\": 2,\\n  \\"proof\\": \\"KChzdGF0ZW1lbnQoKHByb29mX3N0YXRlKChkZWZlcnJlZF92YWx1ZXMoKHBsb25rKChhbHBoYSgoaW5uZXIoZDExZGM4OTZhYTNhYzJiYiA3NjNjMzg0NjA5NDkzYzYwKSkpKShiZXRhKDYzZmEyYWFjMTczYTBhZGIgMjM1MWQ4ZDk4OTNhZjg4NSkpKGdhbW1hKDRiNDY5OTBmNTI4Yzc3NWQgZDUxZmJlMTc3MDY2YzdmMikpKHpldGEoKGlubmVyKDIyMjE0MWUxM2M3YmZmZjcgM2I3NmU3ZWNhNWUyYmQ1MikpKSkoam9pbnRfY29tYmluZXIoKSkoZmVhdHVyZV9mbGFncygocmFuZ2VfY2hlY2swIGZhbHNlKShyYW5nZV9jaGVjazEgZmFsc2UpKGZvcmVpZ25fZmllbGRfYWRkIGZhbHNlKShmb3JlaWduX2ZpZWxkX211bCBmYWxzZSkoeG9yIGZhbHNlKShyb3QgZmFsc2UpKGxvb2t1cCBmYWxzZSkocnVudGltZV90YWJsZXMgZmFsc2UpKSkpKShidWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgocHJlY2hhbGxlbmdlKChpbm5lcihkYjgyZmVhN2NhOWVjMzIxIDI4OGYxNTY2ZGNjNzliY2EpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhMmIzZmI1ZTUzYTRjMzQwIDNiZjZjZDhhZjY2YWRjOTkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5YzMwN2U1MjIxMGUxMzFiIDlhYWQyOTBmYTVmMGU1MmYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigzYTdhOTU0NGNlNThhMWVjIGJmMzA4NWY3MTUzMDQ2MjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjYjc5Njk4MmFkNDJkNGRhIDQ1OWExOGY2ZjQ1ZmQzNTMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhYWFjOWY2OGVlMjA1ODlhIDFmY2YyMmJmOTU4YWM4Y2QpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4MzgzNzIwZGVkMDk4ODA0IDRiMzFkY2IwMmEyNDg0NTQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4MzIwMjEzNmQ2NjI4NTdhIGUwNjU3MTAzOTI2MGQyMzApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhOGRiNzNkMWY1NWQ5MWI0IDk5Yjg4NzMxMzNlMTc5MjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1NTEzMzlhNWE4OTljNzdhIDJhZjIxZTgwOGZhMjM1NDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4ZmQwZTcyOWM3YjEwYmRmIDdiMTcyMmY0YjJkMzFjYTUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0OTA3NjNjNTZkNGZjZTA3IDY5Yjg3NDg3YTMxYzQ0ZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0NjZiM2Y3OGUwNTRmYjk0IGIyNWQ0YjZhODM3NDc3ZjApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigzMjRjNjE3NjFmMjE1NGEwIDFhMzM5MmJlZDc5NzFjYzUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyOGIwOTdiYTQyNmUxNTUxIGNhMmVlMmI3N2ZhOWI1ZDEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkNTJmODc0YTg0NWU0NjI0IDE5Mjc4OGM1YTBiOGY2MmIpKSkpKSkpKGJyYW5jaF9kYXRhKChwcm9vZnNfdmVyaWZpZWQgTjIpKGRvbWFpbl9sb2cyIlwwMTUiKSkpKSkoc3BvbmdlX2RpZ2VzdF9iZWZvcmVfZXZhbHVhdGlvbnMoMDYwM2E1YjQ1M2Y4NzRkMSBlNTdlOTA2OTQ1YWM1NmY4IDFlYmEyMzM4YzlmZDA4MzUgMzUzZWNjYmNiOGY3NTc0OSkpKG1lc3NhZ2VzX2Zvcl9uZXh0X3dyYXBfcHJvb2YoKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnQoMHgwN0U3OTg4NEQ3MkFDRDBGMzdEQzFFMzEwMjM3N0NBNjdDQkM5MTk0MkJDQTNGRkFGMUQ1REE0RTVDMTI4QjVFIDB4Mzk1MTVFQjlDRUE5NzNEMjZBQjQ0RkYwQjRBRjczRThEREI4MjNGQkIzOERFNTkxMDdGQjdDMzkyMDk4MjVBRCkpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoYjk5N2ZkN2U1YzdmZGZhNSAwODcxOGExY2I3ZGE5Y2JmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZGQyOTMxMTgxODRkMWJmOSAxNzI4MDQwNWUzYzI2MWVhKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoOTA2YTRiN2MzMjg4OWE0NyAyNjM5MTc5OTcwZGY2ZjAxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMzIxYmI2ZDg1NjNjNDAyMiAyNDNjNmZlZjE0YjU2ZDg0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZTdjMDk5NjY4ZWQ3YTA3MCBhOGMwN2NmNTU2ZGQzMzE2KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMzUwMjFjNzdiNDBlNWEwOSAxZmIwY2MwOWQzYzllZGU5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZThhYmFkMDRkMjViOThkZiBmNjJkMDk4NjQxNDgyMmY0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMWMzMmIxNDAyYWUxODA4NSA3NzBhYTY4NmU1MGM2MWVlKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMTNjNjMwZGVmZmFmMjZjYSAzNWVjNTRhMDE4MzM0ZjBjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZDQwMWY1YWRiODRiNjU5MSBjZGIyZGY2YTkzOWY5NTE0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYzYwZDMzNzYzODcyZGZiZiBiZWI5OWEwYzFmMDUyZmMyKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoODQzYmNjZWVjNjI2ZDFkYiBmZWRhMmQyMjhjNjg3YTEwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjg4NWI2YzA2NjFkZmNjOSA3OTc3NDBjNmQwMzc4YjYxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZWZlZjJiMTFjMzI1YjNjZSA4NTIzZDNhODA1NTM5YjcwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZWJmNTViNTc3ZDI3OWExMSBlN2M3NTZkMTcwZGFkMzdkKSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcig1Zjg3ZTAyYTVmNTQxZGE0IGQxNWEwZDhlNjQ2ODI3ZGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkMGE2NTUyZWQ1NmY3ZTA5IGFmNTZjNTcxZmIwMWU3YjcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3ZmYyMTJmN2MwOWExMzIxIDk2MTYzYzdhYzczM2RhZTYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyM2UzNzQxZTY3NmQ3YmZhIGFhNzk0NmM1ODQ1ZjNhYjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkYTRkNjcyNDAzODNhOWY1IGQ4ZTE4OTRhOGFjMWQ4NjUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwZWMwZmRjMmY4YzY5NjFiIGI4YjA2YjA1YWU3NjZkODIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0NGQ0MjNmYWFiNjVlMjAwIDQxZTkxNDExMzZhNTQwYTQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3NjRiNTIwMDcwOGNmNWI1IGI0YThjOGM1N2RjOTY5ZDcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNjMzYzg0MGM5MjM5NjQwIDYyMzBlMmIxM2ZmOTY0NjApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxOGIwYjBiMTk3YjNkZTU3IGM0YjY1NmRhYWU5NTc1OWUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0ZTFjYzVmM2RkN2UzMmU4IGNkNWFmMjVkMWZiYThlZTApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxZmQ3YmM3NzIwY2VhOWVjIDg4ZWNhOTU2OGQ3MWQzOTIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlMzU4NTk5OGJhMTI0NTZjIDg0MDI3OWQ3MTYxZmUxOTMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwZTFjYTc5ZjM2NTNhZGVjIGU1MGU5MzAzMDliZTFlMmUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlM2UwMjk0NzZmYTk1NWEyIGVmNjljZDIzNzdjYzE0YzEpKSkpKSkpKSkpKSkobWVzc2FnZXNfZm9yX25leHRfc3RlcF9wcm9vZigoYXBwX3N0YXRlKCkpKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnRzKCgweDBCQ0VBQzVGMTlCNjI5Qjk2M0E3MTVCRUYwNkFENzJBNTMxMDAyNDREQ0JCRjE4ODlBRjk1MTI1MUU5QTBGNTkgMHgwMjBCQzk1RURDRDVBNkEzRTEwRTI1OTEzQjE1RENDNzVCMzE4MEFGMUNBRkIwOUIzM0Q2Mzg1RTFFOUM2NEEwKSgweDEwMkQ3QzJDQzVEMkUxOEQ3MUYxNEQwMkJFNEM0RkRGMDVFREFGMjExNUI3OEFERkJBQzg1NUNEQUNCM0NCMkEgMHgwMzkyMDQ5MkM2RTYyQjczMDBDMEY2QzE1ODU2MEM0QzUzNTg0MTBFOTFGMUYyMTEyNTU1MjI5MkZEQUFGQTUyKSkpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoZGQ3MTE3OGUwMzRiZjI5ZiA1NDE2MTUxN2VjNjc2NWUxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYmFjMTNlYzg1NTA5MDliNiBmZTg5NzUwNzU4MmZjZTg4KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTY5Njg4YWUzNzQwMGYyMCBjNTVhZDcwZGZkMThhZjA3KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMTRhNDY0YzRmYjExMTg0NCBkODJmMzI2N2FiNTE5ZDQ5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYmZhZmM5MjdiZjkwODc5YyBlMGYzNjliYzVlZDZiYzc0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoN2Q3ZDAzODdmZTc1NWZiYyBjODA1ZTc1MjVmNWNmZWRmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNmIwNTVkYzkyNmI4ZDAwMiBhMTcxMzQxZDM2ZmRjMzIwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYjZjZTcxODE5MGQ0MGQxYyBhMWFlNzM1NjBiNzA1ZWJlKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMjNkMWY5YzU3NDkwZWUwZiAyMmYzOWFiNjVhZjdiOGVjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMmNkODk1MjBhNTc5MmNhOSAxYzNmMjI0M2JiNWE0NzI4KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoM2Q5NDMyYjFkNzZlYzQ5MSBmYjJiNjZkNGE1MmFkMjUxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoM2E5ODY1NGVlYmFlZmQ5YSBlZjJiM2UyMDQxOTlmYjE1KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWE3M2RhNzMzNzJmNmUwZCBmNjdlMWQ3N2UxNzZkNTc2KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNmYxODA1NTdhNDNjZDIyMiA2MDcxY2E0NzZkZGFhM2JmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMDgwM2Q1NmE0ZmUxODQ2YyAzNzFjNDIxODRhYTZkNTllKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjIxZmEwNDQzNmY3MWU5ZiBmNGE4OTFkMGIxZjE0NmNlKSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcihhYmE0M2QyODBmNzJmZDE5IGRkNzdiMDMzMGRlZjkzOWIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyMzhmYzhmNzAyMjUwM2Q3IGQzNTJjZjdmMjlkMzBhY2MpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2OGEwMDE3NmFlM2I3MzIzIDAzODcxNmM5ZDFmMDE0YWYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0MTM0MzRlY2U3ZDMxMTIyIDQ0MzgzNDU5NDIzZmRkZDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNWFlZGYxNmQ3MzJkYWVmIDBhNDkzMzBjZGZhMTJiYjcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3YjQzNDhkYzBkNTBhNDNlIGYxM2ZlNjhhYTMzNjE3ZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0MzZmOTg5MjJkMzJiNzU4IDI0MDg4Njk0NzQ4ZmY2M2QpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5ZDhkYjA2Zjk5ZmI4NWRjIDM3ZWI0YmZjZTg1MjBjNWEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkMTJmM2MxMDE5NzU0MzM2IDljYzNkMTJkZmYwMjhlMGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxNDI0Y2MxYzIyZjBjNzQ2IDAwNjJjNWQ2YWJjMmZjZDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwOWRjYmM4YjQzMjRjZDZiIDdjNGJiYTExODdiMjNjYmEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlNDYwMmMwYTgwMzkxZWU3IGVkYWYyZjQwMzlmNjQyNjcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwNDM3MTQyOWY0YmYxNTlmIDUzYzBhNzJkN2JlMDdlZDYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2ZmU3MGY0MzI0YzBkNjNhIDIzNWFjZjJlZmY5ZDVlY2MpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmNGY2MDFhMGU1ZTU0OTBmIGFiMDM4NjFiZWIxNGRkYTMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NjViNTg4YWJlZGE1M2VkIDA4ZjI3MTc2Yjg3ZjM3MWQpKSkpKSkpKSkpKSkocHJldl9ldmFscygoZXZhbHMoKHB1YmxpY19pbnB1dCgweDI2QTIwQURCMEI3MDczMDQwOTk1ODZENDMxNDRBMEQzMTZEMDk5OThGOEY5NDFDQTkzMDI3RUY5NkUzMEIxNjggMHgyRjFGN0RBNzNGN0ZBQzE0REREOTQ3N0UxODhERTExQjk3MUYxN0MyRUYxRkFGNDk0NTNGQjUyNTE2RUFGRkMzKSkoZXZhbHMoKHcoKCgweDA4NzU3MzdGMjg5RTY0MEIzNjIyMzJDOTAwM0E4ODdCMDVBOUY2Mzg0QTlDMzU3RjJEQkQ4RTdENDQwNEEyNTQpKDB4MkE2N0E0NjM5RDZDRThGMThERTZDOTkyRDA0MEIxMkFGRTVCRDkwNDNBQTg2MzMzOEEyNTI2NURCNUFBMzA1NykpKCgweDBCNDM0MTRFQTg3QkZEMDg5NzYyQTI5NzdDRjk4M0NGQkEzRjgxRDcwOUIwNjMzQzk0QzVBMUJCRjYwQzZEQTcpKDB4MjA2MzYwNzQxNDA4OTdCRjZGQzIzOEE0REIyODI2MjUxOUQ0NjI4NDdCQTIxN0IwN0Y0RDg0MDIyRTAwQkIzNSkpKCgweDJEOEQ5RTdFRkNBMTg0MkQyNjdERTEyMjBBNjVCMjY3QkUwOThBQTQyRTYyRDdBOTAwNkUxQ0QzMjYwMjEzNkEpKDB4MUFGODU5QUQxMTRFRUE4MDI2OURCRTMxOTA4QTEyREE1QjQ4NUJFQzE0RDQyQTZBQzNDMzM4OEM1NDdCRDM2NykpKCgweDAwQ0JBMkY3NjQ5NTREMTg0ODQ5MjQyMjJCRUFGQ0U3OUVENDczNDVBOUU0NjIzQkRGNUZDQjNGMkE3QkY1RTQpKDB4MDJDNDJEQURCOUE4NUE1RDlEMTEwQUQ5QjFDQ0IwNEU4Mjc4QTdBMTZDNjM1RjlFQzYxM0I5NThENjFBMDQ4MSkpKCgweDE5RjE5NTE4NDdGM0ZDNUQ0RDZERjVFRDdGOTNDNzEwRTVFRkZGQjA5MkJFNjI4Njg0RDVDMDQ4MThGRDE5MjMpKDB4MzdDMkU2RjM4OTJEOUY4QjJDQjJBRDFENjZBQjgzQkYwREVDQzdBM0ExQzQyRTc2OEMxOTQ4QjFDREJGNTVGNSkpKCgweDA2OTYyNkUxQzUxNjM0MjVGNzJERjUwNzM1N0I5NTMwRjJGQTVBMDExNDI3M0Q3NEE0MzYxODFCNzUyNzYwMTYpKDB4MDRBOTk3MUVGMjY1MjVDMDZFNUVDMDJCMzdDNkM0MDFCMDRCM0U5RDNFQUExNzJGMTNCODI3NTA3ODg2MDY5MikpKCgweDFEQzJCQjYzMzk3QTEzMjJGRkVDMDVGQTU1Q0FGQzA3MTQ1REY4MEMzOUY1NEIxNDdDMDg2RkIyNzg4RDBCQUQpKDB4MTYzMUZCMUM4REUxN0EzMjI1RjZDQkQ0RjFCRUU5NjkyMzk3QzNFOTlBN0E5MzQ1QkU2RTYxMzI2QjEyQjJDRSkpKCgweDE1OEJGMDQ3NDlCQUVGN0M4MEFGQjkzMUYwRTg5MjZGMEJEQzhBMDJFRDFFQzg4NERGOTJCNjQ3OTBFOTM3NkEpKDB4MUQzRjI5RDkwNENCRDk5RTFBNkJGNTdDMDQ3OEE5NTJFMDIwNThBM0UxODUxMDJENjFDM0YzRkJGN0EyMzlEMikpKCgweDM0N0Q2N0RDOUJGOTE5NEE5RURFRTYyMjgxOUZDMjA3OTg5MUYzNzNFRDVEOTRGNTlENTI2RDJBRDVBOUU4NkIpKDB4MkJBRUU5MDE0MkEyQjQyQ0JEMUYzQkIzMjE1MjIxN0VBNDQ3QjUwOTE3OUFDNjlBQUJCODFDRDU3RTkzMjEyNCkpKCg'... 25412 more characters
}

[12:44:41 AM] 2024-05-12T21:44:29.858Z	INFO	zkCloudWorker Execute start: {
  command: 'execute',
  developer: 'DFST',
  repo: 'worker-example',
  id: '6459034946',
  jobId: '6459034946.1715550269706.RhrUdaz4nUb9IVmNzV4vIqFKq83AMmO1',
  job: {
    metadata: 'many',
    logStreams: [],
    task: 'many',
    maxAttempts: 0,
    args: '{"contractAddress":"B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD","isMany":true,"proof":"{\\n  \\"publicInput\\": [],\\n  \\"publicOutput\\": [\\n    \\"1570\\",\\n    \\"1000\\"\\n  ],\\n  \\"maxProofsVerified\\": 2,\\n  \\"proof\\": \\"KChzdGF0ZW1lbnQoKHByb29mX3N0YXRlKChkZWZlcnJlZF92YWx1ZXMoKHBsb25rKChhbHBoYSgoaW5uZXIoZDExZGM4OTZhYTNhYzJiYiA3NjNjMzg0NjA5NDkzYzYwKSkpKShiZXRhKDYzZmEyYWFjMTczYTBhZGIgMjM1MWQ4ZDk4OTNhZjg4NSkpKGdhbW1hKDRiNDY5OTBmNTI4Yzc3NWQgZDUxZmJlMTc3MDY2YzdmMikpKHpldGEoKGlubmVyKDIyMjE0MWUxM2M3YmZmZjcgM2I3NmU3ZWNhNWUyYmQ1MikpKSkoam9pbnRfY29tYmluZXIoKSkoZmVhdHVyZV9mbGFncygocmFuZ2VfY2hlY2swIGZhbHNlKShyYW5nZV9jaGVjazEgZmFsc2UpKGZvcmVpZ25fZmllbGRfYWRkIGZhbHNlKShmb3JlaWduX2ZpZWxkX211bCBmYWxzZSkoeG9yIGZhbHNlKShyb3QgZmFsc2UpKGxvb2t1cCBmYWxzZSkocnVudGltZV90YWJsZXMgZmFsc2UpKSkpKShidWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgocHJlY2hhbGxlbmdlKChpbm5lcihkYjgyZmVhN2NhOWVjMzIxIDI4OGYxNTY2ZGNjNzliY2EpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhMmIzZmI1ZTUzYTRjMzQwIDNiZjZjZDhhZjY2YWRjOTkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5YzMwN2U1MjIxMGUxMzFiIDlhYWQyOTBmYTVmMGU1MmYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigzYTdhOTU0NGNlNThhMWVjIGJmMzA4NWY3MTUzMDQ2MjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjYjc5Njk4MmFkNDJkNGRhIDQ1OWExOGY2ZjQ1ZmQzNTMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhYWFjOWY2OGVlMjA1ODlhIDFmY2YyMmJmOTU4YWM4Y2QpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4MzgzNzIwZGVkMDk4ODA0IDRiMzFkY2IwMmEyNDg0NTQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4MzIwMjEzNmQ2NjI4NTdhIGUwNjU3MTAzOTI2MGQyMzApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhOGRiNzNkMWY1NWQ5MWI0IDk5Yjg4NzMxMzNlMTc5MjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1NTEzMzlhNWE4OTljNzdhIDJhZjIxZTgwOGZhMjM1NDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4ZmQwZTcyOWM3YjEwYmRmIDdiMTcyMmY0YjJkMzFjYTUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0OTA3NjNjNTZkNGZjZTA3IDY5Yjg3NDg3YTMxYzQ0ZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0NjZiM2Y3OGUwNTRmYjk0IGIyNWQ0YjZhODM3NDc3ZjApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigzMjRjNjE3NjFmMjE1NGEwIDFhMzM5MmJlZDc5NzFjYzUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyOGIwOTdiYTQyNmUxNTUxIGNhMmVlMmI3N2ZhOWI1ZDEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkNTJmODc0YTg0NWU0NjI0IDE5Mjc4OGM1YTBiOGY2MmIpKSkpKSkpKGJyYW5jaF9kYXRhKChwcm9vZnNfdmVyaWZpZWQgTjIpKGRvbWFpbl9sb2cyIlwwMTUiKSkpKSkoc3BvbmdlX2RpZ2VzdF9iZWZvcmVfZXZhbHVhdGlvbnMoMDYwM2E1YjQ1M2Y4NzRkMSBlNTdlOTA2OTQ1YWM1NmY4IDFlYmEyMzM4YzlmZDA4MzUgMzUzZWNjYmNiOGY3NTc0OSkpKG1lc3NhZ2VzX2Zvcl9uZXh0X3dyYXBfcHJvb2YoKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnQoMHgwN0U3OTg4NEQ3MkFDRDBGMzdEQzFFMzEwMjM3N0NBNjdDQkM5MTk0MkJDQTNGRkFGMUQ1REE0RTVDMTI4QjVFIDB4Mzk1MTVFQjlDRUE5NzNEMjZBQjQ0RkYwQjRBRjczRThEREI4MjNGQkIzOERFNTkxMDdGQjdDMzkyMDk4MjVBRCkpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoYjk5N2ZkN2U1YzdmZGZhNSAwODcxOGExY2I3ZGE5Y2JmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZGQyOTMxMTgxODRkMWJmOSAxNzI4MDQwNWUzYzI2MWVhKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoOTA2YTRiN2MzMjg4OWE0NyAyNjM5MTc5OTcwZGY2ZjAxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMzIxYmI2ZDg1NjNjNDAyMiAyNDNjNmZlZjE0YjU2ZDg0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZTdjMDk5NjY4ZWQ3YTA3MCBhOGMwN2NmNTU2ZGQzMzE2KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMzUwMjFjNzdiNDBlNWEwOSAxZmIwY2MwOWQzYzllZGU5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZThhYmFkMDRkMjViOThkZiBmNjJkMDk4NjQxNDgyMmY0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMWMzMmIxNDAyYWUxODA4NSA3NzBhYTY4NmU1MGM2MWVlKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMTNjNjMwZGVmZmFmMjZjYSAzNWVjNTRhMDE4MzM0ZjBjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZDQwMWY1YWRiODRiNjU5MSBjZGIyZGY2YTkzOWY5NTE0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYzYwZDMzNzYzODcyZGZiZiBiZWI5OWEwYzFmMDUyZmMyKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoODQzYmNjZWVjNjI2ZDFkYiBmZWRhMmQyMjhjNjg3YTEwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjg4NWI2YzA2NjFkZmNjOSA3OTc3NDBjNmQwMzc4YjYxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZWZlZjJiMTFjMzI1YjNjZSA4NTIzZDNhODA1NTM5YjcwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZWJmNTViNTc3ZDI3OWExMSBlN2M3NTZkMTcwZGFkMzdkKSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcig1Zjg3ZTAyYTVmNTQxZGE0IGQxNWEwZDhlNjQ2ODI3ZGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkMGE2NTUyZWQ1NmY3ZTA5IGFmNTZjNTcxZmIwMWU3YjcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3ZmYyMTJmN2MwOWExMzIxIDk2MTYzYzdhYzczM2RhZTYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyM2UzNzQxZTY3NmQ3YmZhIGFhNzk0NmM1ODQ1ZjNhYjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkYTRkNjcyNDAzODNhOWY1IGQ4ZTE4OTRhOGFjMWQ4NjUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwZWMwZmRjMmY4YzY5NjFiIGI4YjA2YjA1YWU3NjZkODIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0NGQ0MjNmYWFiNjVlMjAwIDQxZTkxNDExMzZhNTQwYTQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3NjRiNTIwMDcwOGNmNWI1IGI0YThjOGM1N2RjOTY5ZDcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNjMzYzg0MGM5MjM5NjQwIDYyMzBlMmIxM2ZmOTY0NjApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxOGIwYjBiMTk3YjNkZTU3IGM0YjY1NmRhYWU5NTc1OWUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0ZTFjYzVmM2RkN2UzMmU4IGNkNWFmMjVkMWZiYThlZTApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxZmQ3YmM3NzIwY2VhOWVjIDg4ZWNhOTU2OGQ3MWQzOTIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlMzU4NTk5OGJhMTI0NTZjIDg0MDI3OWQ3MTYxZmUxOTMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwZTFjYTc5ZjM2NTNhZGVjIGU1MGU5MzAzMDliZTFlMmUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlM2UwMjk0NzZmYTk1NWEyIGVmNjljZDIzNzdjYzE0YzEpKSkpKSkpKSkpKSkobWVzc2FnZXNfZm9yX25leHRfc3RlcF9wcm9vZigoYXBwX3N0YXRlKCkpKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnRzKCgweDBCQ0VBQzVGMTlCNjI5Qjk2M0E3MTVCRUYwNkFENzJBNTMxMDAyNDREQ0JCRjE4ODlBRjk1MTI1MUU5QTBGNTkgMHgwMjBCQzk1RURDRDVBNkEzRTEwRTI1OTEzQjE1RENDNzVCMzE4MEFGMUNBRkIwOUIzM0Q2Mzg1RTFFOUM2NEEwKSgweDEwMkQ3QzJDQzVEMkUxOEQ3MUYxNEQwMkJFNEM0RkRGMDVFREFGMjExNUI3OEFERkJBQzg1NUNEQUNCM0NCMkEgMHgwMzkyMDQ5MkM2RTYyQjczMDBDMEY2QzE1ODU2MEM0QzUzNTg0MTBFOTFGMUYyMTEyNTU1MjI5MkZEQUFGQTUyKSkpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoZGQ3MTE3OGUwMzRiZjI5ZiA1NDE2MTUxN2VjNjc2NWUxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYmFjMTNlYzg1NTA5MDliNiBmZTg5NzUwNzU4MmZjZTg4KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTY5Njg4YWUzNzQwMGYyMCBjNTVhZDcwZGZkMThhZjA3KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMTRhNDY0YzRmYjExMTg0NCBkODJmMzI2N2FiNTE5ZDQ5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYmZhZmM5MjdiZjkwODc5YyBlMGYzNjliYzVlZDZiYzc0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoN2Q3ZDAzODdmZTc1NWZiYyBjODA1ZTc1MjVmNWNmZWRmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNmIwNTVkYzkyNmI4ZDAwMiBhMTcxMzQxZDM2ZmRjMzIwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYjZjZTcxODE5MGQ0MGQxYyBhMWFlNzM1NjBiNzA1ZWJlKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMjNkMWY5YzU3NDkwZWUwZiAyMmYzOWFiNjVhZjdiOGVjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMmNkODk1MjBhNTc5MmNhOSAxYzNmMjI0M2JiNWE0NzI4KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoM2Q5NDMyYjFkNzZlYzQ5MSBmYjJiNjZkNGE1MmFkMjUxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoM2E5ODY1NGVlYmFlZmQ5YSBlZjJiM2UyMDQxOTlmYjE1KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWE3M2RhNzMzNzJmNmUwZCBmNjdlMWQ3N2UxNzZkNTc2KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNmYxODA1NTdhNDNjZDIyMiA2MDcxY2E0NzZkZGFhM2JmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMDgwM2Q1NmE0ZmUxODQ2YyAzNzFjNDIxODRhYTZkNTllKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjIxZmEwNDQzNmY3MWU5ZiBmNGE4OTFkMGIxZjE0NmNlKSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcihhYmE0M2QyODBmNzJmZDE5IGRkNzdiMDMzMGRlZjkzOWIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyMzhmYzhmNzAyMjUwM2Q3IGQzNTJjZjdmMjlkMzBhY2MpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2OGEwMDE3NmFlM2I3MzIzIDAzODcxNmM5ZDFmMDE0YWYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0MTM0MzRlY2U3ZDMxMTIyIDQ0MzgzNDU5NDIzZmRkZDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNWFlZGYxNmQ3MzJkYWVmIDBhNDkzMzBjZGZhMTJiYjcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3YjQzNDhkYzBkNTBhNDNlIGYxM2ZlNjhhYTMzNjE3ZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0MzZmOTg5MjJkMzJiNzU4IDI0MDg4Njk0NzQ4ZmY2M2QpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5ZDhkYjA2Zjk5ZmI4NWRjIDM3ZWI0YmZjZTg1MjBjNWEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkMTJmM2MxMDE5NzU0MzM2IDljYzNkMTJkZmYwMjhlMGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxNDI0Y2MxYzIyZjBjNzQ2IDAwNjJjNWQ2YWJjMmZjZDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwOWRjYmM4YjQzMjRjZDZiIDdjNGJiYTExODdiMjNjYmEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlNDYwMmMwYTgwMzkxZWU3IGVkYWYyZjQwMzlmNjQyNjcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwNDM3MTQyOWY0YmYxNTlmIDUzYzBhNzJkN2JlMDdlZDYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2ZmU3MGY0MzI0YzBkNjNhIDIzNWFjZjJlZmY5ZDVlY2MpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmNGY2MDFhMGU1ZTU0OTBmIGFiMDM4NjFiZWIxNGRkYTMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NjViNTg4YWJlZGE1M2VkIDA4ZjI3MTc2Yjg3ZjM3MWQpKSkpKSkpKSkpKSkocHJldl9ldmFscygoZXZhbHMoKHB1YmxpY19pbnB1dCgweDI2QTIwQURCMEI3MDczMDQwOTk1ODZENDMxNDRBMEQzMTZEMDk5OThGOEY5NDFDQTkzMDI3RUY5NkUzMEIxNjggMHgyRjFGN0RBNzNGN0ZBQzE0REREOTQ3N0UxODhERTExQjk3MUYxN0MyRUYxRkFGNDk0NTNGQjUyNTE2RUFGRkMzKSkoZXZhbHMoKHcoKCgweDA4NzU3MzdGMjg5RTY0MEIzNjIyMzJDOTAwM0E4ODdCMDVBOUY2Mzg0QTlDMzU3RjJEQkQ4RTdENDQwNEEyNTQpKDB4MkE2N0E0NjM5RDZDRThGMThERTZDOTkyRDA0MEIxMkFGRTVCRDkwNDNBQTg2MzMzOEEyNTI2NURCNUFBMzA1NykpKCgweDBCNDM0MTRFQTg3QkZEMDg5NzYyQTI5NzdDRjk4M0NGQkEzRjgxRDcwOUIwNjMzQzk0QzVBMUJCRjYwQzZEQTcpKDB4MjA2MzYwNzQxNDA4OTdCRjZGQzIzOEE0REIyODI2MjUxOUQ0NjI4NDdCQTIxN0IwN0Y0RDg0MDIyRTAwQkIzNSkpKCgweDJEOEQ5RTdFRkNBMTg0MkQyNjdERTEyMjBBNjVCMjY3QkUwOThBQTQyRTYyRDdBOTAwNkUxQ0QzMjYwMjEzNkEpKDB4MUFGODU5QUQxMTRFRUE4MDI2OURCRTMxOTA4QTEyREE1QjQ4NUJFQzE0RDQyQTZBQzNDMzM4OEM1NDdCRDM2NykpKCgweDAwQ0JBMkY3NjQ5NTREMTg0ODQ5MjQyMjJCRUFGQ0U3OUVENDczNDVBOUU0NjIzQkRGNUZDQjNGMkE3QkY1RTQpKDB4MDJDNDJEQURCOUE4NUE1RDlEMTEwQUQ5QjFDQ0IwNEU4Mjc4QTdBMTZDNjM1RjlFQzYxM0I5NThENjFBMDQ4MSkpKCgweDE5RjE5NTE4NDdGM0ZDNUQ0RDZERjVFRDdGOTNDNzEwRTVFRkZGQjA5MkJFNjI4Njg0RDVDMDQ4MThGRDE5MjMpKDB4MzdDMkU2RjM4OTJEOUY4QjJDQjJBRDFENjZBQjgzQkYwREVDQzdBM0ExQzQyRTc2OEMxOTQ4QjFDREJGNTVGNSkpKCgweDA2OTYyNkUxQzUxNjM0MjVGNzJERjUwNzM1N0I5NTMwRjJGQTVBMDExNDI3M0Q3NEE0MzYxODFCNzUyNzYwMTYpKDB4MDRBOTk3MUVGMjY1MjVDMDZFNUVDMDJCMzdDNkM0MDFCMDRCM0U5RDNFQUExNzJGMTNCODI3NTA3ODg2MDY5MikpKCgweDFEQzJCQjYzMzk3QTEzMjJGRkVDMDVGQTU1Q0FGQzA3MTQ1REY4MEMzOUY1NEIxNDdDMDg2RkIyNzg4RDBCQUQpKDB4MTYzMUZCMUM4REUxN0EzMjI1RjZDQkQ0RjFCRUU5NjkyMzk3QzNFOTlBN0E5MzQ1QkU2RTYxMzI2QjEyQjJDRSkpKCgweDE1OEJGMDQ3NDlCQUVGN0M4MEFGQjkzMUYwRTg5MjZGMEJEQzhBMDJFRDFFQzg4NERGOTJCNjQ3OTBFOTM3NkEpKDB4MUQzRjI5RDkwNENCRDk5RTFBNkJGNTdDMDQ3OEE5NTJFMDIwNThBM0UxODUxMDJENjFDM0YzRkJGN0EyMzlEMikpKCgweDM0N0Q2N0RDOUJGOTE5NEE5RURFRTYyMjgxOUZDMjA3OTg5MUYzNzNFRDVEOTRGNTlENTI2RDJBRDVBOUU4NkIpKDB4MkJBRUU5MDE0MkEyQjQyQ0JEMUYzQkIzMjE1MjIxN0VBNDQ3QjUwOTE3OUFDNjlBQUJCODFDRDU3RTkzMjEyNCkpKCg'... 25412 more characters,
    timeCreated: 1715550269706,
    timeCreatedString: '2024-05-12T21:44:29.706Z',
    jobId: '6459034946.1715550269706.RhrUdaz4nUb9IVmNzV4vIqFKq83AMmO1',
    repo: 'worker-example',
    developer: 'DFST',
    chain: 'zeko',
    txNumber: 1,
    jobStatus: 'created',
    id: '6459034946'
  }
}

[12:44:41 AM] 2024-05-12T21:44:29.859Z	INFO	RSS memory start: 1246 MB, changed by 0 MB

[12:44:41 AM] 2024-05-12T21:44:29.860Z	INFO	CloudWorker: constructor {
  id: '6459034946',
  jobId: '6459034946.1715550269706.RhrUdaz4nUb9IVmNzV4vIqFKq83AMmO1',
  developer: 'DFST',
  repo: 'worker-example',
  task: 'many',
  taskId: undefined,
  userId: undefined,
  args: '{"contractAddress":"B62qrZso6WMaxZPrkDHW9sa7BTtVKjHon6BJxUbN3q6PwdTNQXWvADD","isMany":true,"proof":"{\\n  \\"publicInput\\": [],\\n  \\"publicOutput\\": [\\n    \\"1570\\",\\n    \\"1000\\"\\n  ],\\n  \\"maxProofsVerified\\": 2,\\n  \\"proof\\": \\"KChzdGF0ZW1lbnQoKHByb29mX3N0YXRlKChkZWZlcnJlZF92YWx1ZXMoKHBsb25rKChhbHBoYSgoaW5uZXIoZDExZGM4OTZhYTNhYzJiYiA3NjNjMzg0NjA5NDkzYzYwKSkpKShiZXRhKDYzZmEyYWFjMTczYTBhZGIgMjM1MWQ4ZDk4OTNhZjg4NSkpKGdhbW1hKDRiNDY5OTBmNTI4Yzc3NWQgZDUxZmJlMTc3MDY2YzdmMikpKHpldGEoKGlubmVyKDIyMjE0MWUxM2M3YmZmZjcgM2I3NmU3ZWNhNWUyYmQ1MikpKSkoam9pbnRfY29tYmluZXIoKSkoZmVhdHVyZV9mbGFncygocmFuZ2VfY2hlY2swIGZhbHNlKShyYW5nZV9jaGVjazEgZmFsc2UpKGZvcmVpZ25fZmllbGRfYWRkIGZhbHNlKShmb3JlaWduX2ZpZWxkX211bCBmYWxzZSkoeG9yIGZhbHNlKShyb3QgZmFsc2UpKGxvb2t1cCBmYWxzZSkocnVudGltZV90YWJsZXMgZmFsc2UpKSkpKShidWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgocHJlY2hhbGxlbmdlKChpbm5lcihkYjgyZmVhN2NhOWVjMzIxIDI4OGYxNTY2ZGNjNzliY2EpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhMmIzZmI1ZTUzYTRjMzQwIDNiZjZjZDhhZjY2YWRjOTkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5YzMwN2U1MjIxMGUxMzFiIDlhYWQyOTBmYTVmMGU1MmYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigzYTdhOTU0NGNlNThhMWVjIGJmMzA4NWY3MTUzMDQ2MjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihjYjc5Njk4MmFkNDJkNGRhIDQ1OWExOGY2ZjQ1ZmQzNTMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhYWFjOWY2OGVlMjA1ODlhIDFmY2YyMmJmOTU4YWM4Y2QpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4MzgzNzIwZGVkMDk4ODA0IDRiMzFkY2IwMmEyNDg0NTQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4MzIwMjEzNmQ2NjI4NTdhIGUwNjU3MTAzOTI2MGQyMzApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhOGRiNzNkMWY1NWQ5MWI0IDk5Yjg4NzMxMzNlMTc5MjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig1NTEzMzlhNWE4OTljNzdhIDJhZjIxZTgwOGZhMjM1NDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig4ZmQwZTcyOWM3YjEwYmRmIDdiMTcyMmY0YjJkMzFjYTUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0OTA3NjNjNTZkNGZjZTA3IDY5Yjg3NDg3YTMxYzQ0ZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0NjZiM2Y3OGUwNTRmYjk0IGIyNWQ0YjZhODM3NDc3ZjApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigzMjRjNjE3NjFmMjE1NGEwIDFhMzM5MmJlZDc5NzFjYzUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyOGIwOTdiYTQyNmUxNTUxIGNhMmVlMmI3N2ZhOWI1ZDEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkNTJmODc0YTg0NWU0NjI0IDE5Mjc4OGM1YTBiOGY2MmIpKSkpKSkpKGJyYW5jaF9kYXRhKChwcm9vZnNfdmVyaWZpZWQgTjIpKGRvbWFpbl9sb2cyIlwwMTUiKSkpKSkoc3BvbmdlX2RpZ2VzdF9iZWZvcmVfZXZhbHVhdGlvbnMoMDYwM2E1YjQ1M2Y4NzRkMSBlNTdlOTA2OTQ1YWM1NmY4IDFlYmEyMzM4YzlmZDA4MzUgMzUzZWNjYmNiOGY3NTc0OSkpKG1lc3NhZ2VzX2Zvcl9uZXh0X3dyYXBfcHJvb2YoKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnQoMHgwN0U3OTg4NEQ3MkFDRDBGMzdEQzFFMzEwMjM3N0NBNjdDQkM5MTk0MkJDQTNGRkFGMUQ1REE0RTVDMTI4QjVFIDB4Mzk1MTVFQjlDRUE5NzNEMjZBQjQ0RkYwQjRBRjczRThEREI4MjNGQkIzOERFNTkxMDdGQjdDMzkyMDk4MjVBRCkpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoYjk5N2ZkN2U1YzdmZGZhNSAwODcxOGExY2I3ZGE5Y2JmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZGQyOTMxMTgxODRkMWJmOSAxNzI4MDQwNWUzYzI2MWVhKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoOTA2YTRiN2MzMjg4OWE0NyAyNjM5MTc5OTcwZGY2ZjAxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMzIxYmI2ZDg1NjNjNDAyMiAyNDNjNmZlZjE0YjU2ZDg0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZTdjMDk5NjY4ZWQ3YTA3MCBhOGMwN2NmNTU2ZGQzMzE2KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMzUwMjFjNzdiNDBlNWEwOSAxZmIwY2MwOWQzYzllZGU5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZThhYmFkMDRkMjViOThkZiBmNjJkMDk4NjQxNDgyMmY0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMWMzMmIxNDAyYWUxODA4NSA3NzBhYTY4NmU1MGM2MWVlKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMTNjNjMwZGVmZmFmMjZjYSAzNWVjNTRhMDE4MzM0ZjBjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZDQwMWY1YWRiODRiNjU5MSBjZGIyZGY2YTkzOWY5NTE0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYzYwZDMzNzYzODcyZGZiZiBiZWI5OWEwYzFmMDUyZmMyKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoODQzYmNjZWVjNjI2ZDFkYiBmZWRhMmQyMjhjNjg3YTEwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjg4NWI2YzA2NjFkZmNjOSA3OTc3NDBjNmQwMzc4YjYxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZWZlZjJiMTFjMzI1YjNjZSA4NTIzZDNhODA1NTM5YjcwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZWJmNTViNTc3ZDI3OWExMSBlN2M3NTZkMTcwZGFkMzdkKSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcig1Zjg3ZTAyYTVmNTQxZGE0IGQxNWEwZDhlNjQ2ODI3ZGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkMGE2NTUyZWQ1NmY3ZTA5IGFmNTZjNTcxZmIwMWU3YjcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3ZmYyMTJmN2MwOWExMzIxIDk2MTYzYzdhYzczM2RhZTYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyM2UzNzQxZTY3NmQ3YmZhIGFhNzk0NmM1ODQ1ZjNhYjkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkYTRkNjcyNDAzODNhOWY1IGQ4ZTE4OTRhOGFjMWQ4NjUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwZWMwZmRjMmY4YzY5NjFiIGI4YjA2YjA1YWU3NjZkODIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0NGQ0MjNmYWFiNjVlMjAwIDQxZTkxNDExMzZhNTQwYTQpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3NjRiNTIwMDcwOGNmNWI1IGI0YThjOGM1N2RjOTY5ZDcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNjMzYzg0MGM5MjM5NjQwIDYyMzBlMmIxM2ZmOTY0NjApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxOGIwYjBiMTk3YjNkZTU3IGM0YjY1NmRhYWU5NTc1OWUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0ZTFjYzVmM2RkN2UzMmU4IGNkNWFmMjVkMWZiYThlZTApKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxZmQ3YmM3NzIwY2VhOWVjIDg4ZWNhOTU2OGQ3MWQzOTIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlMzU4NTk5OGJhMTI0NTZjIDg0MDI3OWQ3MTYxZmUxOTMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwZTFjYTc5ZjM2NTNhZGVjIGU1MGU5MzAzMDliZTFlMmUpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlM2UwMjk0NzZmYTk1NWEyIGVmNjljZDIzNzdjYzE0YzEpKSkpKSkpKSkpKSkobWVzc2FnZXNfZm9yX25leHRfc3RlcF9wcm9vZigoYXBwX3N0YXRlKCkpKGNoYWxsZW5nZV9wb2x5bm9taWFsX2NvbW1pdG1lbnRzKCgweDBCQ0VBQzVGMTlCNjI5Qjk2M0E3MTVCRUYwNkFENzJBNTMxMDAyNDREQ0JCRjE4ODlBRjk1MTI1MUU5QTBGNTkgMHgwMjBCQzk1RURDRDVBNkEzRTEwRTI1OTEzQjE1RENDNzVCMzE4MEFGMUNBRkIwOUIzM0Q2Mzg1RTFFOUM2NEEwKSgweDEwMkQ3QzJDQzVEMkUxOEQ3MUYxNEQwMkJFNEM0RkRGMDVFREFGMjExNUI3OEFERkJBQzg1NUNEQUNCM0NCMkEgMHgwMzkyMDQ5MkM2RTYyQjczMDBDMEY2QzE1ODU2MEM0QzUzNTg0MTBFOTFGMUYyMTEyNTU1MjI5MkZEQUFGQTUyKSkpKG9sZF9idWxsZXRwcm9vZl9jaGFsbGVuZ2VzKCgoKHByZWNoYWxsZW5nZSgoaW5uZXIoZGQ3MTE3OGUwMzRiZjI5ZiA1NDE2MTUxN2VjNjc2NWUxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYmFjMTNlYzg1NTA5MDliNiBmZTg5NzUwNzU4MmZjZTg4KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYTY5Njg4YWUzNzQwMGYyMCBjNTVhZDcwZGZkMThhZjA3KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMTRhNDY0YzRmYjExMTg0NCBkODJmMzI2N2FiNTE5ZDQ5KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYmZhZmM5MjdiZjkwODc5YyBlMGYzNjliYzVlZDZiYzc0KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoN2Q3ZDAzODdmZTc1NWZiYyBjODA1ZTc1MjVmNWNmZWRmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNmIwNTVkYzkyNmI4ZDAwMiBhMTcxMzQxZDM2ZmRjMzIwKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoYjZjZTcxODE5MGQ0MGQxYyBhMWFlNzM1NjBiNzA1ZWJlKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMjNkMWY5YzU3NDkwZWUwZiAyMmYzOWFiNjVhZjdiOGVjKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMmNkODk1MjBhNTc5MmNhOSAxYzNmMjI0M2JiNWE0NzI4KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoM2Q5NDMyYjFkNzZlYzQ5MSBmYjJiNjZkNGE1MmFkMjUxKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoM2E5ODY1NGVlYmFlZmQ5YSBlZjJiM2UyMDQxOTlmYjE1KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNWE3M2RhNzMzNzJmNmUwZCBmNjdlMWQ3N2UxNzZkNTc2KSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoNmYxODA1NTdhNDNjZDIyMiA2MDcxY2E0NzZkZGFhM2JmKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoMDgwM2Q1NmE0ZmUxODQ2YyAzNzFjNDIxODRhYTZkNTllKSkpKSkoKHByZWNoYWxsZW5nZSgoaW5uZXIoZjIxZmEwNDQzNmY3MWU5ZiBmNGE4OTFkMGIxZjE0NmNlKSkpKSkpKCgocHJlY2hhbGxlbmdlKChpbm5lcihhYmE0M2QyODBmNzJmZDE5IGRkNzdiMDMzMGRlZjkzOWIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigyMzhmYzhmNzAyMjUwM2Q3IGQzNTJjZjdmMjlkMzBhY2MpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2OGEwMDE3NmFlM2I3MzIzIDAzODcxNmM5ZDFmMDE0YWYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0MTM0MzRlY2U3ZDMxMTIyIDQ0MzgzNDU5NDIzZmRkZDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihhNWFlZGYxNmQ3MzJkYWVmIDBhNDkzMzBjZGZhMTJiYjcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig3YjQzNDhkYzBkNTBhNDNlIGYxM2ZlNjhhYTMzNjE3ZDkpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig0MzZmOTg5MjJkMzJiNzU4IDI0MDg4Njk0NzQ4ZmY2M2QpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5ZDhkYjA2Zjk5ZmI4NWRjIDM3ZWI0YmZjZTg1MjBjNWEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihkMTJmM2MxMDE5NzU0MzM2IDljYzNkMTJkZmYwMjhlMGMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigxNDI0Y2MxYzIyZjBjNzQ2IDAwNjJjNWQ2YWJjMmZjZDIpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwOWRjYmM4YjQzMjRjZDZiIDdjNGJiYTExODdiMjNjYmEpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihlNDYwMmMwYTgwMzkxZWU3IGVkYWYyZjQwMzlmNjQyNjcpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcigwNDM3MTQyOWY0YmYxNTlmIDUzYzBhNzJkN2JlMDdlZDYpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig2ZmU3MGY0MzI0YzBkNjNhIDIzNWFjZjJlZmY5ZDVlY2MpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcihmNGY2MDFhMGU1ZTU0OTBmIGFiMDM4NjFiZWIxNGRkYTMpKSkpKSgocHJlY2hhbGxlbmdlKChpbm5lcig5NjViNTg4YWJlZGE1M2VkIDA4ZjI3MTc2Yjg3ZjM3MWQpKSkpKSkpKSkpKSkocHJldl9ldmFscygoZXZhbHMoKHB1YmxpY19pbnB1dCgweDI2QTIwQURCMEI3MDczMDQwOTk1ODZENDMxNDRBMEQzMTZEMDk5OThGOEY5NDFDQTkzMDI3RUY5NkUzMEIxNjggMHgyRjFGN0RBNzNGN0ZBQzE0REREOTQ3N0UxODhERTExQjk3MUYxN0MyRUYxRkFGNDk0NTNGQjUyNTE2RUFGRkMzKSkoZXZhbHMoKHcoKCgweDA4NzU3MzdGMjg5RTY0MEIzNjIyMzJDOTAwM0E4ODdCMDVBOUY2Mzg0QTlDMzU3RjJEQkQ4RTdENDQwNEEyNTQpKDB4MkE2N0E0NjM5RDZDRThGMThERTZDOTkyRDA0MEIxMkFGRTVCRDkwNDNBQTg2MzMzOEEyNTI2NURCNUFBMzA1NykpKCgweDBCNDM0MTRFQTg3QkZEMDg5NzYyQTI5NzdDRjk4M0NGQkEzRjgxRDcwOUIwNjMzQzk0QzVBMUJCRjYwQzZEQTcpKDB4MjA2MzYwNzQxNDA4OTdCRjZGQzIzOEE0REIyODI2MjUxOUQ0NjI4NDdCQTIxN0IwN0Y0RDg0MDIyRTAwQkIzNSkpKCgweDJEOEQ5RTdFRkNBMTg0MkQyNjdERTEyMjBBNjVCMjY3QkUwOThBQTQyRTYyRDdBOTAwNkUxQ0QzMjYwMjEzNkEpKDB4MUFGODU5QUQxMTRFRUE4MDI2OURCRTMxOTA4QTEyREE1QjQ4NUJFQzE0RDQyQTZBQzNDMzM4OEM1NDdCRDM2NykpKCgweDAwQ0JBMkY3NjQ5NTREMTg0ODQ5MjQyMjJCRUFGQ0U3OUVENDczNDVBOUU0NjIzQkRGNUZDQjNGMkE3QkY1RTQpKDB4MDJDNDJEQURCOUE4NUE1RDlEMTEwQUQ5QjFDQ0IwNEU4Mjc4QTdBMTZDNjM1RjlFQzYxM0I5NThENjFBMDQ4MSkpKCgweDE5RjE5NTE4NDdGM0ZDNUQ0RDZERjVFRDdGOTNDNzEwRTVFRkZGQjA5MkJFNjI4Njg0RDVDMDQ4MThGRDE5MjMpKDB4MzdDMkU2RjM4OTJEOUY4QjJDQjJBRDFENjZBQjgzQkYwREVDQzdBM0ExQzQyRTc2OEMxOTQ4QjFDREJGNTVGNSkpKCgweDA2OTYyNkUxQzUxNjM0MjVGNzJERjUwNzM1N0I5NTMwRjJGQTVBMDExNDI3M0Q3NEE0MzYxODFCNzUyNzYwMTYpKDB4MDRBOTk3MUVGMjY1MjVDMDZFNUVDMDJCMzdDNkM0MDFCMDRCM0U5RDNFQUExNzJGMTNCODI3NTA3ODg2MDY5MikpKCgweDFEQzJCQjYzMzk3QTEzMjJGRkVDMDVGQTU1Q0FGQzA3MTQ1REY4MEMzOUY1NEIxNDdDMDg2RkIyNzg4RDBCQUQpKDB4MTYzMUZCMUM4REUxN0EzMjI1RjZDQkQ0RjFCRUU5NjkyMzk3QzNFOTlBN0E5MzQ1QkU2RTYxMzI2QjEyQjJDRSkpKCgweDE1OEJGMDQ3NDlCQUVGN0M4MEFGQjkzMUYwRTg5MjZGMEJEQzhBMDJFRDFFQzg4NERGOTJCNjQ3OTBFOTM3NkEpKDB4MUQzRjI5RDkwNENCRDk5RTFBNkJGNTdDMDQ3OEE5NTJFMDIwNThBM0UxODUxMDJENjFDM0YzRkJGN0EyMzlEMikpKCgweDM0N0Q2N0RDOUJGOTE5NEE5RURFRTYyMjgxOUZDMjA3OTg5MUYzNzNFRDVEOTRGNTlENTI2RDJBRDVBOUU4NkIpKDB4MkJBRUU5MDE0MkEyQjQyQ0JEMUYzQkIzMjE1MjIxN0VBNDQ3QjUwOTE3OUFDNjlBQUJCODFDRDU3RTkzMjEyNCkpKCg'... 25412 more characters,
  metadata: 'many',
  cache: '/mnt/efs/cache',
  chain: 'zeko',
  webhook: undefined
}

[12:44:41 AM] 2024-05-12T21:44:29.884Z	INFO	getWorker result: {
  repo: 'worker-example',
  size: 23045,
  version: '0.2.3',
  developer: 'DFST',
  countUsed: 13,
  timeUsed: 1715550257947,
  timeDeployed: 1715549296710,
  id: '6459034946',
  protected: false
}

[12:44:41 AM] 2024-05-12T21:44:29.884Z	INFO	Running worker { developer: 'DFST', repo: 'worker-example', version: '0.2.3' }

[12:44:41 AM] 2024-05-12T21:44:29.884Z	INFO	starting worker example version 0.2.3 on chain zeko

[12:44:41 AM] 2024-05-12T21:44:29.892Z	INFO	isMany: true

[12:44:41 AM] 2024-05-12T21:44:29.895Z	INFO	Address B62qoCcm6EEg57imjcpWEpyNq9AegFAUfgPjubA43Wr4zeGPiH1SfuE

[12:44:41 AM] 2024-05-12T21:44:29.896Z	INFO	Sending tx...

[12:44:41 AM] 2024-05-12T21:44:31.039Z	INFO	getDeployer: providing deployer B62qkZazA9uzC1Btdoun5uK5piU85o2WoVmdT9rNDYVYFcDF3JZhR9u with balance 281473

[12:44:41 AM] 2024-05-12T21:44:31.040Z	INFO	cloud deployer: EKFWifX3WTDZcYQbtWMppqgWrzYuZwNELsSBhoMMZPSZ7BQU8vg4

[12:44:41 AM] 2024-05-12T21:44:31.185Z	INFO	sender: B62qkZazA9uzC1Btdoun5uK5piU85o2WoVmdT9rNDYVYFcDF3JZhR9u

[12:44:41 AM] 2024-05-12T21:44:31.222Z	INFO	Sender balance: 281473.776710656

[12:44:41 AM] 2024-05-12T21:44:31.222Z	INFO	compiled: 0.01ms

[12:45:23 AM] 2024-05-12T21:45:07.401Z	INFO	prepared tx: 37.505s

[12:45:23 AM] 2024-05-12T21:45:08.336Z	INFO	many tx sent: hash: 5JuB8RFnv9vgrmSiESe1GtssbabHddmuwvT23k6A7W4prikVg8rE status: pending

[12:45:23 AM] 2024-05-12T21:45:08.336Z	INFO	Cloud: releaseDeployer {
  publicKey: 'B62qkZazA9uzC1Btdoun5uK5piU85o2WoVmdT9rNDYVYFcDF3JZhR9u',
  txsHashes: [ '5JuB8RFnv9vgrmSiESe1GtssbabHddmuwvT23k6A7W4prikVg8rE' ]
}

[12:45:23 AM] 2024-05-12T21:45:08.360Z	INFO	RSS memory finished: 1930 MB, changed by 684 MB

[12:45:23 AM] 2024-05-12T21:45:08.360Z	INFO	zkCloudWorker Execute Sync: 38.501s

[12:45:23 AM] 2024-05-12T21:45:08.386Z	INFO	zkCloudWorker Execute: 38.528s

[12:45:23 AM] REPORT RequestId: Duration: 38570.17 ms	Billed Duration: 38571 ms	Memory Size: 10240 MB	Max Memory Used: 2417 MB

[12:45:23 AM] Many result: 5JuB8RFnv9vgrmSiESe1GtssbabHddmuwvT23k6A7W4prikVg8rE
[12:45:23 AM] Many txs sent: 3:45.231 (m:ss.mmm)
[12:45:23 AM] RSS memory Many txs sent: 308 MB, changed by 1 MB
 PASS  tests/contract.test.ts
  Add Worker
    ✓ should prepare data (11 ms)
    ✓ should initialize blockchain (298 ms)
    ✓ should send one transactions (63783 ms)
    ✓ should send transactions with recursive proofs (225235 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        290.027 s, estimated 300 s
Ran all test suites.
```
