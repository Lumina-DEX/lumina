import { Mina } from "o1js"
import { describe, expect, it } from "vitest"

import {
  contractHash,
  contractHolderHash,
  FungibleToken,
  FungibleTokenAdmin,
  Pool,
  PoolFactory,
  PoolTokenHolder
} from "../dist"

describe("Check verification key", () => {
  it("check compile the good vk", async () => {
    const Local = await Mina.LocalBlockchain()
    Mina.setActiveInstance(Local)

    await FungibleTokenAdmin.compile()
    await FungibleToken.compile()
    const vkFactory = await PoolFactory.compile()
    expect(vkFactory.verificationKey.hash.toBigInt()).toEqual(
      27167892114307946311220801481226808399786469908061512252307744174796385756329n
    )
    const vkPool = await Pool.compile()
    expect(vkPool.verificationKey.hash.toBigInt()).toEqual(contractHash.toBigInt())
    const vkPoolHolder = await PoolTokenHolder.compile()
    expect(vkPoolHolder.verificationKey.hash.toBigInt()).toEqual(contractHolderHash.toBigInt())
  }, 600000)
})
