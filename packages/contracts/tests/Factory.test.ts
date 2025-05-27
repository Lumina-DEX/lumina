import { fetchAccount, Field, MerkleMap, Poseidon, Provable, PublicKey, Signature, UInt32 } from "o1js"
import { AccountUpdate, Bool, Mina, PrivateKey, UInt64, UInt8 } from "o1js"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import {
  FungibleToken,
  FungibleTokenAdmin,
  getAmountLiquidityOutUint,
  mulDiv,
  MultisigInfo,
  Pool,
  PoolFactory,
  PoolTokenHolder,
  SignatureInfo,
  SignatureRight,
  UpdateSignerData
} from "../dist"

const proofsEnabled = false

describe("Pool Factory Mina", () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    bobAccount: Mina.TestPublicKey,
    bobKey: PrivateKey,
    merkle: MerkleMap,
    aliceAccount: Mina.TestPublicKey,
    aliceKey: PrivateKey,
    dylanAccount: Mina.TestPublicKey,
    bobPublic: PublicKey,
    alicePublic: PublicKey,
    dylanPublic: PublicKey,
    senderPublic: PublicKey,
    deployerPublic: PublicKey,
    allRight: SignatureRight,
    deployRight: SignatureRight,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: PoolFactory,
    zkPoolAddress: PublicKey,
    zkPoolPrivateKey: PrivateKey,
    zkPool: Pool,
    zkTokenAdminAddress: PublicKey,
    zkTokenAdminPrivateKey: PrivateKey,
    zkTokenAdmin: FungibleTokenAdmin,
    zkTokenAddress: PublicKey,
    zkTokenPrivateKey: PrivateKey,
    zkToken: FungibleToken,
    tokenHolder: PoolTokenHolder,
    Local: any

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
    Local = await Mina.LocalBlockchain({ proofsEnabled })
    Mina.setActiveInstance(Local)
    ;[deployerAccount, senderAccount, bobAccount, aliceAccount, dylanAccount] = Local.testAccounts
    deployerKey = deployerAccount.key
    senderKey = senderAccount.key
    bobKey = bobAccount.key
    aliceKey = aliceAccount.key

    senderPublic = senderKey.toPublicKey()
    bobPublic = bobKey.toPublicKey()
    alicePublic = aliceKey.toPublicKey()
    dylanPublic = dylanAccount.key.toPublicKey()
    deployerPublic = deployerKey.toPublicKey()

    allRight = new SignatureRight(Bool(true), Bool(true), Bool(true), Bool(true), Bool(true), Bool(true))
    deployRight = SignatureRight.canDeployPool()

    zkAppPrivateKey = PrivateKey.random()
    zkAppAddress = zkAppPrivateKey.toPublicKey()
    zkApp = new PoolFactory(zkAppAddress)

    zkPoolPrivateKey = PrivateKey.random()
    zkPoolAddress = zkPoolPrivateKey.toPublicKey()
    zkPool = new Pool(zkPoolAddress)

    zkTokenAdminPrivateKey = PrivateKey.random()
    zkTokenAdminAddress = zkTokenAdminPrivateKey.toPublicKey()
    zkTokenAdmin = new FungibleTokenAdmin(zkTokenAdminAddress)

    zkTokenPrivateKey = PrivateKey.random()
    zkTokenAddress = zkTokenPrivateKey.toPublicKey()
    zkToken = new FungibleToken(zkTokenAddress)

    tokenHolder = new PoolTokenHolder(zkPoolAddress, zkToken.deriveTokenId())

    merkle = new MerkleMap()
    merkle.set(Poseidon.hash(bobPublic.toFields()), allRight.hash())
    merkle.set(Poseidon.hash(alicePublic.toFields()), allRight.hash())
    merkle.set(Poseidon.hash(senderPublic.toFields()), allRight.hash())
    merkle.set(Poseidon.hash(deployerPublic.toFields()), deployRight.hash())

    const root = merkle.getRoot()

    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()
    const time = getSlotFromTimestamp(tomorrow)

    const info = new UpdateSignerData({ oldRoot: Field.empty(), newRoot: root, deadlineSlot: UInt32.from(time) })

    const signBob = Signature.create(bobKey, info.toFields())
    const signAlice = Signature.create(aliceKey, info.toFields())
    const signDylan = Signature.create(senderAccount.key, info.toFields())

    const multi = new MultisigInfo({
      approvedUpgrader: root,
      messageHash: info.hash(),
      deadlineSlot: UInt32.from(time)
    })
    const infoBob = new SignatureInfo({
      user: bobPublic,
      witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())),
      signature: signBob,
      right: allRight
    })
    const infoAlice = new SignatureInfo({
      user: alicePublic,
      witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())),
      signature: signAlice,
      right: allRight
    })
    const infoDylan = new SignatureInfo({
      user: senderPublic,
      witness: merkle.getWitness(Poseidon.hash(senderPublic.toFields())),
      signature: signDylan,
      right: allRight
    })
    const array = [infoBob, infoAlice, infoDylan]

    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4)
      await zkApp.deploy({
        symbol: "FAC",
        signatures: array,
        multisigInfo: multi,
        src: "https://luminadex.com/",
        protocol: aliceAccount,
        delegator: dylanAccount,
        approvedSigner: root
      })
      await zkTokenAdmin.deploy({
        adminPublicKey: deployerAccount
      })
      await zkToken.deploy({
        symbol: "LTA",
        src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
        allowUpdates: false
      })
      await zkToken.initialize(
        zkTokenAdminAddress,
        UInt8.from(9),
        Bool(false)
      )
    })
    await txn.prove()
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey, zkTokenAdminPrivateKey, zkTokenPrivateKey]).send()

    const signature = Signature.create(bobKey, zkPoolAddress.toFields())
    const witness = merkle.getWitness(Poseidon.hash(bobPublic.toFields()))
    const txn3 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4)
      await zkApp.createPool(zkPoolAddress, zkTokenAddress, bobAccount, signature, witness, allRight)
    })

    // console.log("Pool creation", txn3.toPretty());
    console.log("Pool creation au", txn3.transaction.accountUpdates.length)
    await txn3.prove()
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn3.sign([deployerKey, zkPoolPrivateKey]).send()

    // mint token to user
    await mintToken(senderAccount)
  })

  it("add first liquidity", async () => {
    const amt = UInt64.from(10 * 10 ** 9)
    const amtToken = UInt64.from(50 * 10 ** 9)
    const txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkPool.supplyFirstLiquidities(amt, amtToken)
    })
    console.log("supplyFirstLiquidities", txn.toPretty())
    console.log("supplyFirstLiquidities au", txn.transaction.accountUpdates.length)
    await txn.prove()
    await txn.sign([senderKey]).send()

    const liquidityUser = Mina.getBalance(senderAccount, zkPool.deriveTokenId())
    const expected = amt.value.add(amtToken.value).sub(Pool.minimumLiquidity.value)
    console.log("liquidity user", liquidityUser.toString())
    expect(liquidityUser.value).toEqual(expected)

    const balanceToken = Mina.getBalance(zkPoolAddress, zkToken.deriveTokenId())
    expect(balanceToken.value).toEqual(amtToken.value)

    const balanceMina = Mina.getBalance(zkPoolAddress)
    expect(balanceMina.value).toEqual(amt.value)
  })

  it("Transfer liquidity", async () => {
    const amt = UInt64.from(10 * 10 ** 9)
    const amtToken = UInt64.from(50 * 10 ** 9)
    let txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkPool.supplyFirstLiquidities(amt, amtToken)
    })
    // console.log("supplyFirstLiquidities", txn.toPretty());
    console.log("supplyFirstLiquidities au", txn.transaction.accountUpdates.length)
    await txn.prove()
    await txn.sign([senderKey]).send()

    const liquidityUser = Mina.getBalance(senderAccount, zkPool.deriveTokenId())
    const expected = amt.value.add(amtToken.value).sub(Pool.minimumLiquidity.value)
    expect(liquidityUser.value).toEqual(expected)

    txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkPool.transfer(senderAccount, bobAccount, UInt64.from(1000))
    })
    // console.log("supplyFirstLiquidities", txn.toPretty());
    console.log("supplyFirstLiquidities au", txn.transaction.accountUpdates.length)
    await txn.prove()
    await txn.sign([senderKey]).send()

    const liquidityBob = Mina.getBalance(bobAccount, zkPool.deriveTokenId())
    expect(liquidityBob.value).toEqual(UInt64.from(1000).value)
  })

  it("withdraw liquidity", async () => {
    const minaUser = Mina.getBalance(senderAccount)
    console.log("mina before", minaUser.toBigInt())
    const amt = UInt64.from(10 * 10 ** 9)
    const amtToken = UInt64.from(50 * 10 ** 9)
    let txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkPool.supplyFirstLiquidities(amt, amtToken)
    })
    await txn.prove()
    await txn.sign([senderKey]).send()

    const minaUserAfterDeposit = Mina.getBalance(senderAccount)
    const expectedMina = minaUser.sub(amt)
    // expect(minaUserAfterDeposit.value).toEqual(expectedMina.value);
    console.log("mina after deposit", minaUserAfterDeposit.toBigInt())

    const liquidityUser = Mina.getBalance(senderAccount, zkPool.deriveTokenId())
    // const expected = amt.value.add(amtToken.value).sub(MINIMUM_LIQUIDITY.value);

    const supply = Mina.getBalance(zkPoolAddress, zkPool.deriveTokenId())

    const liquityOut = UInt64.from(1 * 10 ** 9)
    const amountMinaOut = mulDiv(liquityOut, amt, supply)
    const amountTokenOut = mulDiv(liquityOut, amtToken, supply)
    txn = await Mina.transaction(senderAccount, async () => {
      await tokenHolder.withdrawLiquidity(liquityOut, amountMinaOut, amountTokenOut, amt, amtToken, supply)
      await zkToken.approveAccountUpdate(tokenHolder.self)
    })
    console.log("Withdraw liquidity", txn.toPretty())
    console.log("Withdraw liquidity au", txn.transaction.accountUpdates.length)

    await txn.prove()
    await txn.sign([senderKey]).send()

    const minaUserAfter = Mina.getBalance(senderAccount)
    console.log("mina after", minaUserAfter.toBigInt())
  })

  it("add second liquidity", async () => {
    const amt = UInt64.from(10 * 10 ** 9)
    const amtToken = UInt64.from(50 * 10 ** 9)
    let txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkPool.supplyFirstLiquidities(amt, amtToken)
    })
    console.log("createPool au", txn.transaction.accountUpdates.length)
    await txn.prove()
    await txn.sign([senderKey]).send()

    let liquidityUser = Mina.getBalance(senderAccount, zkPool.deriveTokenId())
    const expected = amt.value.add(amtToken.value).sub(Pool.minimumLiquidity.value)
    const totalLiquidity = Mina.getBalance(zkPoolAddress, zkPool.deriveTokenId())
    console.log("liquidity user", liquidityUser.toString())
    expect(liquidityUser.value).toEqual(expected)

    const amtMina = UInt64.from(1 * 10 ** 9)
    const amtToken2 = UInt64.from(5 * 10 ** 9)
    txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1)
      await zkPool.supplyLiquidity(amtMina, amtToken2, amt, amtToken, totalLiquidity)
    })
    console.log("add liquidity from mina", txn.toPretty())
    console.log("add liquidity from mina au", txn.transaction.accountUpdates.length)
    await txn.prove()
    await txn.sign([deployerKey]).send()
    liquidityUser = Mina.getBalance(deployerAccount, zkPool.deriveTokenId())
    const liquidityOut = mulDiv(amtMina, totalLiquidity, amt)
    expect(liquidityUser.value).toEqual(liquidityOut.value)
    console.log("liquidity deployer", liquidityUser.toString())
  })

  it("add second liquidity slippage", async () => {
    const amt = UInt64.from(10 * 10 ** 9)
    const amtToken = UInt64.from(50 * 10 ** 9)
    let txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkPool.supplyFirstLiquidities(amt, amtToken)
    })
    console.log("createPool au", txn.transaction.accountUpdates.length)
    await txn.prove()
    await txn.sign([senderKey]).send()

    let liquidityUser = Mina.getBalance(senderAccount, zkPool.deriveTokenId())
    const expected = amt.value.add(amtToken.value).sub(Pool.minimumLiquidity.value)
    const totalLiquidity = Mina.getBalance(zkPoolAddress, zkPool.deriveTokenId())
    console.log("liquidity user", liquidityUser.toString())
    expect(liquidityUser.value).toEqual(expected)

    const amtMina = UInt64.from(1 * 10 ** 9)
    const reserve = await getReserves(zkPoolAddress)
    const out = getAmountLiquidityOutUint(
      amtMina,
      reserve.amountMina,
      reserve.amountToken,
      reserve.liquidity,
      UInt64.one
    )
    txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1)
      await zkPool.supplyLiquidity(out.amountAIn, out.amountBIn, out.balanceAMax, out.balanceBMax, out.supplyMin)
    })
    console.log("add liquidity from mina", txn.toPretty())
    console.log("add liquidity from mina au", txn.transaction.accountUpdates.length)
    await txn.prove()
    await txn.sign([deployerKey]).send()
    liquidityUser = Mina.getBalance(deployerAccount, zkPool.deriveTokenId())
    expect(liquidityUser.value).toEqual(out.liquidity.value)
    console.log("liquidity deployer", liquidityUser.toString())
  })

  async function getReserves(poolAddress: PublicKey) {
    const acc = await fetchAccount({ publicKey: poolAddress })
    const zkPool = new Pool(poolAddress)
    const token = await zkPool.token1.fetch()
    const zkToken = new FungibleToken(token!)
    const accToken = await fetchAccount({ publicKey: poolAddress, tokenId: zkToken.deriveTokenId() })
    const accLiquidity = await fetchAccount({ publicKey: poolAddress, tokenId: zkPool.deriveTokenId() })

    return {
      amountToken: Mina.getBalance(poolAddress, zkToken.deriveTokenId()),
      amountMina: Mina.getBalance(poolAddress),
      liquidity: Mina.getBalance(poolAddress, zkPool.deriveTokenId())
    }
  }

  it("swap from mina", async () => {
    const amt = UInt64.from(10 * 10 ** 9)
    const amtToken = UInt64.from(50 * 10 ** 9)
    const txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkPool.supplyFirstLiquidities(amt, amtToken)
    })
    await txn.prove()
    await txn.sign([senderKey]).send()

    const amountIn = UInt64.from(1.3 * 10 ** 9)

    const reserveIn = Mina.getBalance(zkPoolAddress)
    const reserveOut = Mina.getBalance(zkPoolAddress, zkToken.deriveTokenId())

    const balBefore = Mina.getBalance(senderAccount, zkToken.deriveTokenId())

    const balanceMin = reserveOut.sub(reserveOut.div(100))
    const balanceMax = reserveIn.add(reserveIn.div(100))

    const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn))
    const optimalOut = mulDiv(reserveOut, amountIn, reserveIn.add(amountIn))

    const dif = optimalOut.sub(expectedOut)
    console.log("user lost", dif.toBigInt())

    const txn2 = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 2)
      await tokenHolder.swapFromMinaToToken(
        bobAccount,
        UInt64.from(5),
        amountIn,
        UInt64.from(1),
        balanceMax,
        balanceMin
      )
      await zkToken.approveAccountUpdate(tokenHolder.self)
    })
    console.log("swap from mina", txn2.toPretty())
    console.log("swap from mina au", txn2.transaction.accountUpdates.length)
    await txn2.prove()
    await txn2.sign([senderKey]).send()

    /*const resIN = reserveIn.add(amountIn);
    const resOut = reserveOut.sub(expectedOut);

    const reserveIn2 = Mina.getBalance(zkPoolAddress);
    const reserveOut2 = Mina.getBalance(zkPoolAddress, zkToken.deriveTokenId());
    expect(reserveIn2.value).toEqual(resIN.value);
    expect(reserveOut2.value).toEqual(resOut.value);

    const balAfter = Mina.getBalance(senderAccount, zkToken.deriveTokenId());
    expect(balAfter.value).toEqual(balBefore.add(expectedOut).value);*/
  })

  it("swap from token", async () => {
    const amt = UInt64.from(10 * 10 ** 9)
    const amtToken = UInt64.from(50 * 10 ** 9)
    const txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkPool.supplyFirstLiquidities(amt, amtToken)
    })
    await txn.prove()
    await txn.sign([senderKey]).send()

    const reserveIn = Mina.getBalance(zkPoolAddress, zkToken.deriveTokenId())
    const reserveOut = Mina.getBalance(zkPoolAddress)
    const amountIn = UInt64.from(1.3 * 10 ** 9)

    const balanceMin = reserveOut.sub(reserveOut.div(100))
    const balanceMax = reserveIn.add(reserveIn.div(100))

    const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn))
    const optimalOut = mulDiv(reserveOut, amountIn, reserveIn.add(amountIn))

    const minOut = optimalOut.sub(optimalOut.div(50)) // 2 % dif

    const balBefore = Mina.getBalance(senderAccount, zkToken.deriveTokenId())

    const userMinaBalBefore = Mina.getBalance(senderAccount)

    const txn2 = await Mina.transaction(senderAccount, async () => {
      await zkPool.swapFromTokenToMina(bobAccount, UInt64.from(5), amountIn, UInt64.from(1), balanceMax, balanceMin)
    })
    console.log("swap from token", txn2.toPretty())
    console.log("swap from token au", txn2.transaction.accountUpdates.length)
    await txn2.prove()
    await txn2.sign([senderKey]).send()

    /* const userMinaBalAfter = Mina.getBalance(senderAccount);

     console.log('optimal out', optimalOut.toBigInt());
     console.log('minimal out', minOut.toBigInt());
     console.log('expected out', expectedOut.toBigInt());
     console.log('received', userMinaBalAfter.sub(userMinaBalBefore).toBigInt());*/

    // const resIN = reserveIn.add(amountIn);
    // const resOut = reserveOut.sub(expectedOut);

    // const reserveIn2 = Mina.getBalance(zkPoolAddress, zkToken0.deriveTokenId());
    // const reserveOut2 = Mina.getBalance(zkPoolAddress, zkToken0.deriveTokenId());
    // expect(reserveIn2.value).toEqual(resIN.value);
    // expect(reserveOut2.value).toEqual(resOut.value);

    const balAfter = Mina.getBalance(senderAccount, zkToken.deriveTokenId())
    expect(balAfter.value).toEqual(balBefore.sub(amountIn).value)
  })

  it("signature expired", async () => {
    const newFacKey = PrivateKey.random()
    const newFac = new PoolFactory(newFacKey.toPublicKey())

    const root = merkle.getRoot()

    const time = UInt32.from(1)
    console.log("signature time", time)

    Local.setGlobalSlot(2)
    const info = new UpdateSignerData({ oldRoot: Field.empty(), newRoot: root, deadlineSlot: UInt32.from(time) })

    const signBob = Signature.create(bobKey, info.toFields())
    const signAlice = Signature.create(aliceKey, info.toFields())
    const signDylan = Signature.create(senderAccount.key, info.toFields())

    const multi = new MultisigInfo({
      approvedUpgrader: root,
      messageHash: info.hash(),
      deadlineSlot: UInt32.from(time)
    })
    const infoBob = new SignatureInfo({
      user: bobPublic,
      witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())),
      signature: signBob,
      right: allRight
    })
    const infoAlice = new SignatureInfo({
      user: alicePublic,
      witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())),
      signature: signAlice,
      right: allRight
    })
    const infoDylan = new SignatureInfo({
      user: senderPublic,
      witness: merkle.getWitness(Poseidon.hash(senderPublic.toFields())),
      signature: signDylan,
      right: allRight
    })
    const array = [infoBob, infoAlice, infoDylan]

    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1)
      await newFac.deploy({
        symbol: "FAC",
        signatures: array,
        multisigInfo: multi,
        src: "https://luminadex.com/",
        protocol: aliceAccount,
        delegator: dylanAccount,
        approvedSigner: root
      })
    })
    console.log("signature expired txn", txn.toPretty())
    await txn.prove()
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await expect(txn.sign([deployerKey, newFacKey]).send()).rejects.toThrow()
  })

  async function mintToken(user: PublicKey) {
    // token are minted to original deployer, so just transfer it for test
    let txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1)
      await zkToken.mint(user, UInt64.from(1000 * 10 ** 9))
    })
    await txn.prove()
    await txn.sign([deployerKey, zkTokenPrivateKey]).send()

    txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1)
      await zkToken.mint(deployerAccount, UInt64.from(1000 * 10 ** 9))
    })
    await txn.prove()
    await txn.sign([deployerKey, zkTokenPrivateKey]).send()
  }

  function getSlotFromTimestamp(date: number) {
    const { genesisTimestamp, slotTime } = Mina.activeInstance.getNetworkConstants()
    let slotCalculated = UInt64.from(date)
    slotCalculated = (slotCalculated.sub(genesisTimestamp)).div(slotTime)
    Provable.log("slotCalculated64", slotCalculated)
    return slotCalculated.toUInt32()
  }
})
