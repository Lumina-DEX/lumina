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
  token: PublicKey,
  amount: UInt64
}) {
  constructor(value: {
    sender: PublicKey
    token: PublicKey
    amount: UInt64
  }) {
    super(value)
  }

  hash(): Field {
    return Poseidon.hash(this.sender.toFields().concat(this.token.toFields().concat(this.amount.toFields())))
  }
}

/**
 * Test code don't use it
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
  async addOrder(token: PublicKey, amount: UInt64, witness: MerkleMapWitness) {
    const indexOrder = this.indexOrder.getAndRequireEquals()
    const merkleOrder = this.merkleOrder.getAndRequireEquals()

    // we start from the next key who are supposed to be empty
    const empty = Field.empty()
    const newKey = indexOrder.add(1)
    const [witnessRootBefore, witnessKey] = witness.computeRootAndKey(empty)
    witnessRootBefore.assertEquals(merkleOrder, "Witness incorrect")
    witnessKey.assertEquals(newKey, "Witness incorrect")

    const sender = this.sender.getAndRequireSignature()
    const orderEvent = new AddOrderEvent({ sender, token, amount })

    const [witnessRootAfter] = witness.computeRootAndKey(orderEvent.hash())

    this.merkleOrder.set(witnessRootAfter)
    this.indexOrder.set(newKey)

    this.emitEvent("addOrder", orderEvent)
  }
}
