import {
  AccountUpdate,
  Bool,
  Cache,
  Field,
  MerkleTree,
  Mina,
  Poseidon,
  PrivateKey,
  PublicKey,
  Signature,
  UInt32,
  UInt64,
  UInt8,
  VerificationKey
} from "o1js"

import { beforeAll, beforeEach, describe, expect, it } from "vitest"
import {
  FungibleToken,
  FungibleTokenAdmin,
  minTimeUnlockFarmReward,
  Pool,
  PoolFactory,
  PoolTokenHolder,
  SignerMerkleWitness
} from "../dist"
import { claimerNumber, Farm, FarmMerkleWitness, FarmReward, FarmRewardTokenHolder, FarmTokenHolder } from "../dist"
import { generateRewardMerkle } from "./Farm.Token.test"
import { FarmUpgradeTest } from "./FarmUpgradeTest"

let proofsEnabled = false

describe("Farming pool mina", () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    bobAccount: Mina.TestPublicKey,
    bobKey: PrivateKey,
    merkle: MerkleTree,
    aliceAccount: Mina.TestPublicKey,
    aliceKey: PrivateKey,
    dylanAccount: Mina.TestPublicKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: PoolFactory,
    zkPoolMinaAddress: PublicKey,
    zkPoolMinaPrivateKey: PrivateKey,
    zkPoolMina: Pool,
    zkTokenAdminAddress: PublicKey,
    zkTokenAdminPrivateKey: PrivateKey,
    zkTokenAdmin: FungibleTokenAdmin,
    zkTokenAddress0: PublicKey,
    zkTokenPrivateKey0: PrivateKey,
    zkToken0: FungibleToken,
    zkTokenAddress1: PublicKey,
    zkTokenPrivateKey1: PrivateKey,
    zkToken1: FungibleToken,
    zkTokenAddress2: PublicKey,
    zkTokenPrivateKey2: PrivateKey,
    zkToken2: FungibleToken,
    zkFarmTokenAddress: PublicKey,
    zkFarmTokenPrivateKey: PrivateKey,
    zkFarmToken: Farm,
    zkFarmTokenHolder: FarmTokenHolder,
    local: any,
    compileKey: VerificationKey,
    tokenHolder: PoolTokenHolder

  beforeAll(async () => {
    const analyze = await Pool.analyzeMethods()
    getGates(analyze)

    const cache = Cache.FileSystem("./cache")
    const compileResult = await FarmUpgradeTest.compile({ cache })
    compileKey = compileResult.verificationKey

    if (proofsEnabled) {
      console.time("compile pool")
      await FungibleTokenAdmin.compile()
      await FungibleToken.compile()
      await PoolFactory.compile()
      await Pool.compile()
      await PoolTokenHolder.compile()
      await Farm.compile()
      console.timeEnd("compile pool")
    }

    function getGates(analyze: any) {
      for (const key in analyze) {
        if (Object.prototype.hasOwnProperty.call(analyze, key)) {
          const element = analyze[key]
          console.log(key, element?.gates.length)
        }
      }
    }
  })

  beforeEach(async () => {
    // no transaction limits on zeko
    local = await Mina.LocalBlockchain({ proofsEnabled })
    Mina.setActiveInstance(local)
    ;[deployerAccount, senderAccount, bobAccount, aliceAccount, dylanAccount] = local.testAccounts
    deployerKey = deployerAccount.key
    senderKey = senderAccount.key
    bobKey = bobAccount.key
    aliceKey = aliceAccount.key

    zkAppPrivateKey = PrivateKey.random()
    zkAppAddress = zkAppPrivateKey.toPublicKey()
    zkApp = new PoolFactory(zkAppAddress)

    zkPoolMinaPrivateKey = PrivateKey.random()
    zkPoolMinaAddress = zkPoolMinaPrivateKey.toPublicKey()
    zkPoolMina = new Pool(zkPoolMinaAddress)

    zkFarmTokenPrivateKey = PrivateKey.random()
    zkFarmTokenAddress = zkFarmTokenPrivateKey.toPublicKey()
    zkFarmToken = new Farm(zkFarmTokenAddress)
    zkFarmTokenHolder = new FarmTokenHolder(zkFarmTokenAddress, zkPoolMina.deriveTokenId())

    zkTokenAdminPrivateKey = PrivateKey.random()
    zkTokenAdminAddress = zkTokenAdminPrivateKey.toPublicKey()
    zkTokenAdmin = new FungibleTokenAdmin(zkTokenAdminAddress)

    let keyTokenX = PrivateKey.random()
    let keyTokenY = PrivateKey.random()

    // order token to create pool
    let xIsLower = keyTokenX.toPublicKey().x.lessThan(keyTokenY.toPublicKey().x)

    zkTokenPrivateKey0 = xIsLower.toBoolean() ? keyTokenX : keyTokenY
    zkTokenAddress0 = zkTokenPrivateKey0.toPublicKey()
    zkToken0 = new FungibleToken(zkTokenAddress0)

    zkTokenPrivateKey1 = xIsLower.toBoolean() ? keyTokenY : keyTokenX
    zkTokenAddress1 = zkTokenPrivateKey1.toPublicKey()
    zkToken1 = new FungibleToken(zkTokenAddress1)

    zkTokenPrivateKey2 = PrivateKey.random()
    zkTokenAddress2 = zkTokenPrivateKey2.toPublicKey()
    zkToken2 = new FungibleToken(zkTokenAddress2)

    tokenHolder = new PoolTokenHolder(zkPoolMinaAddress, zkToken0.deriveTokenId())

    merkle = new MerkleTree(32)
    merkle.setLeaf(0n, Poseidon.hash(bobAccount.toFields()))
    merkle.setLeaf(1n, Poseidon.hash(aliceAccount.toFields()))
    const root = merkle.getRoot()

    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4)
      await zkApp.deploy({
        symbol: "FAC",
        src: "https://luminadex.com/",
        owner: bobAccount,
        protocol: aliceAccount,
        delegator: dylanAccount,
        approvedSigner: root
      })
      await zkTokenAdmin.deploy({
        adminPublicKey: deployerAccount
      })
      await zkToken0.deploy({
        symbol: "LTA",
        src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
        allowUpdates: false
      })
      await zkToken0.initialize(
        zkTokenAdminAddress,
        UInt8.from(9),
        Bool(false)
      )
    })
    await txn.prove()
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey, zkTokenAdminPrivateKey, zkTokenPrivateKey0]).send()

    // deploy token 2
    const txn2 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 2)
      await zkToken1.deploy({
        symbol: "LTB",
        src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
        allowUpdates: false
      })
      await zkToken1.initialize(
        zkTokenAdminAddress,
        UInt8.from(9),
        Bool(false)
      )
    })
    await txn2.prove()
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn2.sign([deployerKey, zkAppPrivateKey, zkTokenAdminPrivateKey, zkTokenPrivateKey1]).send()

    // deploy token 3
    const txn4 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 2)
      await zkToken2.deploy({
        symbol: "REW",
        src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
        allowUpdates: false
      })
      await zkToken2.initialize(
        zkTokenAdminAddress,
        UInt8.from(9),
        Bool(false)
      )
    })
    await txn4.prove()
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn4.sign([deployerKey, zkAppPrivateKey, zkTokenAdminPrivateKey, zkTokenPrivateKey2]).send()

    const witness = merkle.getWitness(0n)
    const circuitWitness = new SignerMerkleWitness(witness)
    const signature2 = Signature.create(bobKey, zkPoolMinaAddress.toFields())
    const txn6 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4)
      await zkApp.createPool(zkPoolMinaAddress, zkTokenAddress1, bobAccount, signature2, circuitWitness)
    })
    console.log("Pool Mina creation au", txn6.transaction.accountUpdates.length)
    await txn6.prove()
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn6.sign([deployerKey, zkPoolMinaPrivateKey]).send()

    let { genesisTimestamp, slotTime } = Mina.getNetworkConstants()

    let start = BigInt(Date.now() + 10_000)
    start = (start - genesisTimestamp.toBigInt()) / slotTime.toBigInt()
    let end = start + BigInt(1_000_000)
    end = end / slotTime.toBigInt()

    let txn10 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 2)
      await zkFarmToken.deploy({
        owner: deployerAccount,
        pool: zkPoolMinaAddress,
        startSlot: new UInt64(start),
        endSlot: new UInt64(end)
      })
      await zkFarmTokenHolder.deploy({
        owner: deployerAccount
      })
      await zkPoolMina.approveAccountUpdate(zkFarmTokenHolder.self)
    })
    console.log("zkFarmToken deploy", txn10.toPretty())
    await txn10.prove()
    await txn10.sign([zkFarmTokenPrivateKey, deployerKey]).send()

    // mint token to user
    await mintToken(deployerAccount)
    await mintToken(senderAccount)
    await mintToken(bobAccount)
    await mintToken(aliceAccount)

    let amt = UInt64.from(10 * 10 ** 9)
    let amtToken = UInt64.from(50 * 10 ** 9)
    let txn5 = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkPoolMina.supplyFirstLiquidities(amt, amtToken)
    })
    await txn5.prove()
    await txn5.sign([senderKey]).send()

    let amtMina = UInt64.from(1 * 10 ** 9)
    let amtToken2 = UInt64.from(5 * 10 ** 9)
    let totalLiquidity = Mina.getBalance(zkPoolMinaAddress, zkPoolMina.deriveTokenId())
    let amtToken0 = Mina.getBalance(zkPoolMinaAddress)
    let amtToken1 = Mina.getBalance(zkPoolMinaAddress, zkToken1.deriveTokenId())
    let txn8 = await Mina.transaction(bobAccount, async () => {
      AccountUpdate.fundNewAccount(bobAccount, 1)
      await zkPoolMina.supplyLiquidity(amtMina, amtToken2, amtToken0, amtToken1, totalLiquidity)
    })
    await txn8.prove()
    await txn8.sign([bobKey]).send()

    totalLiquidity = Mina.getBalance(zkPoolMinaAddress, zkPoolMina.deriveTokenId())
    amtToken0 = Mina.getBalance(zkPoolMinaAddress)
    amtToken1 = Mina.getBalance(zkPoolMinaAddress, zkToken1.deriveTokenId())
    txn8 = await Mina.transaction(aliceAccount, async () => {
      AccountUpdate.fundNewAccount(aliceAccount, 1)
      await zkPoolMina.supplyLiquidity(amtMina, amtToken2, amtToken0, amtToken1, totalLiquidity)
    })
    await txn8.prove()
    await txn8.sign([aliceKey]).send()
  })

  it("get reward", async () => {
    let txn = await Mina.transaction(bobAccount, async () => {
      AccountUpdate.fundNewAccount(bobAccount, 1)
      await zkFarmToken.deposit(UInt64.from(1000))
    })
    await txn.prove()
    await txn.sign([bobKey]).send()

    local.setGlobalSlot(1)
    txn = await Mina.transaction(bobAccount, async () => {
      await zkFarmTokenHolder.withdraw(UInt64.from(1000))
      await zkPoolMina.approveAccountUpdate(zkFarmTokenHolder.self)
    })
    await txn.prove()
    await txn.sign([bobKey]).send()
    local.setGlobalSlot(2)
    txn = await Mina.transaction(aliceAccount, async () => {
      AccountUpdate.fundNewAccount(aliceAccount, 1)
      await zkFarmToken.deposit(UInt64.from(5000))
    })
    await txn.prove()
    await txn.sign([aliceKey]).send()
    local.setGlobalSlot(3)
    txn = await Mina.transaction(aliceAccount, async () => {
      await zkFarmToken.deposit(UInt64.from(333))
    })
    await txn.prove()
    await txn.sign([aliceKey]).send()
    local.setGlobalSlot(5)
    txn = await Mina.transaction(aliceAccount, async () => {
      await zkFarmTokenHolder.withdraw(UInt64.from(1333))
      await zkPoolMina.approveAccountUpdate(zkFarmTokenHolder.self)
    })
    await txn.prove()
    await txn.sign([aliceKey]).send()
    local.setGlobalSlot(10)
    txn = await Mina.transaction(aliceAccount, async () => {
      await zkFarmTokenHolder.withdraw(UInt64.from(4000))
      await zkPoolMina.approveAccountUpdate(zkFarmTokenHolder.self)
    })
    await txn.prove()
    await txn.sign([aliceKey]).send()

    const dataReward = await generateRewardMerkle(zkFarmTokenAddress, zkPoolMina.deriveTokenId(), claimerNumber)
    console.log("rewardList", dataReward.rewardList)

    const key = PrivateKey.random()
    const farmReward = new FarmReward(key.toPublicKey())
    const farmRewardTokenHolder = new FarmRewardTokenHolder(key.toPublicKey(), zkToken2.deriveTokenId())
    // add more token for test
    const amountReward = dataReward.totalReward * 10n
    const timeUnlock = UInt64.from(Date.now()).add(minTimeUnlockFarmReward.mul(2))

    txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 2)
      await farmReward.deploy({
        owner: deployerAccount,
        merkleRoot: dataReward.merkle.getRoot(),
        token: zkTokenAddress2
      })
      await farmRewardTokenHolder.deploy({
        owner: deployerAccount,
        merkleRoot: dataReward.merkle.getRoot(),
        token: zkTokenAddress2
      })
      await zkToken2.approveAccountUpdate(farmRewardTokenHolder.self)
      // we deploy and fund reward in one transaction
      await zkToken2.transfer(deployerAccount, key.toPublicKey(), UInt64.from(amountReward))
    })
    // console.log("farmReward deploy", txn.toPretty());
    await txn.prove()
    await txn.sign([key, deployerKey]).send()

    // bob withdraw reward
    const balanceBeforeBob = Mina.getBalance(bobAccount, zkToken2.deriveTokenId())
    const indexBob = dataReward.rewardList.findIndex(x => x.user === bobAccount.toBase58())
    const dataBob = dataReward.rewardList[indexBob]
    const witness = dataReward.merkle.getWitness(BigInt(indexBob))
    const farmWitness = new FarmMerkleWitness(witness)
    txn = await Mina.transaction(bobAccount, async () => {
      AccountUpdate.fundNewAccount(bobAccount, 1)
      await farmRewardTokenHolder.claimReward(UInt64.from(dataBob.reward), farmWitness)
      await zkToken2.approveAccountUpdate(farmRewardTokenHolder.self)
    })
    console.log("farmReward claim", txn.toPretty())
    await txn.prove()
    await txn.sign([bobKey]).send()

    const balanceAfterBob = Mina.getBalance(bobAccount, zkToken2.deriveTokenId())
    // bob received the correct amount
    expect(balanceAfterBob.sub(balanceBeforeBob).value).toEqual(Field.from(dataBob.reward))

    txn = await Mina.transaction(bobAccount, async () => {
      await farmRewardTokenHolder.claimReward(UInt64.from(dataBob.reward), farmWitness)
      await zkToken2.approveAccountUpdate(farmRewardTokenHolder.self)
    })
    await txn.prove()
    // can't claim twice
    await expect(txn.sign([bobKey]).send()).rejects.toThrow()

    const indexAlice = dataReward.rewardList.findIndex(x => x.user === aliceAccount.toBase58())
    const dataAlice = dataReward.rewardList[indexAlice]
    const witnessAlice = dataReward.merkle.getWitness(BigInt(indexAlice))
    const farmWitnessAlice = new FarmMerkleWitness(witnessAlice)

    // bob can'claim for alice
    await expect(Mina.transaction(bobAccount, async () => {
      AccountUpdate.fundNewAccount(bobAccount, 1)
      await farmRewardTokenHolder.claimReward(UInt64.from(dataAlice.reward), farmWitnessAlice)
      await zkToken2.approveAccountUpdate(farmRewardTokenHolder.self)
    })).rejects.toThrow()

    // alice claim
    txn = await Mina.transaction(aliceAccount, async () => {
      AccountUpdate.fundNewAccount(aliceAccount, 1)
      await farmRewardTokenHolder.claimReward(UInt64.from(dataAlice.reward), farmWitnessAlice)
      await zkToken2.approveAccountUpdate(farmRewardTokenHolder.self)
    })
    await txn.prove()
    await txn.sign([aliceKey]).send()

    const amountDust = Field.from(amountReward).sub(Field.from(dataBob.reward)).sub(Field.from(dataAlice.reward))
    const balanceContract = Mina.getBalance(key.toPublicKey(), zkToken2.deriveTokenId())
    expect(balanceContract.value).toEqual(amountDust)
  })

  it("get mina reward", async () => {
    // method who test mina as reward, reward can be mina or fungible token
    let txn = await Mina.transaction(bobAccount, async () => {
      AccountUpdate.fundNewAccount(bobAccount, 1)
      await zkFarmToken.deposit(UInt64.from(1000))
    })
    await txn.prove()
    await txn.sign([bobKey]).send()

    local.setGlobalSlot(1)
    txn = await Mina.transaction(bobAccount, async () => {
      await zkFarmTokenHolder.withdraw(UInt64.from(1000))
      await zkPoolMina.approveAccountUpdate(zkFarmTokenHolder.self)
    })
    await txn.prove()
    await txn.sign([bobKey]).send()
    local.setGlobalSlot(2)
    txn = await Mina.transaction(aliceAccount, async () => {
      AccountUpdate.fundNewAccount(aliceAccount, 1)
      await zkFarmToken.deposit(UInt64.from(5000))
    })
    await txn.prove()
    await txn.sign([aliceKey]).send()
    local.setGlobalSlot(3)
    txn = await Mina.transaction(aliceAccount, async () => {
      await zkFarmToken.deposit(UInt64.from(333))
    })
    await txn.prove()
    await txn.sign([aliceKey]).send()
    local.setGlobalSlot(5)
    txn = await Mina.transaction(aliceAccount, async () => {
      await zkFarmTokenHolder.withdraw(UInt64.from(1333))
      await zkPoolMina.approveAccountUpdate(zkFarmTokenHolder.self)
    })
    await txn.prove()
    await txn.sign([aliceKey]).send()
    local.setGlobalSlot(10)
    txn = await Mina.transaction(aliceAccount, async () => {
      await zkFarmTokenHolder.withdraw(UInt64.from(4000))
      await zkPoolMina.approveAccountUpdate(zkFarmTokenHolder.self)
    })
    await txn.prove()
    await txn.sign([aliceKey]).send()

    const dataReward = await generateRewardMerkle(zkFarmTokenAddress, zkPoolMina.deriveTokenId(), claimerNumber)
    console.log("rewardList", dataReward.rewardList)

    const key = PrivateKey.random()
    const farmReward = new FarmReward(key.toPublicKey())
    // add more token for test
    const amountReward = dataReward.totalReward * 10n
    const timeUnlock = UInt64.from(Date.now()).add(minTimeUnlockFarmReward.mul(2))
    txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1)
      await farmReward.deploy({
        owner: deployerAccount,
        merkleRoot: dataReward.merkle.getRoot(),
        token: PublicKey.empty()
      })
      // we deploy and fund reward with mina in one transaction
      const accountUpdate = AccountUpdate.createSigned(deployerAccount)
      accountUpdate.send({ to: farmReward, amount: UInt64.from(amountReward) })
    })
    console.log("farmReward deploy", txn.toPretty())
    await txn.prove()
    await txn.sign([key, deployerKey]).send()

    // bob withdraw reward
    const balanceBeforeBob = Mina.getBalance(bobAccount)
    const indexBob = dataReward.rewardList.findIndex(x => x.user === bobAccount.toBase58())
    const dataBob = dataReward.rewardList[indexBob]
    const witness = dataReward.merkle.getWitness(BigInt(indexBob))
    const farmWitness = new FarmMerkleWitness(witness)
    txn = await Mina.transaction(bobAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1)
      await farmReward.claimReward(UInt64.from(dataBob.reward), farmWitness)
    })
    console.log("farmReward claim", txn.toPretty())
    await txn.prove()
    await txn.sign([bobKey, deployerKey]).send()

    const balanceAfterBob = Mina.getBalance(bobAccount)
    // bob received the correct amount
    expect(balanceAfterBob.sub(balanceBeforeBob).value).toEqual(Field.from(dataBob.reward))

    txn = await Mina.transaction(bobAccount, async () => {
      await farmReward.claimReward(UInt64.from(dataBob.reward), farmWitness)
    })
    await txn.prove()
    // can't claim twice
    await expect(txn.sign([bobKey]).send()).rejects.toThrow()

    const indexAlice = dataReward.rewardList.findIndex(x => x.user === aliceAccount.toBase58())
    const dataAlice = dataReward.rewardList[indexAlice]
    const witnessAlice = dataReward.merkle.getWitness(BigInt(indexAlice))
    const farmWitnessAlice = new FarmMerkleWitness(witnessAlice)

    // bob can'claim for alice
    await expect(Mina.transaction(bobAccount, async () => {
      AccountUpdate.fundNewAccount(bobAccount, 1)
      await farmReward.claimReward(UInt64.from(dataAlice.reward), farmWitnessAlice)
    })).rejects.toThrow()

    // alice claim
    txn = await Mina.transaction(aliceAccount, async () => {
      AccountUpdate.fundNewAccount(aliceAccount, 1)
      await farmReward.claimReward(UInt64.from(dataAlice.reward), farmWitnessAlice)
    })
    await txn.prove()
    await txn.sign([aliceKey]).send()

    const amountDust = Field.from(amountReward).sub(Field.from(dataBob.reward)).sub(Field.from(dataAlice.reward))
    const balanceContract = Mina.getBalance(key.toPublicKey())
    expect(balanceContract.value).toEqual(amountDust)
  })

  it("update verification key", async () => {
    let txn = await Mina.transaction(bobAccount, async () => {
      AccountUpdate.fundNewAccount(bobAccount, 1)
      await zkFarmToken.deposit(UInt64.from(1000))
    })
    await txn.prove()
    await txn.sign([bobKey]).send()

    local.setGlobalSlot(1)
    txn = await Mina.transaction(bobAccount, async () => {
      await zkFarmTokenHolder.withdraw(UInt64.from(1000))
      await zkPoolMina.approveAccountUpdate(zkFarmTokenHolder.self)
    })
    await txn.prove()
    await txn.sign([bobKey]).send()
    local.setGlobalSlot(2)

    let timeUnlock = Date.now() + 1000_000
    txn = await Mina.transaction(deployerAccount, async () => {
      await zkFarmTokenHolder.initUpdate(UInt64.from(timeUnlock))
      await zkPoolMina.approveAccountUpdate(zkFarmTokenHolder.self)
    })
    await txn.prove()
    await txn.sign([deployerKey]).send()

    local.setGlobalSlot(200)
    txn = await Mina.transaction(deployerAccount, async () => {
      await zkFarmTokenHolder.updateVerificationKey(compileKey)
      await zkPoolMina.approveAccountUpdate(zkFarmTokenHolder.self)
    })
    await txn.prove()
    // need to wait 1 day to update
    await expect(txn.sign([deployerKey]).send()).rejects.toThrow()

    local.setGlobalSlot(1000)
    txn = await Mina.transaction(deployerAccount, async () => {
      await zkFarmTokenHolder.updateVerificationKey(compileKey)
      await zkPoolMina.approveAccountUpdate(zkFarmTokenHolder.self)
    })
    await txn.prove()
    await txn.sign([deployerKey]).send()

    let farmv2 = new FarmUpgradeTest(zkFarmTokenAddress, zkPoolMina.deriveTokenId())
    let version = await farmv2.version()
    expect(version?.toBigInt()).toEqual(112n)

    const dataReward = await generateRewardMerkle(zkFarmTokenAddress, zkPoolMina.deriveTokenId(), claimerNumber)
    console.log("rewardList", dataReward.rewardList)

    const key = PrivateKey.random()
    const farmReward = new FarmReward(key.toPublicKey())
    const farmRewardTokenHolder = new FarmRewardTokenHolder(key.toPublicKey(), zkToken2.deriveTokenId())
    // add more token for test
    const amountReward = dataReward.totalReward * 10n

    txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 2)
      await farmReward.deploy({
        owner: deployerAccount,
        merkleRoot: dataReward.merkle.getRoot(),
        token: zkTokenAddress2
      })
      await farmRewardTokenHolder.deploy({
        owner: deployerAccount,
        merkleRoot: dataReward.merkle.getRoot(),
        token: zkTokenAddress2
      })
      await zkToken2.approveAccountUpdate(farmRewardTokenHolder.self)
      // we deploy and fund reward in one transaction
      await zkToken2.transfer(deployerAccount, key.toPublicKey(), UInt64.from(amountReward))
    })
    // console.log("farmReward deploy", txn.toPretty());
    await txn.prove()
    await txn.sign([key, deployerKey]).send()

    const state = local.getNetworkState()
    const time = globalSlotToTimestamp(state.globalSlotSinceGenesis)
    console.log("time chain", time.toBigInt())
    const timeStart = time.add(100)
    txn = await Mina.transaction(deployerAccount, async () => {
      await farmReward.initUpdate(timeStart)
    })
    await txn.prove()
    await txn.sign([deployerKey]).send()

    local.setGlobalSlot(1200)
    txn = await Mina.transaction(deployerAccount, async () => {
      await farmReward.updateVerificationKey(compileKey)
    })
    await txn.prove()
    // need to wait 1 day to update
    await expect(txn.sign([deployerKey]).send()).rejects.toThrow()

    local.setGlobalSlot(2000)
    txn = await Mina.transaction(deployerAccount, async () => {
      await farmReward.updateVerificationKey(compileKey)
    })
    await txn.prove()
    await txn.sign([deployerKey]).send()

    let farmRewardv2 = new FarmUpgradeTest(farmReward.address)
    let versionReward = await farmRewardv2.version()
    expect(versionReward?.toBigInt()).toEqual(112n)
  })

  it("update verification key 2", async () => {
    // method who test mina as reward, reward can be mina or fungible token
    let txn = await Mina.transaction(bobAccount, async () => {
      AccountUpdate.fundNewAccount(bobAccount, 1)
      await zkFarmToken.deposit(UInt64.from(1000))
    })
    await txn.prove()
    await txn.sign([bobKey]).send()

    local.setGlobalSlot(1)
    txn = await Mina.transaction(bobAccount, async () => {
      await zkFarmTokenHolder.withdraw(UInt64.from(1000))
      await zkPoolMina.approveAccountUpdate(zkFarmTokenHolder.self)
    })
    await txn.prove()
    await txn.sign([bobKey]).send()
    local.setGlobalSlot(2)

    let timeUnlock = Date.now() + 1000_000
    txn = await Mina.transaction(deployerAccount, async () => {
      await zkFarmToken.initUpdate(UInt64.from(timeUnlock))
    })
    await txn.prove()
    await txn.sign([deployerKey]).send()

    local.setGlobalSlot(200)
    txn = await Mina.transaction(deployerAccount, async () => {
      await zkFarmToken.updateVerificationKey(compileKey)
    })
    await txn.prove()
    // need to wait 1 day to update
    await expect(txn.sign([deployerKey]).send()).rejects.toThrow()

    local.setGlobalSlot(1000)
    txn = await Mina.transaction(deployerAccount, async () => {
      await zkFarmToken.updateVerificationKey(compileKey)
    })
    await txn.prove()
    await txn.sign([deployerKey]).send()

    let farmv2 = new FarmUpgradeTest(zkFarmTokenAddress)
    let version = await farmv2.version()
    expect(version?.toBigInt()).toEqual(112n)

    const dataReward = await generateRewardMerkle(zkFarmTokenAddress, zkPoolMina.deriveTokenId(), claimerNumber)
    console.log("rewardList", dataReward.rewardList)

    const key = PrivateKey.random()
    const farmReward = new FarmReward(key.toPublicKey())
    const farmRewardTokenHolder = new FarmRewardTokenHolder(key.toPublicKey(), zkToken2.deriveTokenId())
    // add more token for test
    const amountReward = dataReward.totalReward * 10n

    txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 2)
      await farmReward.deploy({
        owner: deployerAccount,
        merkleRoot: dataReward.merkle.getRoot(),
        token: zkTokenAddress2
      })
      await farmRewardTokenHolder.deploy({
        owner: deployerAccount,
        merkleRoot: dataReward.merkle.getRoot(),
        token: zkTokenAddress2
      })
      await zkToken2.approveAccountUpdate(farmRewardTokenHolder.self)
      // we deploy and fund reward in one transaction
      await zkToken2.transfer(deployerAccount, key.toPublicKey(), UInt64.from(amountReward))
    })
    // console.log("farmReward deploy", txn.toPretty());
    await txn.prove()
    await txn.sign([key, deployerKey]).send()

    const state = local.getNetworkState()
    const time = globalSlotToTimestamp(state.globalSlotSinceGenesis)
    console.log("time chain", time.toBigInt())
    const timeStart = time.add(100)
    txn = await Mina.transaction(deployerAccount, async () => {
      await farmRewardTokenHolder.initUpdate(timeStart)
      await zkToken2.approveAccountUpdate(farmRewardTokenHolder.self)
    })
    await txn.prove()
    await txn.sign([deployerKey]).send()

    local.setGlobalSlot(1200)
    txn = await Mina.transaction(deployerAccount, async () => {
      await farmRewardTokenHolder.updateVerificationKey(compileKey)
      await zkToken2.approveAccountUpdate(farmRewardTokenHolder.self)
    })
    await txn.prove()
    // need to wait 1 day to update
    await expect(txn.sign([deployerKey]).send()).rejects.toThrow()

    local.setGlobalSlot(2000)
    txn = await Mina.transaction(deployerAccount, async () => {
      await farmRewardTokenHolder.updateVerificationKey(compileKey)
      await zkToken2.approveAccountUpdate(farmRewardTokenHolder.self)
    })
    await txn.prove()
    await txn.sign([deployerKey]).send()

    let farmRewardv2 = new FarmUpgradeTest(key.toPublicKey(), zkToken2.deriveTokenId())
    let versionReward = await farmRewardv2.version()
    expect(versionReward?.toBigInt()).toEqual(112n)
  })

  async function mintToken(user: PublicKey) {
    // token are minted to original deployer, so just transfer it for test
    let txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1)
      await zkToken0.mint(user, UInt64.from(1000 * 10 ** 9))
    })
    await txn.prove()
    await txn.sign([deployerKey, zkTokenPrivateKey0]).send()

    txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1)
      await zkToken1.mint(user, UInt64.from(1000 * 10 ** 9))
    })
    await txn.prove()
    await txn.sign([deployerKey, zkTokenPrivateKey1]).send()

    txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1)
      await zkToken2.mint(user, UInt64.from(1000 * 10 ** 9))
    })
    await txn.prove()
    await txn.sign([deployerKey, zkTokenPrivateKey2]).send()
  }

  function globalSlotToTimestamp(slot: UInt32) {
    let { genesisTimestamp, slotTime } = Mina.getNetworkConstants()
    return UInt64.from(slot).mul(slotTime).add(genesisTimestamp)
  }
})
