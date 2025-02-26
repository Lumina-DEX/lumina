import { FungibleToken } from "mina-fungible-token"
import {
  Field,
  MerkleMapWitness,
  method,
  Poseidon,
  PublicKey,
  SmartContract,
  State,
  state,
  Struct,
  UInt32,
  UInt64
} from "o1js"

export class AddOrder extends Struct({
  sender: PublicKey,
  tokenSell: PublicKey,
  amountSell: UInt64,
  tokenBuy: PublicKey,
  amountBuy: UInt64
}) {
  constructor(value: {
    sender: PublicKey
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
export class Order extends SmartContract {
  @state(Field)
  merkleOrder = State<Field>()
  @state(Field)
  merkleFillOrder = State<Field>()
  @state(Field)
  indexOrder = State<Field>()
  @state(Field)
  indexFillOrder = State<Field>()
  @state(PublicKey)
  receiver = State<PublicKey>()

  events = {
    addOrder: AddOrder
  }

  async deploy() {
    await super.deploy()
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
    tokenContract.transfer(sender, this.address, amountSell)

    const orderEvent = new AddOrder({ sender, tokenSell, amountSell, tokenBuy, amountBuy })

    const [witnessRootAfter] = witness.computeRootAndKey(orderEvent.hash())

    this.merkleOrder.set(witnessRootAfter)
    this.indexOrder.set(newKey)

    this.emitEvent("addOrder", orderEvent)
  }

  @method
  async fillOrder(orderA: AddOrder, orderB: AddOrder, witnessA: MerkleMapWitness) {
    // const indexOrder = this.indexOrder.getAndRequireEquals()
    // const merkleOrder = this.merkleOrder.getAndRequireEquals()

    // // we start from the next key who are supposed to be empty
    // const empty = Field.empty()
    // const newKey = indexOrder.add(1)
    // const [witnessRootBefore, witnessKey] = witness.computeRootAndKey(empty)
    // witnessRootBefore.assertEquals(merkleOrder, "Witness incorrect")
    // witnessKey.assertEquals(newKey, "Witness incorrect")

    // const sender = this.sender.getAndRequireSignature()
    // const orderEvent = new AddOrderEvent({ sender, tokenIn, amountIn, tokenOut, amountOut })

    // const [witnessRootAfter] = witness.computeRootAndKey(orderEvent.hash())

    // this.merkleOrder.set(witnessRootAfter)
    // this.indexOrder.set(newKey)

    // this.emitEvent("addOrder", orderEvent)
  }
}
