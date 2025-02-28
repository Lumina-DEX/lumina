import { fetchAccount, Field, MerkleMap, MerkleTree, Poseidon, PublicKey, Signature } from "o1js"
import { AccountUpdate, Bool, Mina, PrivateKey, UInt64, UInt8 } from "o1js"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import {
  AddOrder,
  FungibleToken,
  FungibleTokenAdmin,
  OrderBook,
  Pool,
  PoolFactory,
  PoolTokenHolder,
  SignerMerkleWitness
} from "../dist"

const proofsEnabled = false

describe("Order book test", () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    bobAccount: Mina.TestPublicKey,
    bobKey: PrivateKey,
    merkle: MerkleTree,
    aliceAccount: Mina.TestPublicKey,
    dylanAccount: Mina.TestPublicKey,
    aliceKey: PrivateKey,
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
    zkOrderAddress: PublicKey,
    zkOrderPrivateKey: PrivateKey,
    zkOrder: OrderBook,
    zkOrderToken: OrderBook

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
      await OrderBook.compile()
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
    // order book will be deploy only on zeko
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

    zkTokenPrivateKey = PrivateKey.random()
    zkTokenAddress = zkTokenPrivateKey.toPublicKey()
    zkToken = new FungibleToken(zkTokenAddress)

    tokenHolder = new PoolTokenHolder(zkPoolAddress, zkToken.deriveTokenId())

    zkOrderPrivateKey = PrivateKey.random()
    zkOrderAddress = zkOrderPrivateKey.toPublicKey()
    zkOrder = new OrderBook(zkOrderAddress)

    zkOrderToken = new OrderBook(zkOrderAddress, zkToken.deriveTokenId())

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
    const witness = merkle.getWitness(0n)
    const circuitWitness = new SignerMerkleWitness(witness)
    const txn3 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4)
      await zkApp.createPool(zkPoolAddress, zkTokenAddress, bobAccount, signature, circuitWitness)
    })

    console.log("Pool creation au", txn3.transaction.accountUpdates.length)
    await txn3.prove()
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn3.sign([deployerKey, zkPoolPrivateKey]).send()

    const txn4 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 2)
      await zkOrder.deploy()
      await zkOrderToken.deploy()
      await zkToken.approveAccountUpdate(zkOrderToken.self)
    })

    console.log("deploy order book", txn4.transaction.accountUpdates.length)
    await txn4.prove()
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn4.sign([deployerKey, zkOrderPrivateKey]).send()

    // mint token to user
    await mintToken(senderAccount)

    const senderBal = Mina.getBalance(senderAccount)
    console.log("senderBal", senderBal.toBigInt())

    let amt = UInt64.from(500 * 10 ** 9)
    let amtToken = UInt64.from(100_000 * 10 ** 9)
    let txn5 = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkPool.supplyFirstLiquidities(amt, amtToken)
    })
    console.log("supplyFirstLiquidities", txn.toPretty())
    console.log("supplyFirstLiquidities au", txn.transaction.accountUpdates.length)
    await txn5.prove()
    await txn5.sign([senderKey]).send()
  })

  it("create order", async () => {
    // bob buy 200 token
    let amtBuy = UInt64.from(200 * 10 ** 9)
    // bob sell 10 mina
    let amtSell = UInt64.from(10 * 10 ** 9)

    const merleMap = new MerkleMap()
    // start at 1
    merleMap.set(Field(0), Field.empty())
    merleMap.set(Field(1), Field.empty())
    let witness = merleMap.getWitness(Field(1))
    let txn = await Mina.transaction(bobAccount, async () => {
      await zkOrder.addOrderMina(amtSell, zkTokenAddress, amtBuy, witness)
    })
    console.log("add order au", txn.transaction.accountUpdates.length)
    await txn.prove()
    await txn.sign([bobKey]).send()

    const orderEvent = new AddOrder({
      sender: bobAccount,
      index: Field(1),
      tokenSell: PublicKey.empty(),
      amountSell: amtSell,
      tokenBuy: zkTokenAddress,
      amountBuy: amtBuy
    })

    merleMap.set(Field(1), orderEvent.hash())
    merleMap.set(Field(2), Field.empty())

    witness = merleMap.getWitness(Field(2))
    const balance = Mina.getBalance(zkPoolAddress)
    const balanceOut = Mina.getBalance(zkPoolAddress, zkToken.deriveTokenId())

    const accountAlice = await fetchAccount({ publicKey: aliceAccount, tokenId: zkToken.deriveTokenId() })
    const balanceAlice = accountAlice.account?.balance?.toBigInt() || 0n
    expect(balanceAlice).toEqual(0n)
    console.log("balance alice", balanceAlice)

    const balanceAliceMina = Mina.getBalance(aliceAccount)
    console.log("balanceAliceMina", balanceAliceMina.toBigInt())

    const orderEventAlice = new AddOrder({
      sender: aliceAccount,
      index: Field(2),
      tokenSell: zkTokenAddress,
      amountSell: amtBuy,
      tokenBuy: PublicKey.empty(),
      amountBuy: amtSell
    })
    merleMap.set(Field(2), orderEventAlice.hash())
    const witness1 = merleMap.getWitness(Field(1))
    const witness2 = merleMap.getWitness(Field(2))
    const actualRoot = merkle.getRoot()
    console.log("root offchain", actualRoot.toBigInt())

    txn = await Mina.transaction(aliceAccount, async () => {
      AccountUpdate.fundNewAccount(aliceAccount, 1)
      // create invert order of bob
      await tokenHolder.swapFromMinaToToken(senderAccount, UInt64.from(5), amtSell, amtBuy.add(2), balance, balanceOut)
      await zkToken.approveAccountUpdate(tokenHolder.self)
      await zkOrder.addOrder(zkTokenAddress, amtBuy, PublicKey.empty(), amtSell, witness)
      // await zkOrder.matchOrder(orderEvent, orderEventAlice, witness1, witness2)
    })
    console.log("swap order au", txn.toPretty())
    await txn.prove()
    await txn.sign([aliceKey]).send()

    const balanceAliceAfter = Mina.getBalance(aliceAccount, zkToken.deriveTokenId())
    console.log("balance alice after", balanceAliceAfter.toBigInt())
    expect(balanceAliceAfter.greaterThan(UInt64.zero)).toEqual(Bool(true))

    const balanceAliceMinaAfter = Mina.getBalance(aliceAccount)
    console.log("balanceAliceMinaAfter", balanceAliceMinaAfter.toBigInt())
  })

  async function mintToken(user: PublicKey) {
    // token are minted to original deployer, so just transfer it for test
    let txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1)
      await zkToken.mint(user, UInt64.from(1_000_000 * 10 ** 9))
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
})
