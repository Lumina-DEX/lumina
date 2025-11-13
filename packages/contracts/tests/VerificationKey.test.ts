import { Cache, Field, Mina } from "o1js"
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
    const network = Mina.Network({
      networkId: "mainnet",
      mina: "https://api.minascan.io/node/mainnet/v1/graphql"
    })
    Mina.setActiveInstance(network)

    await FungibleTokenAdmin.compile()
    await FungibleToken.compile()
    const vkFactory = await PoolFactory.compile()
    expect(vkFactory.verificationKey.hash).toEqual(
      Field(21955258744905199326476551523512075073823567754306600871892901345442326387142n)
    )
  }, 600000)
})
