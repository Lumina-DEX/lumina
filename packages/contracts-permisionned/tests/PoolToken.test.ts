import { MerkleTree, Poseidon, PublicKey, Signature } from "o1js"
import { AccountUpdate, Bool, Mina, PrivateKey, UInt64, UInt8 } from "o1js"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import {
  FungibleToken,
  FungibleTokenAdmin,
  mulDiv,
  Pool,
  PoolFactory,
  PoolTokenHolder,
  SignerMerkleWitness
} from "../dist"

const proofsEnabled = false

describe("Pool Factory Token", () => {
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
    const Local = await Mina.LocalBlockchain({ proofsEnabled, enforceTransactionLimits: false })
    Mina.setActiveInstance(Local)
    ;[deployerAccount, senderAccount, bobAccount, aliceAccount, dylanAccount] = Local.testAccounts
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

    // mint token to user
    await mintToken(senderAccount)
  })

  it("add first liquidity", async () => {
    let amt = UInt64.from(10 * 10 ** 9)
    let amtToken = UInt64.from(50 * 10 ** 9)
    let txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkPool.supplyFirstLiquiditiesToken(amt, amtToken)
    })
    console.log("supplyFirstLiquidities", txn.toPretty())
    console.log("supplyFirstLiquidities au", txn.transaction.accountUpdates.length)
    await txn.prove()
    await txn.sign([senderKey]).send()

    /* const liquidityUser = Mina.getBalance(senderAccount, zkPool.deriveTokenId());
     const expected = amt.value.add(amtToken.value).sub(PoolMina.minimunLiquidity.value);
     console.log("liquidity user", liquidityUser.toString());
     expect(liquidityUser.value).toEqual(expected);*/

    const balanceToken = Mina.getBalance(zkPoolAddress, zkToken0.deriveTokenId())
    expect(balanceToken.value).toEqual(amt.value)

    const balanceMina = Mina.getBalance(zkPoolAddress, zkToken1.deriveTokenId())
    expect(balanceMina.value).toEqual(amtToken.value)
  })

  it("generate different key", async () => {
    const newKey = PrivateKey.randomKeypair()

    const fields = zkTokenAddress0.toFields().concat(zkTokenAddress1.toFields())
    const hash = Poseidon.hashToGroup(fields)
    const publicKey = PublicKey.fromGroup(hash)
    console.log("publickey", publicKey.toBase58())
    const fields2 = zkTokenAddress0.toFields().concat(newKey.publicKey.toFields())
    const hash2 = Poseidon.hashToGroup(fields2)
    const publicKey2 = PublicKey.fromGroup(hash2)
    console.log("publicKey2", publicKey2.toBase58())
    const fields3 = newKey.publicKey.toFields().concat(zkTokenAddress1.toFields())
    const hash3 = Poseidon.hashToGroup(fields3)
    const publicKey3 = PublicKey.fromGroup(hash3)
    console.log("publicKey3", publicKey3.toBase58())

    expect(publicKey.toBase58()).not.toEqual(publicKey2)
    expect(publicKey2.toBase58()).not.toEqual(publicKey3)
  })

  it("Transfer liquidity", async () => {
    let amt = UInt64.from(10 * 10 ** 9)
    let amtToken = UInt64.from(50 * 10 ** 9)
    let txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkPool.supplyFirstLiquiditiesToken(amt, amtToken)
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
    let amt = UInt64.from(10 * 10 ** 9)
    let amtToken = UInt64.from(50 * 10 ** 9)
    let txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkPool.supplyFirstLiquiditiesToken(amt, amtToken)
    })
    console.log("supplyFirstLiquidities", txn.toPretty())
    await txn.prove()
    await txn.sign([senderKey]).send()

    const minaUserAfterDeposit = Mina.getBalance(senderAccount)
    const expectedMina = minaUser.sub(amt)
    // expect(minaUserAfterDeposit.value).toEqual(expectedMina.value);
    console.log("mina after deposit", minaUserAfterDeposit.toBigInt())

    const liquidityUser = Mina.getBalance(senderAccount, zkPool.deriveTokenId())
    // const expected = amt.value.add(amtToken.value).sub(MINIMUM_LIQUIDITY.value);

    const supply = await Mina.getBalance(zkPoolAddress, zkPool.deriveTokenId())

    const balPool0 = await Mina.getBalance(zkPoolAddress, zkToken0.deriveTokenId())
    console.log("bal pool 0", balPool0.toBigInt())

    const liquityOut = UInt64.from(1 * 10 ** 9)
    const amountMinaOut = mulDiv(liquityOut, amt, supply)
    const amountTokenOut = mulDiv(liquityOut, amtToken, supply)
    txn = await Mina.transaction(senderAccount, async () => {
      await tokenHolder.withdrawLiquidityToken(liquityOut, amountMinaOut, amountTokenOut, amt, amtToken, supply)
      await zkToken0.approveAccountUpdate(tokenHolder.self)
      // await zkToken1.approveAccountUpdate(tokenHolder.self);
    })
    console.log("Withdraw liquidity", txn.toPretty())
    console.log("Withdraw liquidity au", txn.transaction.accountUpdates.length)

    await txn.prove()
    await txn.sign([senderKey]).send()

    const minaUserAfter = Mina.getBalance(senderAccount)
    console.log("mina after", minaUserAfter.toBigInt())
  })

  it("add second liquidity", async () => {
    let amt = UInt64.from(10 * 10 ** 9)
    let amtToken = UInt64.from(50 * 10 ** 9)
    let txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkPool.supplyFirstLiquiditiesToken(amt, amtToken)
    })
    console.log("createPool au", txn.transaction.accountUpdates.length)
    await txn.prove()
    await txn.sign([senderKey]).send()

    let liquidityUser = Mina.getBalance(senderAccount, zkPool.deriveTokenId())
    const expected = amt.value.add(amtToken.value).sub(Pool.minimumLiquidity.value)
    const totalLiquidity = Mina.getBalance(zkPoolAddress, zkPool.deriveTokenId())
    console.log("liquidity user", liquidityUser.toString())
    expect(liquidityUser.value).toEqual(expected)

    let amtMina = UInt64.from(1 * 10 ** 9)
    let amtToken2 = UInt64.from(5 * 10 ** 9)
    txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1)
      await zkPool.supplyLiquidityToken(amtMina, amtToken2, amt, amtToken, totalLiquidity)
    })
    console.log("add liquidity from mina", txn.toPretty())
    console.log("add liquidity from mina au", txn.transaction.accountUpdates.length)
    await txn.prove()
    await txn.sign([deployerKey]).send()
    const liquidityOut = mulDiv(amtMina, totalLiquidity, amt)
    liquidityUser = Mina.getBalance(deployerAccount, zkPool.deriveTokenId())
    expect(liquidityUser.value).toEqual(liquidityOut.value)
    console.log("liquidity deployer", liquidityUser.toString())
  })

  it("swap from token", async () => {
    let amt = UInt64.from(10 * 10 ** 9)
    let amtToken = UInt64.from(50 * 10 ** 9)
    let txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkPool.supplyFirstLiquiditiesToken(amt, amtToken)
    })
    await txn.prove()
    await txn.sign([senderKey]).send()

    const reserveIn = Mina.getBalance(zkPoolAddress, zkToken1.deriveTokenId())
    const reserveOut = Mina.getBalance(zkPoolAddress, zkToken0.deriveTokenId())
    let amountIn = UInt64.from(1.3 * 10 ** 9)

    console.log("current bal in", reserveIn.toBigInt())

    const balanceMin = reserveOut.sub(reserveOut.div(100))
    const balanceMax = reserveIn.add(reserveIn.div(100))

    const expectedOut = mulDiv(balanceMin, amountIn, balanceMax.add(amountIn))
    const optimalOut = mulDiv(reserveOut, amountIn, reserveIn.add(amountIn))

    const minOut = optimalOut.sub(optimalOut.div(50)) // 2 % dif

    const balBefore = Mina.getBalance(senderAccount, zkToken0.deriveTokenId())

    const userMinaBalBefore = Mina.getBalance(senderAccount)

    const txn2 = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await tokenHolder.swapFromTokenToToken(
        senderAccount,
        UInt64.from(5),
        amountIn,
        UInt64.from(1),
        balanceMax,
        balanceMin
      )
      await zkToken0.approveAccountUpdate(tokenHolder.self)
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

    // const balAfter = Mina.getBalance(senderAccount, zkToken0.deriveTokenId());
    // expect(balAfter.value).toEqual(balBefore.sub(amountIn).value);
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
      await zkToken0.mint(deployerAccount, UInt64.from(1000 * 10 ** 9))
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
      await zkToken1.mint(deployerAccount, UInt64.from(1000 * 10 ** 9))
    })
    await txn.prove()
    await txn.sign([deployerKey, zkTokenPrivateKey1]).send()
  }
})
