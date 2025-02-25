import { FungibleToken } from "mina-fungible-token"
import {
  Field,
  MerkleMap,
  MerkleMapWitness,
  method,
  Poseidon,
  PublicKey,
  SmartContract,
  State,
  state,
  Struct,
  UInt64
} from "o1js"

export class AddOrderEvent extends Struct({
  sender: PublicKey,
  tokenIn: PublicKey,
  amountIn: UInt64,
  tokenOut: PublicKey,
  amountOut: UInt64
}) {
  constructor(value: {
    sender: PublicKey
    tokenIn: PublicKey
    amountIn: UInt64
    tokenOut: PublicKey
    amountOut: UInt64
  }) {
    super(value)
  }

  hash(): Field {
    return Poseidon.hash(
      this.sender.toFields()
        .concat(
          this.tokenIn.toFields()
            .concat(
              this.amountIn.toFields()
                .concat(
                  this.tokenOut.toFields()
                    .concat(this.amountOut.toFields())
                )
            )
        )
    )
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

  events = {
    addOrder: AddOrderEvent
  }

  async deploy() {
    await super.deploy()
  }

  @method
  async addOrder(
    tokenIn: PublicKey,
    amountIn: UInt64,
    tokenOut: PublicKey,
    amountOut: UInt64,
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
    const tokenContract = new FungibleToken(tokenIn)
    tokenContract.transfer(sender, this.address, amountIn)

    const orderEvent = new AddOrderEvent({ sender, tokenIn, amountIn, tokenOut, amountOut })

    const [witnessRootAfter] = witness.computeRootAndKey(orderEvent.hash())

    this.merkleOrder.set(witnessRootAfter)
    this.indexOrder.set(newKey)

    this.emitEvent("addOrder", orderEvent)
  }

  @method
  async fillOrder(orderA: Field, orderB: Field, witness: MerkleMapWitness) {
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
