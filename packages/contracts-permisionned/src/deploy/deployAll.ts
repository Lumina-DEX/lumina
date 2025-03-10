/**
 * This script can be used to interact with the Add contract, after deploying it.
 *
 * We call the update() method on the contract, create a proof and send it to the chain.
 * The endpoint that we interact with is read from your config.json.
 *
 * This simulates a user interacting with the zkApp from a browser, except that here, sending the transaction happens
 * from the script and we're using your pre-funded zkApp account to pay the transaction fee. In a real web app, the user's wallet
 * would send the transaction and pay the fee.
 *
 * To run locally:
 * Build the project: `$ npm run build`
 * Run with node:     `$ node build/src/deploy.js`.
 */
import fs from "fs/promises"
import readline from "readline/promises"

import {
  AccountUpdate,
  Bool,
  Cache,
  fetchAccount,
  MerkleTree,
  Mina,
  NetworkId,
  Poseidon,
  PrivateKey,
  PublicKey,
  Signature,
  SmartContract,
  UInt64,
  UInt8
} from "o1js"

import {
  Faucet,
  FungibleToken,
  FungibleTokenAdmin,
  mulDiv,
  Pool,
  PoolFactory,
  PoolTokenHolder,
  SignerMerkleWitness
} from "../index.js"

const prompt = async (message: string) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const answer = await rl.question(message)

  rl.close() // stop listening
  return answer
}

// check command line arg
const deployAlias = "poolmina"
if (!deployAlias) {
  throw Error(`Missing <deployAlias> argument.

Usage:
node build/src/deploy/deployAll.js
`)
}
Error.stackTraceLimit = 1000
const DEFAULT_NETWORK_ID = "zeko"

// parse config and private key from file
type Config = {
  deployAliases: Record<
    string,
    {
      networkId?: string
      url: string
      keyPath: string
      fee: string
      feepayerKeyPath: string
      feepayerAlias: string
    }
  >
}
const configJson: Config = JSON.parse(await fs.readFile("config.json", "utf8"))
const config = configJson.deployAliases[deployAlias]
const feepayerKeysBase58: { privateKey: string; publicKey: string } = JSON.parse(
  await fs.readFile(config.feepayerKeyPath, "utf8")
)

const feepayerKey = PrivateKey.fromBase58(feepayerKeysBase58.privateKey)
// B62qjGnANmDdJoBhWCQpbN2v3V4CBb5u1VJSCqCVZbpS5uDs7aZ7TCH
const zkPoolMinaTokaKey = PrivateKey.fromBase58("EKEKswWJXqG6mu1LFrBJMYqzJcYN2t74Gtsf2LZLmFVuUSXei3ia")
// B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w
const zkTokenPrivateKey = PrivateKey.fromBase58("EKDpsCUu1roVtrqoprUyseGZVKbPLZMvGagBoN7WRUVHzDWBUWFj")
// B62qq7cGn7rx6wwbjMP2Q2c8nm3nuwH3JPAuezzihZjNLhV66KCK9Ct
const zkTokenBPrivateKey = PrivateKey.fromBase58("EKEk3mQKdVvp42q5ixsLHgFcWanXNFmtGd6qcWyjo4mxLCz5YQa4")
// B62qmZpuEkuf3MeH2WAkxzXRJMBMmZHb1JxSZqqQR8T3jtt2FUTy9wK
const zkTokenAdminPrivateKey = PrivateKey.fromBase58("EKDym4pZnbRVmWtubWaBgEeQ5GHrhtQc1KyD6sJm5cFaDWcj3vai")
// B62qnigaSA2ZdhmGuKfQikjYKxb6V71mLq3H8RZzvkH4htHBEtMRUAG
const zkFaucetKey = PrivateKey.fromBase58("EKDrpqX83AMJPT4X2dpPhAESbtrL96YV85gGCjECiK523LnBNqka")
// B62qnHMCGiqjFzC25yuKBjxC5yXFqfozsfgrjR22Gk2BdjJrmQqNVqi
const zkFactoryKey = PrivateKey.fromBase58("EKFVE8YrmtuPjW5ytFXgq6ZNkHP2X6uySiLbW62f5Y47Sx74qcCs")
// B62qjfc5MNxGoa66fvaxcJemSFbY4mEb7HgcP6Chji7RmDe9gqKp65z
const zkEthKey = PrivateKey.fromBase58("EKEzhixmJMjja6G7zM5YvmTNPeDgDcY2bQ3Q71NA9Xig2Jti86VV")
// B62qmKVQ5hYj8E571wNktPC5JxvB3rogW7TKgJF5b7CmpbqHWXcMPZx
const zkPoolTokaTokbKey = PrivateKey.fromBase58("EKFMFjZiEvxEyUwY1v5sG75d72BbwHneMUSdnHmTmMYi967NgpwJ")
// weth address B62qqKNnNRpCtgcBexw5khZSpk9K2d9Z7Wzcyir3WZcVd15Bz8eShVi
// B62qqnBMstaKkscExmohrxHaRZgbGZdN5nw6MvbdpikSkUrQCgwiwvK
const signerKey = PrivateKey.fromBase58("EKFAo5kssADMSFXSCjYRHKABVRzCAfgnyHTRZsMCHkQD7EPLhvAt")

// set up Mina instance and contract we interact with
const Network = Mina.Network({
  // We need to default to the testnet networkId if none is specified for this deploy alias in config.json
  // This is to ensure the backward compatibility.
  networkId: (config.networkId ?? DEFAULT_NETWORK_ID) as NetworkId,
  //
  // mina: "https://devnet.zeko.io/graphql",
  mina: "https://api.minascan.io/node/devnet/v1/graphql",
  archive: "https://api.minascan.io/archive/devnet/v1/graphql"
})
console.log("network", config.url)
// const Network = Mina.Network(config.url);
const fee = Number(config.fee) * 1e9 // in nanomina (1 billion = 1.0 mina)
Mina.setActiveInstance(Network)
const feepayerAddress = feepayerKey.toPublicKey()
const zkPoolTokaAddress = zkPoolMinaTokaKey.toPublicKey()
const zkFactoryAddress = zkFactoryKey.toPublicKey()
const zkFactory = new PoolFactory(zkFactoryAddress)
const zkPool = new Pool(zkPoolTokaAddress)
const zkTokenAddress = zkTokenPrivateKey.toPublicKey()
const zkToken = new FungibleToken(zkTokenAddress)
const zkTokenAdminAddress = zkTokenAdminPrivateKey.toPublicKey()
const zkTokenAdmin = new FungibleTokenAdmin(zkTokenAdminAddress)
const zkFaucetAddress = zkFaucetKey.toPublicKey()
const zkFaucet = new Faucet(zkFaucetAddress, zkToken.deriveTokenId())
const zkEthAddress = zkEthKey.toPublicKey()
const zkEth = new Pool(zkEthAddress)

console.log("tokenStandard", zkTokenAddress.toBase58())
console.log("pool", zkPoolTokaAddress.toBase58())
console.log("factory", zkFactoryKey.toBase58())
console.log("zkTokenAdmin", zkTokenAdminAddress.toBase58())
console.log("zkFaucet", zkFaucetAddress.toBase58())
console.log("zkEth", zkEthAddress.toBase58())

const merkle = new MerkleTree(32)
merkle.setLeaf(0n, Poseidon.hash(feepayerAddress.toFields()))
merkle.setLeaf(1n, Poseidon.hash(signerKey.toPublicKey().toFields()))
const root = merkle.getRoot()

// compile the contract to create prover keys
console.log("compile the contract...")

const cache: Cache = Cache.FileSystem("./cache")
const key = await Pool.compile({ cache })
await FungibleToken.compile({ cache })
await FungibleTokenAdmin.compile({ cache })
await PoolTokenHolder.compile({ cache })
await PoolFactory.compile({ cache })
await Faucet.compile({ cache })
// const keyV2 = await PoolMinaV2.compile({ cache });

async function ask() {
  try {
    const result = await prompt(`Why do you want to do ?
            1 deploy token
            2 deploy pool      
            3 deploy factory
            4 add liquidity 
            5 swap mina for token
            6 swap token for mina
            7 upgrade
            8 deploy pool eth
            9 mint token
            10 show event
            11 deploy faucet
            12 deploy pool token
            `)
    switch (result) {
      case "1":
        await deployToken()
        break
      case "2":
        await deployPool()
        break
      case "3":
        await deployFactory()
        break
      case "4":
        await addLiquidity()
        break
      case "5":
        await swapMina()
        break
      case "6":
        await swapToken()
        break
      case "7":
        await upgrade()
        break
      case "8":
        await deployPoolEth()
        break
      case "9":
        await mintToken()
        break
      case "10":
        await getEvent()
        break
      case "11":
        await deployFaucet()
        break
      case "12":
        await deployPoolToken()
        break
      default:
        await ask()
        break
    }
  } catch (error) {
    await ask()
  } finally {
    await ask()
  }
}

await ask()

async function deployToken() {
  try {
    console.log("deploy token standard")

    const tx = await Mina.transaction(
      { sender: feepayerAddress, fee },
      async () => {
        AccountUpdate.fundNewAccount(feepayerAddress, 4)
        await zkTokenAdmin.deploy({
          adminPublicKey: feepayerAddress
        })
        await zkToken.deploy({
          symbol: "LTA",
          src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
          allowUpdates: true
        })
        await zkToken.initialize(
          zkTokenAdminAddress,
          UInt8.from(9),
          Bool(false)
        )
      }
    )
    await tx.prove()
    const sentTx = await tx.sign([feepayerKey, zkTokenPrivateKey]).send()
    if (sentTx.status === "pending") {
      console.log("hash", sentTx.hash)
    }
  } catch (err) {
    console.log(err)
  }
}

async function deployPool() {
  try {
    console.log("deploy pool")
    const signature = Signature.create(zkTokenPrivateKey, zkPoolTokaAddress.toFields())
    const witness = merkle.getWitness(0n)
    const circuitWitness = new SignerMerkleWitness(witness)
    const tx = await Mina.transaction(
      { sender: feepayerAddress, fee },
      async () => {
        AccountUpdate.fundNewAccount(feepayerAddress, 4)
        await zkFactory.createPool(zkPoolTokaAddress, zkTokenAddress, zkTokenAddress, signature, circuitWitness)
      }
    )
    await tx.prove()
    const sentTx = await tx.sign([feepayerKey, zkPoolMinaTokaKey]).send()
    if (sentTx.status === "pending") {
      console.log("hash", sentTx.hash)
    }
  } catch (err) {
    console.log(err)
  }
}

async function deployPoolToken() {
  try {
    console.log("deploy pool token")
    const poolAddress = zkPoolTokaTokbKey.toPublicKey()
    const signature = Signature.create(zkTokenPrivateKey, poolAddress.toFields())
    const witness = merkle.getWitness(0n)
    const circuitWitness = new SignerMerkleWitness(witness)
    const tx = await Mina.transaction(
      { sender: feepayerAddress, fee },
      async () => {
        AccountUpdate.fundNewAccount(feepayerAddress, 5)
        await zkFactory.createPoolToken(
          poolAddress,
          zkTokenAddress,
          zkTokenBPrivateKey.toPublicKey(),
          zkTokenAddress,
          signature,
          circuitWitness
        )
      }
    )
    await tx.prove()
    const sentTx = await tx.sign([feepayerKey, zkPoolTokaTokbKey]).send()
    if (sentTx.status === "pending") {
      console.log("hash", sentTx.hash)
    }
  } catch (err) {
    console.log(err)
  }
}

async function deployFactory() {
  try {
    console.log("deploy factory")
    const tx = await Mina.transaction(
      { sender: feepayerAddress, fee },
      async () => {
        AccountUpdate.fundNewAccount(feepayerAddress, 1)
        await zkFactory.deploy({
          symbol: "FAC",
          src: "https://luminadex.com/",
          delegator: feepayerAddress,
          owner: feepayerAddress,
          protocol: feepayerAddress,
          approvedSigner: root
        })
      }
    )
    await tx.prove()
    const sentTx = await tx.sign([feepayerKey, zkFactoryKey]).send()
    if (sentTx.status === "pending") {
      console.log("hash", sentTx.hash)
    }
  } catch (err) {
    console.log(err)
  }
}

async function deployPoolEth() {
  try {
    const wethAddress = PublicKey.fromBase58("B62qisgt5S7LwrBKEc8wvWNjW7SGTQjMZJTDL2N6FmZSVGrWiNkV21H")
    console.log("deploy pool eth")
    const signature = Signature.create(zkPoolMinaTokaKey, zkEthAddress.toFields())
    const witness = merkle.getWitness(0n)
    const circuitWitness = new SignerMerkleWitness(witness)
    const tx = await Mina.transaction(
      { sender: feepayerAddress, fee },
      async () => {
        AccountUpdate.fundNewAccount(feepayerAddress, 4)
        await zkFactory.createPool(zkEthAddress, wethAddress, zkEthAddress, signature, circuitWitness)
      }
    )
    await tx.prove()
    const sentTx = await tx.sign([feepayerKey, zkEthKey]).send()
    if (sentTx.status === "pending") {
      console.log("hash", sentTx.hash)
    }
  } catch (err) {
    console.log(err)
  }
}

async function deployFaucet() {
  try {
    console.log("deploy faucet")

    const tx = await Mina.transaction(
      { sender: feepayerAddress, fee },
      async () => {
        AccountUpdate.fundNewAccount(feepayerAddress, 1)
        // 100 token by claim
        await zkFaucet.deploy({
          token: zkTokenAddress,
          amount: UInt64.from(100 * 10 ** 9)
        })
        await zkToken.approveAccountUpdate(zkFaucet.self)

        // 1'000'000 tokens in the faucet
        await zkToken.mint(
          zkFaucetAddress,
          UInt64.from(1000000 * 10 ** 9)
        )
      }
    )
    await tx.prove()
    const sentTx = await tx.sign([feepayerKey, zkTokenPrivateKey, zkFaucetKey]).send()
    if (sentTx.status === "pending") {
      console.log("hash", sentTx.hash)
    }
  } catch (err) {
    console.log(err)
  }
}

async function addLiquidity() {
  try {
    console.log("add liquidity")
    const amt = UInt64.from(5000 * 10 ** 9)
    const amtMina = UInt64.from(20 * 10 ** 9)
    const token = await zkPool.token1.fetch()
    const tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
      AccountUpdate.fundNewAccount(feepayerAddress, 2)
      await zkPool.supplyFirstLiquidities(amtMina, amt)
    })
    console.log("tx liquidity", tx.toPretty())
    await tx.prove()
    const sentTx = await tx.sign([feepayerKey, zkTokenPrivateKey]).send()
    if (sentTx.status === "pending") {
      console.log("hash", sentTx.hash)
    }
  } catch (err) {
    console.log(err)
  }
}

async function swapMina() {
  try {
    console.log("swap Mina")

    await fetchAccount({ publicKey: zkPoolTokaAddress })
    await fetchAccount({ publicKey: zkPoolTokaAddress, tokenId: zkToken.deriveTokenId() })
    await fetchAccount({ publicKey: feepayerAddress })
    await fetchAccount({ publicKey: feepayerAddress, tokenId: zkToken.deriveTokenId() })

    const amountIn = UInt64.from(1.3 * 10 ** 9)
    const dexTokenHolder = new PoolTokenHolder(zkPoolTokaAddress, zkToken.deriveTokenId())

    const reserveIn = Mina.getBalance(zkPoolTokaAddress)
    const reserveOut = Mina.getBalance(zkPoolTokaAddress, zkToken.deriveTokenId())

    const balanceMin = reserveOut.sub(reserveOut.div(100))
    const balanceMax = reserveIn.add(reserveIn.div(100))

    const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn))

    const tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
      await dexTokenHolder.swapFromMinaToToken(
        feepayerAddress,
        UInt64.from(5),
        amountIn,
        expectedOut,
        balanceMax,
        balanceMin
      )
      await zkToken.approveAccountUpdate(dexTokenHolder.self)
    })
    await tx.prove()
    const sentTx = await tx.sign([feepayerKey]).send()
    if (sentTx.status === "pending") {
      console.log("hash", sentTx.hash)
    }
  } catch (err) {
    console.log(err)
  }
}

async function swapToken() {
  try {
    console.log("swap Token")
    const amountIn = UInt64.from(20 * 10 ** 9)

    await fetchAccount({ publicKey: zkPoolTokaAddress })
    await fetchAccount({ publicKey: zkPoolTokaAddress, tokenId: zkToken.deriveTokenId() })
    await fetchAccount({ publicKey: feepayerAddress })
    await fetchAccount({ publicKey: feepayerAddress, tokenId: zkToken.deriveTokenId() })

    const reserveOut = Mina.getBalance(zkPoolTokaAddress)
    const reserveIn = Mina.getBalance(zkPoolTokaAddress, zkToken.deriveTokenId())

    const balanceMin = reserveOut.sub(reserveOut.div(100))
    const balanceMax = reserveIn.add(reserveIn.div(100))

    const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn))

    const tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
      await zkPool.swapFromTokenToMina(feepayerAddress, UInt64.from(5), amountIn, expectedOut, balanceMax, balanceMin)
    })
    await tx.prove()
    console.log("swap token proof", tx.toPretty())
    const sentTx = await tx.sign([feepayerKey]).send()
    if (sentTx.status === "pending") {
      console.log("hash", sentTx.hash)
    }
  } catch (err) {
    console.log(err)
  }
}

async function upgrade() {
  try {
    console.log("upgrade")
    const tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
      //  await zkApp.updateVerificationKey(keyV2.verificationKey);
    })
    await tx.prove()
    const sentTx = await tx.sign([feepayerKey, zkPoolMinaTokaKey]).send()
    if (sentTx.status === "pending") {
      console.log("hash", sentTx.hash)
    }
  } catch (err) {
    console.log(err)
  }
}

async function mintToken() {
  try {
    console.log("mintToken")
    const tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
      AccountUpdate.fundNewAccount(feepayerAddress, 1)
      await zkToken.mint(feepayerAddress, UInt64.from(100_000 * 10 ** 9))
    })
    await tx.prove()
    const sentTx = await tx.sign([feepayerKey]).send()
    if (sentTx.status === "pending") {
      console.log("hash", sentTx.hash)
    }
  } catch (err) {
    console.log(err)
  }
}

async function getEvent() {
  try {
    console.log("show event")
    await displayEvents(zkPool)
    const dexTokenHolder = new PoolTokenHolder(zkPoolTokaAddress, zkToken.deriveTokenId())
    await displayEvents(dexTokenHolder)
  } catch (err) {
    console.log(err)
  }
}

async function displayEvents(contract: SmartContract) {
  const events = await contract.fetchEvents()
  console.log(
    `events on ${contract.address.toBase58()} ${contract.tokenId}`,
    events.map((e) => {
      return { type: e.type, data: JSON.stringify(e.event) }
    })
  )
}

function sleep() {
  return new Promise(resolve => setTimeout(resolve, 20000))
}

function getTxnUrl(graphQlUrl: string, txnHash: string | undefined) {
  const hostName = new URL(graphQlUrl).hostname
  const txnBroadcastServiceName = hostName
    .split(".")
    .filter((item) => item === "minascan")?.[0]
  const networkName = graphQlUrl
    .split("/")
    .filter((item) => item === "mainnet" || item === "devnet")?.[0]
  if (txnBroadcastServiceName && networkName) {
    return `https://minascan.io/${networkName}/tx/${txnHash}?type=zk-tx`
  }
  return `Transaction hash: ${txnHash}`
}
