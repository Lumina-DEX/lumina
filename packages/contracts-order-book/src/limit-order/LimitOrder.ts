import { FungibleToken } from "mina-fungible-token"
import {
  AccountUpdate,
  Field,
  MerkleMap,
  MerkleMapWitness,
  method,
  Poseidon,
  Provable,
  PublicKey,
  SmartContract,
  State,
  state,
  Struct,
  TokenId,
  UInt32,
  UInt64
} from "o1js"
import { AddOrder } from "./OrderDeposit"

/**
 * Test code don't use it in production
 */
export class LimitOrder extends SmartContract {
  @state(PublicKey)
  depositContract = State<PublicKey>()

  events = {}

  async init() {
    await super.init()
  }

  @method
  async executeOrder(orderA: AddOrder, orderB: AddOrder, witnessA: MerkleMapWitness, witnessB: MerkleMapWitness) {
    // don't use it in prod we don't verify if order already fullfilled
    // const merkleOrder = this.merkleOrder.getAndRequireEquals()
    // as example we don
    const hashA = orderA.hash()
    const hashB = orderB.hash()

    // match the order token
    orderA.tokenBuy.assertEquals(orderB.tokenSell)
    orderA.tokenSell.assertEquals(orderB.tokenBuy)

    // for example just perfect matching orders
    const priceA = orderA.amountSell.div(orderA.amountBuy)
    const priceB = orderB.amountBuy.div(orderA.amountSell)
    priceB.assertEquals(priceA)
    orderA.amountBuy.assertEquals(orderB.amountSell)
  }
}
