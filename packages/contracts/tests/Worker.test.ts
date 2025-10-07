import { allRight, FungibleToken, FungibleTokenAdmin, PoolFactory } from "@lumina-dex/contracts"
import { luminadexFactories } from "@lumina-dex/sdk"
import { and, eq, TransactionRollbackError } from "drizzle-orm"
import {
  AccountUpdate,
  Cache,
  Encoding,
  Encryption,
  fetchAccount,
  Field,
  initializeBindings,
  Mina,
  PrivateKey,
  Provable,
  PublicKey
} from "o1js"
import { beforeAll, describe, expect, it } from "vitest"
import { GreaterThanOne } from "./GreaterThanOne"

describe("Worker", () => {
  let deployerAccount: Mina.TestPublicKey,
    senderAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    zkGreaterAddress: PublicKey,
    zkGreaterPrivateKey: PrivateKey,
    zkGreater: GreaterThanOne,
    Local: any

  beforeAll(async () => {
    console.time("compile contract")
    await GreaterThanOne.compile()
    console.timeEnd("compile contract")

    zkGreaterPrivateKey = PrivateKey.random()
    zkGreaterAddress = zkGreaterPrivateKey.toPublicKey()
    zkGreater = new GreaterThanOne(zkGreaterAddress)

    Local = await Mina.LocalBlockchain({ proofsEnabled: true })
    Mina.setActiveInstance(Local)
    ;[deployerAccount, senderAccount] = Local.testAccounts
    deployerKey = deployerAccount.key

    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1)
      await zkGreater.deploy()
    })

    await txn.prove()
    await txn.sign([deployerKey, zkGreaterPrivateKey]).send()
  })

  it("parrallel proof", async () => {
    const txn = await Mina.transaction(deployerAccount, async () => {
      await zkGreater.verifyGreaterThanOne(Field(2))
    })
  }, 300000)
})
