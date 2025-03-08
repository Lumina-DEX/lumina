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

export class AddOrder extends Struct({
  sender: PublicKey,
  index: Field,
  tokenSell: PublicKey,
  amountSell: UInt64,
  tokenBuy: PublicKey,
  amountBuy: UInt64
}) {
  constructor(value: {
    sender: PublicKey
    index: Field
    tokenSell: PublicKey
    amountSell: UInt64
    tokenBuy: PublicKey
    amountBuy: UInt64
  }) {
    super(value)
  }

  hash(): Field {
    return Poseidon.hash(
      this.sender.toFields()
        .concat(
          this.index.toFields()
            .concat(
              this.tokenSell.toFields()
                .concat(
                  this.amountSell.toFields()
                    .concat(
                      this.tokenBuy.toFields()
                        .concat(this.amountBuy.toFields())
                    )
                )
            )
        )
    )
  }
}

export class UpdatedOrder extends Struct({
  orderKey: Field,
  amountFilled: UInt64,
  status: UInt32
}) {
  constructor(value: {
    orderKey: Field
    amountFilled: UInt64
    status: UInt32
  }) {
    super(value)
  }

  hash(): Field {
    return Poseidon.hash(
      this.orderKey.toFields()
        .concat(
          this.amountFilled.toFields()
            .concat(
              this.status.toFields()
            )
        )
    )
  }

  static end(): UInt32 {
    return UInt32.from(1)
  }

  static partial(): UInt32 {
    return UInt32.from(2)
  }

  static cancelled(): UInt32 {
    return UInt32.from(3)
  }
}

/**
 * Test code don't use it in production
 */
export class OrderBook extends SmartContract {
  @state(Field)
  merkleOrder = State<Field>()
  @state(Field)
  merkleFillOrder = State<Field>()
  @state(Field)
  indexOrder = State<Field>()
  @state(Field)
  indexFillOrder = State<Field>()

  events = {
    addOrder: AddOrder
  }

  async init() {
    await super.init()

    const merleMap = new MerkleMap()
    // start at 1
    merleMap.set(Field(0), Field.empty())
    merleMap.set(Field(1), Field.empty())
    this.merkleOrder.set(merleMap.getRoot())
  }

  @method
  async addOrder(
    tokenSell: PublicKey,
    amountSell: UInt64,
    tokenBuy: PublicKey,
    amountBuy: UInt64,
    witness: MerkleMapWitness
  ) {
    const indexOrder = this.indexOrder.getAndRequireEquals()
    const merkleOrder = this.merkleOrder.getAndRequireEquals()

    // we start from the next key who are supposed to be empty
    const empty = Field.empty()
    const newKey = indexOrder.add(1)
    const [witnessRootBefore, witnessKey] = witness.computeRootAndKey(empty)
    witnessRootBefore.assertEquals(merkleOrder, "Witness incorrect")
    witnessKey.assertEquals(newKey, "Witness incorrect")

    const sender = this.sender.getAndRequireSignature()

    // send token to the order book
    const tokenContract = new FungibleToken(tokenSell)
    await tokenContract.transfer(sender, this.address, amountSell)

    const orderEvent = new AddOrder({ sender, index: newKey, tokenSell, amountSell, tokenBuy, amountBuy })

    const [witnessRootAfter, valKey] = witness.computeRootAndKey(orderEvent.hash())

    this.merkleOrder.set(witnessRootAfter)
    this.indexOrder.set(newKey)

    this.emitEvent("addOrder", orderEvent)
  }

  @method
  async addOrderMina(
    amountSell: UInt64,
    tokenBuy: PublicKey,
    amountBuy: UInt64,
    witness: MerkleMapWitness
  ) {
    const indexOrder = this.indexOrder.getAndRequireEquals()
    const merkleOrder = this.merkleOrder.getAndRequireEquals()

    // we start from the next key who are supposed to be empty
    const empty = Field.empty()
    const newKey = indexOrder.add(1)
    const [witnessRootBefore, witnessKey] = witness.computeRootAndKey(empty)
    witnessRootBefore.assertEquals(merkleOrder, "Witness incorrect")
    witnessKey.assertEquals(newKey, "Witness incorrect")

    const sender = this.sender.getAndRequireSignature()

    // send token to the order book
    const accSender = AccountUpdate.createSigned(sender)
    accSender.send({ to: this.address, amount: amountSell })

    // use empty key for mina
    const orderEvent = new AddOrder({
      sender,
      index: newKey,
      tokenSell: PublicKey.empty(),
      amountSell,
      tokenBuy,
      amountBuy
    })

    const [witnessRootAfter, keyAfter] = witness.computeRootAndKey(orderEvent.hash())

    this.merkleOrder.set(witnessRootAfter)
    this.indexOrder.set(newKey)

    this.emitEvent("addOrder", orderEvent)
  }

  @method
  async matchOrder(orderA: AddOrder, orderB: AddOrder, witnessA: MerkleMapWitness, witnessB: MerkleMapWitness) {
    await this.send({ to: orderA.sender, amount: orderA.amountBuy })
    const tokenBId = TokenId.derive(orderA.tokenSell)
    const orderTokenB = new OrderBook(this.address, tokenBId)
    await orderTokenB.moveTokenB(orderA, orderB, witnessA, witnessB)
  }

  @method
  async moveTokenB(orderA: AddOrder, orderB: AddOrder, witnessA: MerkleMapWitness, witnessB: MerkleMapWitness) {
    await this.send({ to: orderB.sender, amount: orderB.amountBuy })
    const order = new OrderBook(this.address)
    await order.updateOrder(orderA, orderB, witnessA, witnessB)
  }

  @method
  async updateOrder(orderA: AddOrder, orderB: AddOrder, witnessA: MerkleMapWitness, witnessB: MerkleMapWitness) {
    // don't use it in prod we don't verify if order already fullfilled
    const merkleOrder = this.merkleOrder.getAndRequireEquals()
    // as example we don
    const hashA = orderA.hash()
    const hashB = orderB.hash()

    const [witnessRootA, witnessKeyA] = witnessA.computeRootAndKey(hashA)
    Provable.log("witnessRootA", witnessRootA)
    Provable.log("witnessKeyA", witnessKeyA)
    Provable.log("merkleOrder", merkleOrder)
    Provable.log("hashA", hashA)
    merkleOrder.assertEquals(witnessRootA, "Invalid witness a")
    witnessKeyA.assertEquals(orderA.index, "Invalid witness a")

    const [witnessRootB, witnessKeyB] = witnessB.computeRootAndKey(hashB)
    Provable.log("witnessRootB", witnessRootB)
    Provable.log("witnessKeyB", witnessKeyB)
    merkleOrder.assertEquals(witnessRootB, "Invalid witness b")
    witnessKeyB.assertEquals(orderB.index, "Invalid witness b")

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
