import { PublicKey } from "o1js"
import { AccountUpdate, Bool, Mina, PrivateKey, UInt64, UInt8 } from "o1js"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import { FungibleToken, FungibleTokenAdmin, Pool, PoolData, PoolFactory, PoolTokenHolder } from "../dist"

const proofsEnabled = false

describe("Pool Factory Mina", () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    bobAccount: Mina.TestPublicKey,
    bobKey: PrivateKey,
    aliceAccount: Mina.TestPublicKey,
    dylanAccount: Mina.TestPublicKey,
    aliceKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: PoolFactory,
    zkPoolAddress: PublicKey,
    zkPoolPrivateKey: PrivateKey,
    zkPool: Pool,
    zkPoolDataAddress: PublicKey,
    zkPoolDataPrivateKey: PrivateKey,
    zkPoolData: PoolData,
    zkTokenAdminAddress: PublicKey,
    zkTokenAdminPrivateKey: PrivateKey,
    zkTokenAdmin: FungibleTokenAdmin,
    zkTokenAddress: PublicKey,
    zkTokenPrivateKey: PrivateKey,
    zkToken: FungibleToken,
    tokenHolder: PoolTokenHolder

  beforeAll(async () => {
    const analyze = await Pool.analyzeMethods()
    getGates(analyze)

    if (proofsEnabled) {
      console.time("compile pool")
      await FungibleTokenAdmin.compile()
      await FungibleToken.compile()
      await PoolData.compile()
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
    const Local = await Mina.LocalBlockchain({ proofsEnabled })
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

    zkPoolDataPrivateKey = PrivateKey.random()
    zkPoolDataAddress = zkPoolDataPrivateKey.toPublicKey()
    zkPoolData = new PoolData(zkPoolDataAddress)

    zkTokenPrivateKey = PrivateKey.random()
    zkTokenAddress = zkTokenPrivateKey.toPublicKey()
    zkToken = new FungibleToken(zkTokenAddress)

    tokenHolder = new PoolTokenHolder(zkPoolAddress, zkToken.deriveTokenId())

    const txn0 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1)
      await zkPoolData.deploy({
        owner: bobAccount,
        protocol: aliceAccount,
        delegator: dylanAccount
      })
    })
    await txn0.prove()
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn0.sign([deployerKey, zkPoolDataPrivateKey]).send()

    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4)
      await zkApp.deploy({ symbol: "FAC", src: "https://luminadex.com/", poolData: zkPoolDataAddress })
      await zkTokenAdmin.deploy({
        adminPublicKey: deployerAccount
      })
      await zkToken.deploy({
        symbol: "LTA",
        src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts"
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

    const txn3 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4)
      await zkApp.createPool(zkPoolAddress, zkTokenAddress)
    })

    console.log("Pool creation au", txn3.transaction.accountUpdates.length)
    await txn3.prove()
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn3.sign([deployerKey, zkPoolPrivateKey]).send()

    // mint token to user
    await mintToken(senderAccount)
  })

  it("deploy a second pool", async () => {
    const newTokenKey = PrivateKey.random()

    const zkTokenNew = new FungibleToken(newTokenKey.toPublicKey())

    const txn0 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 2)
      await zkTokenNew.deploy({
        symbol: "TWO",
        src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts"
      })
      await zkTokenNew.initialize(
        zkTokenAdminAddress,
        UInt8.from(9),
        Bool(false)
      )
    })
    await txn0.prove()
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn0.sign([deployerKey, newTokenKey]).send()

    const newPoolKey = PrivateKey.random()
    const txn1 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4)
      await zkApp.createPool(newPoolKey.toPublicKey(), newTokenKey.toPublicKey())
    })
    await txn1.prove()
    await txn1.sign([deployerKey, newPoolKey]).send()
    const newPool = new Pool(newPoolKey.toPublicKey())

    const txn2 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1)
      await zkTokenNew.mint(senderAccount, UInt64.from(1000 * 10 ** 9))
    })
    await txn2.prove()
    await txn2.sign([deployerKey, newTokenKey]).send()

    const amt = UInt64.from(10 * 10 ** 9)
    const amtToken = UInt64.from(50 * 10 ** 9)
    const txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await newPool.supplyFirstLiquidities(amt, amtToken)
    })
    console.log("supplyFirstLiquidities", txn.toPretty())
    console.log("supplyFirstLiquidities au", txn.transaction.accountUpdates.length)
    await txn.prove()
    await txn.sign([senderKey]).send()

    const liquidityUser = Mina.getBalance(senderAccount, newPool.deriveTokenId())
    const expected = amt.value.add(amtToken.value).sub(Pool.minimunLiquidity.value)
    console.log("liquidity user", liquidityUser.toString())
    expect(liquidityUser.value).toEqual(expected)

    const balanceToken = Mina.getBalance(newPool.address, zkTokenNew.deriveTokenId())
    expect(balanceToken.value).toEqual(amtToken.value)

    const balanceMina = Mina.getBalance(newPool.address)
    expect(balanceMina.value).toEqual(amt.value)
  })

  it("failed deploy for same token", async () => {
    const newPoolKey = PrivateKey.random()
    const txn1 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4)
      await zkApp.createPool(newPoolKey.toPublicKey(), zkTokenAddress)
    })
    await txn1.prove()
    await expect(txn1.sign([deployerKey, newPoolKey]).send()).rejects.toThrow()
  })

  it("failed directly deploy a pool", async () => {
    const newPoolKey = PrivateKey.random()
    const newPool = new Pool(newPoolKey.toPublicKey())
    await expect(Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1)
      await newPool.deploy()
    })).rejects.toThrow()
  })

  it("cant transfer circulation supply", async () => {
    const amt = UInt64.from(10 * 10 ** 9)
    const amtToken = UInt64.from(50 * 10 ** 9)
    let txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkPool.supplyFirstLiquidities(amt, amtToken)
    })
    await txn.prove()
    await txn.sign([senderKey]).send()

    await expect(Mina.transaction(senderAccount, async () => {
      await zkPool.transfer(zkPoolAddress, senderAccount, UInt64.from(1000))
    })).rejects.toThrow()

    txn = await Mina.transaction(senderAccount, async () => {
      await zkPool.send({ to: senderAccount, amount: UInt64.from(1000) })
      await zkPool.approveAccountUpdate(zkPool.self)
    })
    console.log("transfer", txn.toPretty())
    await txn.prove()
    await expect(txn.sign([senderKey, zkPoolPrivateKey]).send()).rejects.toThrow()

    await expect(Mina.transaction(senderAccount, async () => {
      const poolAccount = AccountUpdate.create(zkPoolAddress, zkPool.deriveTokenId())
      const userAccount = AccountUpdate.create(senderAccount, zkPool.deriveTokenId())
      poolAccount.balance.subInPlace(1000)
      userAccount.balance.addInPlace(1000)
      await zkPool.approveAccountUpdates([poolAccount, userAccount])
    })).rejects.toThrow()
  })

  it("cant transfer factory circulation supply", async () => {
    await expect(Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkApp.transfer(zkTokenAddress, bobAccount, UInt64.one)
    })).rejects.toThrow()

    await expect(Mina.transaction(senderAccount, async () => {
      const poolAccount = AccountUpdate.create(zkTokenAddress, zkPool.deriveTokenId())
      const userAccount = AccountUpdate.create(senderAccount, zkPool.deriveTokenId())
      poolAccount.balance.subInPlace(1000)
      userAccount.balance.addInPlace(1000)
      await zkApp.approveAccountUpdates([poolAccount, userAccount])
    })).rejects.toThrow()
  })

  it("cant mint token", async () => {
    const txn = await Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkPool.internal.mint({ address: senderAccount, amount: UInt64.one })
      await zkPool.approveAccountUpdate(zkPool.self)
    })
    console.log("txn mint", txn.toPretty())
    await txn.prove()
    await expect(txn.sign([senderKey, zkPoolPrivateKey]).send()).rejects.toThrow()

    await expect(Mina.transaction(senderAccount, async () => {
      AccountUpdate.fundNewAccount(senderAccount, 1)
      await zkApp.internal.mint({ address: senderAccount, amount: UInt64.one })
      await zkApp.approveAccountUpdate(zkApp.self)
    })).rejects.toThrow()
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
})
