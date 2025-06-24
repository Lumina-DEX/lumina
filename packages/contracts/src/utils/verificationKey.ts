import { PoolFactory } from "../indexfactory.js"
import { FungibleToken, FungibleTokenAdmin, Pool, PoolTokenHolder } from "../indexpool.js"

// node dist/utils/verificationKey.js

// get contract vk
await PoolFactory.compile()
const poolKey = await Pool.compile()
await FungibleToken.compile()
await FungibleTokenAdmin.compile()
const poolTokenHolderKey = await PoolTokenHolder.compile()

console.log("pool key", poolKey.verificationKey.data)
console.log("pool key hash", poolKey.verificationKey.hash.toBigInt())
console.log("pool token holder", poolTokenHolderKey.verificationKey.data)
console.log("pool token holder hash", poolTokenHolderKey.verificationKey.hash.toBigInt())
