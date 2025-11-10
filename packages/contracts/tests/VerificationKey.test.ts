import { Cache, Mina } from "o1js"
import { describe, expect, it } from "vitest"

import {
  FungibleToken,
  FungibleTokenAdmin,
  Pool,
  PoolFactory,
  PoolTokenHolder
} from "../dist"
import { poolHashTestnet, poolTokenHolderHashTestnet } from "../src/pool/VerificationKey"

const cache = { cache: Cache.FileSystemDefault, forceRecompile: true }

describe("Check verification key", () => {
  it("has a valid verification key", async () => {
    const Local = await Mina.LocalBlockchain()
    Mina.setActiveInstance(Local)

    await FungibleTokenAdmin.compile(cache)
    await FungibleToken.compile(cache)
    const vkFactory = await PoolFactory.compile(cache)
    expect(vkFactory.verificationKey.hash.toBigInt()).toEqual(
      21155315920244513361696679354690742153476743044380974966337181307650568441726n
    )
    const vkPool = await Pool.compile(cache)
    expect(vkPool.verificationKey.hash.toBigInt()).toEqual(poolHashTestnet.toBigInt())
    const vkPoolHolder = await PoolTokenHolder.compile(cache)
    expect(vkPoolHolder.verificationKey.hash.toBigInt()).toEqual(poolTokenHolderHashTestnet.toBigInt())
  }, 600000)
})
