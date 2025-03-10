import {
  AccountUpdate,
  Bool,
  fetchAccount,
  Field,
  MerkleTree,
  Mina,
  Poseidon,
  PrivateKey,
  PublicKey,
  Signature,
  UInt32,
  UInt64,
  UInt8
} from "o1js"

import { beforeAll, beforeEach, describe, expect, it } from "vitest"
import {
  FarmingEvent,
  FungibleToken,
  FungibleTokenAdmin,
  minTimeUnlockFarmReward,
  Pool,
  PoolFactory,
  PoolTokenHolder,
  SignerMerkleWitness
} from "../dist"
import { claimerNumber, Farm, FarmMerkleWitness, FarmReward, FarmRewardTokenHolder, FarmTokenHolder } from "../dist"

let proofsEnabled = false
describe("Farming pool token", () => {
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
    zkPoolAddress: PublicKey,
    zkPoolPrivateKey: PrivateKey,
    zkPool: Pool,
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
    tokenHolder: PoolTokenHolder

  beforeAll(async () => {
    const analyze = await Pool.analyzeMethods()
    getGates(analyze)

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
    local = await Mina.LocalBlockchain({ proofsEnabled, enforceTransactionLimits: false })
    Mina.setActiveInstance(local)
    ;[deployerAccount, senderAccount, bobAccount, aliceAccount, dylanAccount] = local.testAccounts
    deployerKey = deployerAccount.key
    senderKey = senderAccount.key
    bobKey = bobAccount.key
    aliceKey = aliceAccount.key

    zkAppPrivateKey = PrivateKey.random()
    zkAppAddress = zkAppPrivateKey.toPublicKey()
    zkApp = new PoolFactory(zkAppAddress)

    zkPoolPrivateKey = PrivateKey.random()
    zkPoolAddress = zkPoolPrivateKey.toPublicKey()
    zkPool = new Pool(zkPoolAddress)

    zkFarmTokenPrivateKey = PrivateKey.random()
    zkFarmTokenAddress = zkFarmTokenPrivateKey.toPublicKey()
    zkFarmToken = new Farm(zkFarmTokenAddress)
    zkFarmTokenHolder = new FarmTokenHolder(zkFarmTokenAddress, zkPool.deriveTokenId())

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

    tokenHolder = new PoolTokenHolder(zkPoolAddress, zkToken0.deriveTokenId())

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

    const signature = Signature.create(bobKey, zkPoolAddress.toFields())
    const witness = merkle.getWitness(0n)
    const circuitWitness = new SignerMerkleWitness(witness)
    const txn3 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 5)
      await zkApp.createPoolToken(
        zkPoolAddress,
        zkTokenAddress0,
        zkTokenAddress1,
        bobAccount,
        signature,
        circuitWitness
      )
    })

    // console.log("Pool creation", txn3.toPretty());
    console.log("Pool creation au", txn3.transaction.accountUpdates.length)
    await txn3.prove()
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn3.sign([deployerKey, zkPoolPrivateKey]).send()

    let { genesisTimestamp, slotTime } = Mina.getNetworkConstants()

    let start = BigInt(Date.now() + 10_000)
    start = (start - genesisTimestamp.toBigInt()) / slotTime.toBigInt()
    let end = start + BigInt(1_000_000)
    end = end / slotTime.toBigInt()

    let txn10 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 2)
      await zkFarmToken.deploy({
        owner: deployerAccount,
        pool: zkPoolAddress,
        startSlot: new UInt64(start),
        endSlot: new UInt64(end)
      })
      await zkFarmTokenHolder.deploy({
        owner: deployerAccount
      })
      await zkPool.approveAccountUpdate(zkFarmTokenHolder.self)
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
      await zkPool.supplyFirstLiquiditiesToken(amt, amtToken)
    })
    await txn5.prove()
    await txn5.sign([senderKey]).send()

    let amtMina = UInt64.from(1 * 10 ** 9)
    let amtToken2 = UInt64.from(5 * 10 ** 9)
    let totalLiquidity = Mina.getBalance(zkPoolAddress, zkPool.deriveTokenId())
    let amtToken0 = Mina.getBalance(zkPoolAddress, zkToken0.deriveTokenId())
    let amtToken1 = Mina.getBalance(zkPoolAddress, zkToken1.deriveTokenId())
    let txn8 = await Mina.transaction(bobAccount, async () => {
      AccountUpdate.fundNewAccount(bobAccount, 1)
      await zkPool.supplyLiquidityToken(amtMina, amtToken2, amtToken0, amtToken1, totalLiquidity)
    })
    await txn8.prove()
    await txn8.sign([bobKey]).send()

    totalLiquidity = Mina.getBalance(zkPoolAddress, zkPool.deriveTokenId())
    amtToken0 = Mina.getBalance(zkPoolAddress, zkToken0.deriveTokenId())
    amtToken1 = Mina.getBalance(zkPoolAddress, zkToken1.deriveTokenId())
    txn8 = await Mina.transaction(aliceAccount, async () => {
      AccountUpdate.fundNewAccount(aliceAccount, 1)
      await zkPool.supplyLiquidityToken(amtMina, amtToken2, amtToken0, amtToken1, totalLiquidity)
    })
    await txn8.prove()
    await txn8.sign([aliceKey]).send()
  })

  it("deposit withdraw", async () => {
    await fetchAccount({ publicKey: zkFarmTokenAddress })

    let txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkFarmToken.deposit(UInt64.from(1000))
    })
    await txn.prove()
    console.log("zkFarmToken deposit", txn.toPretty())
    await txn.sign([senderKey]).send()

    const balance = Mina.getBalance(zkFarmTokenAddress, zkPool.deriveTokenId())
    expect(balance.toBigInt()).toEqual(1000n)

    const balanceLiquidity = Mina.getBalance(senderAccount, zkFarmToken.deriveTokenId())
    expect(balanceLiquidity.toBigInt()).toEqual(1000n)

    txn = await Mina.transaction(senderAccount, async () => {
      await zkFarmTokenHolder.withdraw(UInt64.from(1000))
      await zkPool.approveAccountUpdate(zkFarmTokenHolder.self)
    })
    await txn.prove()
    console.log("zkFarmToken withdraw", txn.toPretty())
    await txn.sign([senderKey]).send()

    const balanceAfter = Mina.getBalance(zkFarmTokenAddress, zkPool.deriveTokenId())
    expect(balanceAfter.toBigInt()).toEqual(0n)

    const balanceLiquidityAfter = Mina.getBalance(senderAccount, zkFarmToken.deriveTokenId())
    expect(balanceLiquidityAfter.toBigInt()).toEqual(0n)
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
      await zkPool.approveAccountUpdate(zkFarmTokenHolder.self)
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
      await zkPool.approveAccountUpdate(zkFarmTokenHolder.self)
    })
    await txn.prove()
    await txn.sign([aliceKey]).send()
    local.setGlobalSlot(10)
    txn = await Mina.transaction(aliceAccount, async () => {
      await zkFarmTokenHolder.withdraw(UInt64.from(4000))
      await zkPool.approveAccountUpdate(zkFarmTokenHolder.self)
    })
    await txn.prove()
    await txn.sign([aliceKey]).send()

    const dataReward = await generateRewardMerkle(zkFarmTokenAddress, zkPool.deriveTokenId(), claimerNumber)
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
    // console.log("farmReward claim", txn.toPretty());
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
})

type farmInfo = {
  time: bigint
  amount: bigint
  deposit: boolean
  total: bigint
  reward: bigint
}

/**
 * Test method don't use it on production
 * based on current reward by block
 * @param farmAddress
 */
export async function generateRewardMerkle(farmAddress: PublicKey, tokenId: Field, merkleSize: number) {
  const farm = new Farm(farmAddress)
  const events = await farm.fetchEvents(UInt32.zero, UInt32.from(1000))
  const userList = new Map<string, farmInfo[]>()
  generateMapReward(events, userList, "deposit")
  const farmholder = new FarmTokenHolder(farmAddress, tokenId)
  const eventsWithdraw = await farmholder.fetchEvents(UInt32.zero, UInt32.from(1000))
  generateMapReward(eventsWithdraw, userList, "withdraw")
  let totalReward = 0n
  const rewardList = []
  for (const key of userList.keys()) {
    console.log(key)
    const data = userList.get(key) as farmInfo[]
    const orderData = data.sort((a: any, b: any) => Number(a.time - b.time))
    for (let index = 0; index < orderData.length; index++) {
      const element = orderData[index]
      let timeElapsed = 0n
      if (index > 0) {
        const oldData = orderData[index - 1]
        // time elapsed in seconds
        timeElapsed = (element.time - oldData.time) / 1000n
        element.total = oldData.total + element.amount
        // we give 0,000 001 token by secon by amount stacked
        element.reward += timeElapsed * 1_000n * oldData.total
      } else {
        element.total = element.amount
      }

      if (index === orderData.length - 1) {
        rewardList.push({ user: key, reward: element.reward })
        totalReward += element.reward
      }
    }
  }

  const merkle = new MerkleTree(merkleSize)
  for (let index = 0; index < rewardList.length; index++) {
    const element = rewardList[index]
    const userKey = PublicKey.fromBase58(element.user).toFields()
    const amount = new Field(element.reward)
    const hash = Poseidon.hash([userKey[0], userKey[1], amount])
    merkle.setLeaf(BigInt(index), hash)
  }

  return { totalReward, rewardList, merkle }
}

function generateMapReward(events: any, userList: Map<string, farmInfo[]>, eventType: string) {
  for (let index = 0; index < events.length; index++) {
    const element = events[index]
    if (element.type === eventType) {
      const data = element.event.data as unknown as FarmingEvent
      const sender = data.sender.toBase58()
      const amount = data.amount
      const time = globalSlotToTimestamp(element.globalSlot)
      console.log("time", time.toBigInt())
      const farmInfo = {
        time: time.toBigInt(),
        amount: eventType === "deposit" ? amount.toBigInt() : -amount.toBigInt(),
        deposit: eventType === "deposit",
        total: 0n,
        reward: 0n
      }
      if (userList.has(sender)) {
        const user = userList.get(sender)
        user!.push(farmInfo)
      } else {
        userList.set(sender, [farmInfo])
      }
    }
  }
}

function globalSlotToTimestamp(slot: UInt32) {
  let { genesisTimestamp, slotTime } = Mina.getNetworkConstants()
  return UInt64.from(slot).mul(slotTime).add(genesisTimestamp)
}
