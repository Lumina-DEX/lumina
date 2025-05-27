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
import readline from "readline/promises"

import {
  AccountUpdate,
  Bool,
  Cache,
  fetchAccount,
  Field,
  MerkleMap,
  Mina,
  NetworkId,
  Poseidon,
  PrivateKey,
  Provable,
  PublicKey,
  Signature,
  SmartContract,
  UInt32,
  UInt64,
  UInt8
} from "o1js"

import {
  Faucet,
  FungibleToken,
  FungibleTokenAdmin,
  getAmountLiquidityOutUint,
  mulDiv,
  Pool,
  PoolFactory,
  PoolTokenHolder
} from "../index.js"
import { MultisigInfo, SignatureInfo, SignatureRight, UpdateSignerData } from "../pool/Multisig.js"

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

const feepayerKey = PrivateKey.fromBase58(process.env.FEE_PAYER!)
const zkPoolTokenAMinaKey = PrivateKey.fromBase58(process.env.POOL_TOKA_MINA!)
const zkPoolTokenATokenBKey = PrivateKey.fromBase58(process.env.POOL_TOKA_TOKB!)
const zkTokenAPrivateKey = PrivateKey.fromBase58(process.env.TOKA!)
const zkTokenBPrivateKey = PrivateKey.fromBase58(process.env.TOKB!)
const zkTokenAdminPrivateKey = PrivateKey.fromBase58(process.env.TOKEN_ADMIN!)
const zkFaucetKey = PrivateKey.fromBase58(process.env.FAUCET!)
const zkFactoryKey = PrivateKey.fromBase58(process.env.FACTORY!)
const zkEthKey = PrivateKey.fromBase58(process.env.POOL_ETH_MINA!)

// use it to deploy pool on testnet
// B62qpko6oWqKU4LwAaT7PSX3b6TYvroj6umbpyEXL5EEeBbiJTUMU5Z
const approvedSigner = PrivateKey.fromBase58("EKE9dyeMmvz6deCC2jD9rBk7d8bG6ZDqVno8wRe8tAbQDussfBYi")

// set up Mina instance and contract we interact with
const Network = Mina.Network({
  // We need to default to the testnet networkId if none is specified for this deploy alias in config.json
  // This is to ensure the backward compatibility.
  networkId: process.env.NETWORK_ID! as NetworkId,
  mina: process.env.GRAPHQL!,
  archive: process.env.ARCHIVE!
})
console.log("network", process.env.GRAPHQL)
// const Network = Mina.Network(config.url);
const fee = Number(process.env.FEE) * 1e9 // in nanomina (1 billion = 1.0 mina)
Mina.setActiveInstance(Network)
const feepayerAddress = feepayerKey.toPublicKey()
const zkPoolTokenAMinaAddress = zkPoolTokenAMinaKey.toPublicKey()
const zkPoolTokenAMina = new Pool(zkPoolTokenAMinaAddress)
const zkPoolTokenATokenBAddress = zkPoolTokenATokenBKey.toPublicKey()
const zkPoolTokenATokenB = new Pool(zkPoolTokenATokenBAddress)
const zkFactoryAddress = zkFactoryKey.toPublicKey()
const zkFactory = new PoolFactory(zkFactoryAddress)
const zkTokenAAddress = zkTokenAPrivateKey.toPublicKey()
const zkTokenA = new FungibleToken(zkTokenAAddress)
const zkTokenBAddress = zkTokenBPrivateKey.toPublicKey()
const zkTokenB = new FungibleToken(zkTokenBAddress)
const zkTokenAdminAddress = zkTokenAdminPrivateKey.toPublicKey()
const zkTokenAdmin = new FungibleTokenAdmin(zkTokenAdminAddress)
const zkFaucetAddress = zkFaucetKey.toPublicKey()
const zkFaucet = new Faucet(zkFaucetAddress, zkTokenA.deriveTokenId())
const zkEthAddress = zkEthKey.toPublicKey()
const zkPoolEthMina = new Pool(zkEthAddress)
const signerAddress = approvedSigner.toPublicKey()

console.log("token A", zkTokenAAddress.toBase58())
console.log("token B", zkTokenBAddress.toBase58())
console.log("pool token A/Mina", zkPoolTokenAMinaAddress.toBase58())
console.log("pool token A/token B", zkPoolTokenATokenBAddress.toBase58())
console.log("factory", zkFactoryKey.toBase58())
console.log("zkTokenAdmin", zkTokenAdminAddress.toBase58())
console.log("zkFaucet", zkFaucetAddress.toBase58())
console.log("pool ETH/Mina", zkEthAddress.toBase58())
console.log("approved signer", signerAddress.toBase58())

const allRight = new SignatureRight(Bool(true), Bool(true), Bool(true), Bool(true), Bool(true), Bool(true))
const deployRight = SignatureRight.canDeployPool()

const ownerKey = PrivateKey.fromBase58(process.env.OWNER!)
const signer1Key = PrivateKey.fromBase58(process.env.SIGNER1!)
const signer2Key = PrivateKey.fromBase58(process.env.SIGNER2!)
const signer3Key = PrivateKey.fromBase58(process.env.SIGNER3!)

const ownerPublic = ownerKey.toPublicKey()
const signer1Public = signer1Key.toPublicKey()
const signer2Public = signer2Key.toPublicKey()
const signer3Public = signer3Key.toPublicKey()
const externalSigner1 = PublicKey.fromBase58("B62qkjzL662Z5QD16cB9j6Q5TH74y42ALsMhAiyrwWvWwWV1ypfcV65")
const externalSigner2 = PublicKey.fromBase58("B62qpLxXFg4rmhce762uiJjNRnp5Bzc9PnCEAcraeaMkVWkPi7kgsWV")
const externalSigner3 = PublicKey.fromBase58("B62qipa4xp6pQKqAm5qoviGoHyKaurHvLZiWf3djDNgrzdERm6AowSQ")
const approvedSignerPublic = approvedSigner.toPublicKey()

const merkle = new MerkleMap()
merkle.set(Poseidon.hash(ownerPublic.toFields()), allRight.hash())
merkle.set(Poseidon.hash(signer1Public.toFields()), allRight.hash())
merkle.set(Poseidon.hash(signer2Public.toFields()), allRight.hash())
merkle.set(Poseidon.hash(signer3Public.toFields()), allRight.hash())
merkle.set(Poseidon.hash(approvedSignerPublic.toFields()), deployRight.hash())
merkle.set(Poseidon.hash(externalSigner1.toFields()), allRight.hash())
merkle.set(Poseidon.hash(externalSigner2.toFields()), allRight.hash())
merkle.set(Poseidon.hash(externalSigner3.toFields()), allRight.hash())

// compile the contract to create prover keys
console.log("compile the contract...")

const cache: Cache = Cache.FileSystem("./cache")
const keyPoolLatest = await Pool.compile({ cache })
await FungibleToken.compile({ cache })
await FungibleTokenAdmin.compile({ cache })
const keyPoolHolderLatest = await PoolTokenHolder.compile({ cache })
const factoryKey = await PoolFactory.compile({ cache })
await Faucet.compile({ cache })

async function ask() {
  try {
    const result = await prompt(`Why do you want to do ?
            1 deploy token A
            2 deploy pool token A/Mina     
            3 deploy factory
            4 add liquidity 
            5 swap mina for token
            6 swap token for mina
            7 upgrade
            8 deploy pool eth
            9 mint token
            10 show event
            11 deploy faucet
            12 deploy token B
            13 deploy pool token A/token B (Only on zeko)
            14 mint token B
            15 update signer
            16 create token account
            17 supply second liquidity
            `)
    switch (result) {
      case "1":
        await deployTokenA()
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
        await mintTokenA()
        break
      case "10":
        await getEvent()
        break
      case "11":
        await deployFaucet()
        break
      case "12":
        await deployTokenB()
        break
      case "13":
        await deployPoolToken()
        break
      case "14":
        await mintTokenB()
        break
      case "15":
        await updateSigner()
        break
      case "16":
        await createTokenAccount()
        break
      case "17":
        await addSecondLiquidity()
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

async function deployTokenA() {
  try {
    console.log("deploy token A")

    const tx = await Mina.transaction(
      { sender: feepayerAddress, fee },
      async () => {
        AccountUpdate.fundNewAccount(feepayerAddress, 3)
        await zkTokenAdmin.deploy({
          adminPublicKey: feepayerAddress
        })
        await zkTokenA.deploy({
          symbol: "TokenA",
          src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
          allowUpdates: true
        })
        await zkTokenA.initialize(
          zkTokenAdminAddress,
          UInt8.from(9),
          Bool(false)
        )
      }
    )
    await tx.prove()
    const sentTx = await tx.sign([feepayerKey, zkTokenAPrivateKey, zkTokenAdminPrivateKey]).send()
    if (sentTx.status === "pending") {
      console.log("hash", sentTx.hash)
    }
  } catch (err) {
    console.log(err)
  }
}

async function deployTokenB() {
  try {
    console.log("deploy token B")

    const tx = await Mina.transaction(
      { sender: feepayerAddress, fee },
      async () => {
        AccountUpdate.fundNewAccount(feepayerAddress, 2)
        await zkTokenB.deploy({
          symbol: "TokenB",
          src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
          allowUpdates: true
        })
        await zkTokenB.initialize(
          zkTokenAdminAddress,
          UInt8.from(9),
          Bool(false)
        )
      }
    )
    await tx.prove()
    const sentTx = await tx.sign([feepayerKey, zkTokenBPrivateKey, zkTokenAdminPrivateKey]).send()
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
    const signature = Signature.create(approvedSigner, zkPoolTokenAMinaAddress.toFields())
    const witness = merkle.getWitness(Poseidon.hash(approvedSignerPublic.toFields()))
    const tx = await Mina.transaction(
      { sender: feepayerAddress, fee },
      async () => {
        AccountUpdate.fundNewAccount(feepayerAddress, 4)
        await zkFactory.createPool(
          zkPoolTokenAMinaAddress,
          zkTokenAAddress,
          approvedSignerPublic,
          signature,
          witness,
          deployRight
        )
      }
    )
    await tx.prove()
    const sentTx = await tx.sign([feepayerKey, zkPoolTokenAMinaKey]).send()
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

    const { genesisTimestamp, slotTime } = Mina.activeInstance.getNetworkConstants()

    const protocolKey = PrivateKey.fromBase58(process.env.PROTOCOL!)
    const delegatorKey = PrivateKey.fromBase58(process.env.DELEGATOR!)

    const root = merkle.getRoot()

    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()

    // const time = today.getTime();
    const timeSlot = getSlotFromTimestamp(tomorrow)
    const info = new UpdateSignerData({ oldRoot: Field.empty(), newRoot: root, deadlineSlot: UInt32.from(timeSlot) })

    const signBob = Signature.create(signer1Key, info.toFields())
    const signAlice = Signature.create(signer2Key, info.toFields())
    const signDylan = Signature.create(signer3Key, info.toFields())

    const multi = new MultisigInfo({
      approvedUpgrader: root,
      messageHash: info.hash(),
      deadlineSlot: UInt32.from(timeSlot)
    })
    const infoBob = new SignatureInfo({
      user: signer1Public,
      witness: merkle.getWitness(Poseidon.hash(signer1Public.toFields())),
      signature: signBob,
      right: allRight
    })
    const infoAlice = new SignatureInfo({
      user: signer2Public,
      witness: merkle.getWitness(Poseidon.hash(signer2Public.toFields())),
      signature: signAlice,
      right: allRight
    })
    const infoDylan = new SignatureInfo({
      user: signer3Public,
      witness: merkle.getWitness(Poseidon.hash(signer3Public.toFields())),
      signature: signDylan,
      right: allRight
    })
    const array = [infoBob, infoAlice, infoDylan]

    const tx = await Mina.transaction(
      { sender: feepayerAddress, fee },
      async () => {
        AccountUpdate.fundNewAccount(feepayerAddress, 1)
        await zkFactory.deploy({
          symbol: "FAC",
          src: "https://luminadex.com/",
          delegator: delegatorKey.toPublicKey(),
          protocol: protocolKey.toPublicKey(),
          approvedSigner: root,
          signatures: array,
          multisigInfo: multi
        })
      }
    )

    console.log("tx", tx.toPretty())
    await tx.prove()
    const sentTx = await tx.sign([feepayerKey, zkFactoryKey]).send()
    if (sentTx.status === "pending") {
      console.log("hash", sentTx.hash)
    }
  } catch (err) {
    console.log(err)
  }
}

function getSlotFromTimestamp(date: number) {
  const { genesisTimestamp, slotTime } = Mina.activeInstance.getNetworkConstants()
  let slotCalculated = UInt64.from(date)
  slotCalculated = (slotCalculated.sub(genesisTimestamp)).div(slotTime)
  Provable.log("slotCalculated64", slotCalculated)
  return slotCalculated.toUInt32()
}

async function deployPoolEth() {
  try {
    const wethAddress = PublicKey.fromBase58("B62qisgt5S7LwrBKEc8wvWNjW7SGTQjMZJTDL2N6FmZSVGrWiNkV21H")
    console.log("deploy pool eth")
    const signature = Signature.create(approvedSigner, zkEthAddress.toFields())
    const witness = merkle.getWitness(Poseidon.hash(signerAddress.toFields()))
    const tx = await Mina.transaction(
      { sender: feepayerAddress, fee },
      async () => {
        AccountUpdate.fundNewAccount(feepayerAddress, 4)
        await zkFactory.createPool(
          zkEthAddress,
          wethAddress,
          approvedSigner.toPublicKey(),
          signature,
          witness,
          allRight
        )
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

async function deployPoolToken() {
  try {
    console.log("deploy pool token A/token B")
    const signature = Signature.create(approvedSigner, zkPoolTokenATokenBAddress.toFields())
    const witness = merkle.getWitness(Poseidon.hash(signerAddress.toFields()))
    const tx = await Mina.transaction(
      { sender: feepayerAddress, fee },
      async () => {
        AccountUpdate.fundNewAccount(feepayerAddress, 5)
        await zkFactory.createPoolToken(
          zkPoolTokenATokenBAddress,
          zkTokenAAddress,
          zkTokenBAddress,
          approvedSigner.toPublicKey(),
          signature,
          witness,
          allRight
        )
      }
    )
    await tx.prove()
    const sentTx = await tx.sign([feepayerKey, zkPoolTokenATokenBKey]).send()
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
          token: zkTokenAAddress,
          amount: UInt64.from(100 * 10 ** 9)
        })
        await zkTokenA.approveAccountUpdate(zkFaucet.self)

        // 1'000'000 tokens in the faucet
        await zkTokenA.mint(
          zkFaucetAddress,
          UInt64.from(1000000 * 10 ** 9)
        )
      }
    )
    await tx.prove()
    const sentTx = await tx.sign([feepayerKey, zkTokenAPrivateKey, zkFaucetKey]).send()
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
    await fetchAccount({ publicKey: zkPoolTokenAMinaAddress })
    await fetchAccount({ publicKey: zkPoolTokenAMinaAddress, tokenId: zkTokenA.deriveTokenId() })
    await fetchAccount({ publicKey: feepayerAddress })
    await fetchAccount({ publicKey: feepayerAddress, tokenId: zkTokenA.deriveTokenId() })
    await fetchAccount({ publicKey: feepayerAddress, tokenId: zkPoolTokenAMina.deriveTokenId() })

    const token = await zkPoolTokenAMina.token1.fetch()
    const tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
      AccountUpdate.fundNewAccount(feepayerAddress, 1)
      await zkPoolTokenAMina.supplyFirstLiquidities(amtMina, amt)
    })
    console.log("tx liquidity", tx.toPretty())
    await tx.prove()
    const sentTx = await tx.sign([feepayerKey, zkTokenAPrivateKey]).send()
    if (sentTx.status === "pending") {
      console.log("hash", sentTx.hash)
    }
  } catch (err) {
    console.log(err)
  }
}

async function addSecondLiquidity() {
  try {
    console.log("add liquidity")
    const amtMina = UInt64.from(20 * 10 ** 9)
    const reserve = await getReserves(zkPoolTokenAMinaAddress)
    const out = getAmountLiquidityOutUint(
      amtMina,
      reserve.amountMina,
      reserve.amountToken,
      reserve.liquidity,
      UInt64.one
    )
    const tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
      AccountUpdate.fundNewAccount(feepayerAddress, 1)
      await zkPoolTokenAMina.supplyLiquidity(
        out.amountAIn,
        out.amountBIn,
        out.balanceAMax,
        out.balanceBMax,
        out.supplyMin
      )
    })
    console.log("tx liquidity", tx.toPretty())
    await tx.prove()
    const sentTx = await tx.sign([feepayerKey, zkTokenAPrivateKey]).send()
    if (sentTx.status === "pending") {
      console.log("hash", sentTx.hash)
    }
  } catch (err) {
    console.log(err)
  }
}

async function getReserves(poolAddress: PublicKey) {
  const acc = await fetchAccount({ publicKey: poolAddress })
  const zkPool = new Pool(poolAddress)
  const token = await zkPool.token1.fetch()
  const zkToken = new FungibleToken(token!)
  const accToken = await fetchAccount({ publicKey: poolAddress, tokenId: zkToken.deriveTokenId() })
  const accLiquidity = await fetchAccount({ publicKey: poolAddress, tokenId: zkPool.deriveTokenId() })
  const amountToken = await accToken.account!.balance
  const amountMina = await acc.account!.balance
  const liquidity = await accLiquidity.account!.balance
  return { amountToken, amountMina, liquidity }
}

async function swapMina() {
  try {
    console.log("swap Mina")

    await fetchAccount({ publicKey: zkPoolTokenAMinaAddress })
    await fetchAccount({ publicKey: zkPoolTokenAMinaAddress, tokenId: zkTokenA.deriveTokenId() })
    await fetchAccount({ publicKey: feepayerAddress })
    await fetchAccount({ publicKey: feepayerAddress, tokenId: zkTokenA.deriveTokenId() })

    const amountIn = UInt64.from(1.3 * 10 ** 9)
    const dexTokenHolder = new PoolTokenHolder(zkPoolTokenAMinaAddress, zkTokenA.deriveTokenId())

    const reserveIn = Mina.getBalance(zkPoolTokenAMinaAddress)
    const reserveOut = Mina.getBalance(zkPoolTokenAMinaAddress, zkTokenA.deriveTokenId())

    const balanceMin = reserveOut.sub(reserveOut.div(100))
    const balanceMax = reserveIn.add(reserveIn.div(100))

    const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn))
    const minOut = expectedOut.sub(expectedOut.div(100))

    const tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
      // AccountUpdate.fundNewAccount(feepayerAddress, 1);
      await dexTokenHolder.swapFromMinaToToken(
        feepayerAddress,
        UInt64.from(5),
        amountIn,
        minOut,
        balanceMax,
        balanceMin
      )
      await zkTokenA.approveAccountUpdate(dexTokenHolder.self)
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

async function createTokenAccount() {
  try {
    console.log("create token account")
    await fetchAccount({ publicKey: zkFactoryAddress })
    const protocol = await zkFactory.getProtocol()
    const feeCollector = feepayerAddress

    await fetchAccount({ publicKey: feeCollector })
    await fetchAccount({ publicKey: protocol })
    const accFee = await fetchAccount({ publicKey: feeCollector, tokenId: zkTokenA.deriveTokenId() })
    const accProtocol = await fetchAccount({ publicKey: protocol, tokenId: zkTokenA.deriveTokenId() })

    let fees = 0
    if (!accFee?.account) {
      fees += 1
    }
    if (!accProtocol?.account) {
      fees += 1
    }
    const tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
      AccountUpdate.fundNewAccount(feepayerAddress, fees)
      const updateProtocol = AccountUpdate.create(protocol, zkTokenA.deriveTokenId())
      await zkTokenA.approveAccountUpdate(updateProtocol)
      const updateFee = AccountUpdate.create(feeCollector, zkTokenA.deriveTokenId())
      await zkTokenA.approveAccountUpdate(updateFee)
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

async function swapToken() {
  try {
    console.log("swap Token")
    const amountIn = UInt64.from(20 * 10 ** 9)

    await fetchAccount({ publicKey: zkPoolTokenAMinaAddress })
    await fetchAccount({ publicKey: zkPoolTokenAMinaAddress, tokenId: zkTokenA.deriveTokenId() })
    await fetchAccount({ publicKey: feepayerAddress })
    await fetchAccount({ publicKey: feepayerAddress, tokenId: zkTokenA.deriveTokenId() })

    const reserveOut = Mina.getBalance(zkPoolTokenAMinaAddress)
    const reserveIn = Mina.getBalance(zkPoolTokenAMinaAddress, zkTokenA.deriveTokenId())

    const balanceMin = reserveOut.sub(reserveOut.div(100))
    const balanceMax = reserveIn.add(reserveIn.div(100))

    const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn))
    const minOut = expectedOut.sub(expectedOut.div(100))

    const tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
      await zkPoolTokenAMina.swapFromTokenToMina(
        feepayerAddress,
        UInt64.from(5),
        amountIn,
        minOut,
        balanceMax,
        balanceMin
      )
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
    await fetchAccount({ publicKey: zkFactoryAddress })
    // const ownerKey = PrivateKey.fromBase58(process.env.OWNER!);
    const tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
      const update = AccountUpdate.createSigned(zkFactoryAddress)
      update.account.verificationKey.set(factoryKey.verificationKey)
    })
    console.log("upgrade  proof", tx.toPretty())
    await tx.prove()
    const sentTx = await tx.sign([feepayerKey, zkFactoryKey]).send()
    if (sentTx.status === "pending") {
      console.log("hash", sentTx.hash)
    }
  } catch (err) {
    console.log(err)
  }
}

async function mintTokenA() {
  try {
    console.log("mintToken A")
    const tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
      AccountUpdate.fundNewAccount(feepayerAddress, 1)
      await zkTokenA.mint(feepayerAddress, UInt64.from(100_000 * 10 ** 9))
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

async function mintTokenB() {
  try {
    console.log("mintToken B")
    const tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
      AccountUpdate.fundNewAccount(feepayerAddress, 1)
      await zkTokenB.mint(feepayerAddress, UInt64.from(100_000 * 10 ** 9))
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

async function updateSigner() {
  try {
    console.log("update signer")
    // const ownerKey = PrivateKey.fromBase58(process.env.OWNER!);
    // let tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
    //     await zkFactory.updateApprovedSigner(root);
    // });
    // await tx.prove();
    // let sentTx = await tx.sign([feepayerKey, ownerKey]).send();
    // if (sentTx.status === 'pending') {
    //     console.log("hash", sentTx.hash);
    // }
  } catch (err) {
    console.log(err)
  }
}

async function getEvent() {
  try {
    console.log("show event")
    await displayEvents(zkPoolTokenAMina)
    const dexTokenHolder = new PoolTokenHolder(zkPoolTokenAMinaAddress, zkTokenA.deriveTokenId())
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
