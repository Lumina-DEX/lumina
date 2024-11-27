import fs from "fs/promises"
import {
  AccountUpdate,
  Bool,
  Cache,
  fetchAccount,
  Field,
  Mina,
  NetworkId,
  PrivateKey,
  PublicKey,
  SmartContract,
  UInt64,
  UInt8,
} from "o1js"
import path from "path"
import readline from "readline/promises"
import {
  Faucet,
  FungibleToken,
  FungibleTokenAdmin,
  mulDiv,
  Pool,
  PoolData,
  PoolFactory,
  PoolTokenHolder,
} from "../index.js"

// node build/src/verificationKey.js

// get contract vk
await PoolData.compile()
await PoolFactory.compile()
const poolKey = await Pool.compile()
await FungibleToken.compile()
await FungibleTokenAdmin.compile()
const poolTokenHolderKey = await PoolTokenHolder.compile()

console.log("pool key", poolKey)
console.log("pool key hash", poolKey.verificationKey.hash.toBigInt())
console.log("pool token holder", poolTokenHolderKey)
console.log("pool token holder hash", poolTokenHolderKey.verificationKey.hash.toBigInt())
