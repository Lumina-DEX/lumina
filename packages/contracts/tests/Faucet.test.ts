import { FungibleToken, FungibleTokenAdmin } from "mina-fungible-token"
import { AccountUpdate, Bool, fetchAccount, Mina, PrivateKey, PublicKey, UInt64, UInt8 } from "o1js"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"
import { Faucet } from "../build/src/index"

let proofsEnabled = false

describe("Faucet", () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    bobAccount: Mina.TestPublicKey,
    bobKey: PrivateKey,
    aliceAccount: Mina.TestPublicKey,
    aliceKey: PrivateKey,
    zkTokenAdminAddress: PublicKey,
    zkTokenAdminPrivateKey: PrivateKey,
    zkTokenAdmin: FungibleTokenAdmin,
    zkTokenAddress: PublicKey,
    zkTokenPrivateKey: PrivateKey,
    zkToken: FungibleToken,
    zkFaucetAddress: PublicKey,
    zkFaucetPrivateKey: PrivateKey,
    zkFaucet: Faucet

  beforeAll(async () => {
    // const analyze = await Faucet.analyzeMethods();
    // getGates(analyze);

    if (proofsEnabled) {
      console.time("compile faucet")
      await FungibleTokenAdmin.compile()
      await FungibleToken.compile()
      await Faucet.compile()
      console.timeEnd("compile faucet")
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
    ;[deployerAccount, senderAccount, bobAccount, aliceAccount] = Local.testAccounts
    deployerKey = deployerAccount.key
    senderKey = senderAccount.key
    bobKey = bobAccount.key
    aliceKey = aliceAccount.key

    zkFaucetPrivateKey = PrivateKey.random()
    zkFaucetAddress = zkFaucetPrivateKey.toPublicKey()

    zkTokenAdminPrivateKey = PrivateKey.random()
    zkTokenAdminAddress = zkTokenAdminPrivateKey.toPublicKey()
    zkTokenAdmin = new FungibleTokenAdmin(zkTokenAdminAddress)

    zkTokenPrivateKey = PrivateKey.random()
    zkTokenAddress = zkTokenPrivateKey.toPublicKey()
    zkToken = new FungibleToken(zkTokenAddress)

    zkFaucet = new Faucet(zkFaucetAddress, zkToken.deriveTokenId())
    console.log(zkFaucet)
    const faucetAmount = UInt64.from(100 * 10 ** 9)

    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 3)
      await zkTokenAdmin.deploy({
        adminPublicKey: deployerAccount,
      })
      await zkToken.deploy({
        symbol: "FAU",
        src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
      })
      await zkToken.initialize(
        zkTokenAdminAddress,
        UInt8.from(9),
        Bool(false),
      )
    })
    await txn.prove()
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkFaucetPrivateKey, zkTokenAdminPrivateKey, zkTokenPrivateKey]).send()

    const txn2 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1)
      await zkFaucet.deploy({ token: zkTokenAddress, amount: faucetAmount })
      await zkToken.approveAccountUpdate(zkFaucet.self)
    })
    await txn2.prove()
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn2.sign([deployerKey, zkFaucetPrivateKey]).send()
  })

  it("claim faucet", async () => {
    let amt = UInt64.from(1000 * 10 ** 9)
    let txn = await Mina.transaction(senderAccount, async () => {
      await zkToken.mint(zkFaucetAddress, amt)
    })
    await txn.prove()
    await txn.sign([senderKey, deployerKey]).send()

    txn = await Mina.transaction(bobAccount, async () => {
      AccountUpdate.fundNewAccount(bobAccount, 2)
      await zkFaucet.claim()
      await zkToken.approveAccountUpdate(zkFaucet.self)
    })
    console.log("claim faucet", txn.toPretty())
    await txn.prove()
    await txn.sign([bobKey]).send()

    const faucetAmount = UInt64.from(100 * 10 ** 9)
    let balanceBob = Mina.getBalance(bobAccount, zkToken.deriveTokenId())
    expect(balanceBob.value).toEqual(faucetAmount.value)

    txn = await Mina.transaction(bobAccount, async () => {
      await zkFaucet.claim()
      await zkToken.approveAccountUpdate(zkFaucet.self)
    })
    console.log("claim faucet 2", txn.toPretty())
    await txn.prove()
    await expect(txn.sign([bobKey]).send()).rejects.toThrow()
  })
})
