import { FungibleToken } from "mina-fungible-token"
import {
  AccountUpdate,
  Bool,
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
import { AddOrder, OrderDeposit } from "./OrderDeposit"

export class ExecutedOrder extends Struct({
  // for order filled multiple time we need to create different execute order
  index: Field,
  sender: PublicKey,
  orderIndex: Field,
  tokenIn: PublicKey,
  tokenOut: PublicKey,
  amountFilled: UInt64,
  totalFilled: UInt64
}) {
  constructor(
    index: Field,
    sender: PublicKey,
    orderIndex: Field,
    tokenIn: PublicKey,
    tokenOut: PublicKey,
    amountFilled: UInt64,
    totalFilled: UInt64
  ) {
    super({
      index,
      sender,
      orderIndex,
      tokenIn,
      tokenOut,
      amountFilled,
      totalFilled
    })
  }

  key(): Field {
    const toFields = this.index.toFields().concat(this.sender.toFields()).concat(this.orderIndex.toFields())
      .concat(this.tokenIn.toFields()).concat(this.tokenOut.toFields())
    return Poseidon.hash(toFields)
  }

  value(): Field {
    const toFields = this.amountFilled.toFields().concat(this.totalFilled.toFields())
    return Poseidon.hash(toFields)
  }
}

/**
 * Test code don't use it in production
 */
export class LimitOrder extends SmartContract {
  @state(PublicKey)
  depositContract = State<PublicKey>()

  @state(Field)
  executed = State<Field>()

  events = {}

  async init() {
    await super.init()
  }

  @method
  async executeOrder(
    orderA: AddOrder,
    orderB: AddOrder,
    witnessExecutionA: MerkleMapWitness,
    witnessExecutionB: MerkleMapWitness,
    witnessA: MerkleMapWitness,
    witnessB: MerkleMapWitness
  ) {
    const executedMerkle = this.executed.getAndRequireEquals()

    // don't use it in prod we don't verify if order already fullfilled
    // const merkleOrder = this.merkleOrder.getAndRequireEquals()
    // as example we don
    const hashA = orderA.hash()
    const hashB = orderB.hash()

    const depositContract = this.depositContract.getAndRequireEquals()

    const tokenIdA = TokenId.derive(orderA.sender)
    const orderDepositA = new OrderDeposit(depositContract, tokenIdA)

    const tokenIdB = TokenId.derive(orderB.sender)
    const orderDepositB = new OrderDeposit(depositContract, tokenIdB)

    tokenIdA.lessThan(tokenIdB)
    tokenIdA.assertEquals(this.tokenId)

    // match the order token
    orderA.tokenBuy.assertEquals(orderB.tokenSell)
    orderA.tokenSell.assertEquals(orderB.tokenBuy)

    // for example just perfect matching orders
    const priceA = orderA.amountSell.div(orderA.amountBuy)
    const priceB = orderB.amountBuy.div(orderA.amountSell)
    priceB.assertEquals(priceA)
    orderA.amountBuy.assertEquals(orderB.amountSell)

    const orderAExecution = new ExecutedOrder(
      Field(0),
      orderA.sender,
      orderA.index,
      orderA.tokenSell,
      orderA.tokenBuy,
      orderB.amountSell,
      orderB.amountSell
    )
    const orderBExecution = new ExecutedOrder(
      Field(0),
      orderB.sender,
      orderB.index,
      orderB.tokenSell,
      orderB.tokenBuy,
      orderA.amountSell,
      orderB.amountSell
    )

    this.checkExecution(orderAExecution, witnessExecutionA, executedMerkle)
    this.checkExecution(orderBExecution, witnessExecutionB, executedMerkle)
  }

  private checkExecution(executeOrder: ExecutedOrder, witness: MerkleMapWitness, merkleRoot: Field) {
    const [rootExecutionA, keyExecutionA] = witness.computeRootAndKey(Field.empty())
    keyExecutionA.equals(executeOrder.key()).assertTrue("Invalid witness or value")
    rootExecutionA.equals(merkleRoot).assertTrue("Invalid root calculated")
  }

  @method
  async subExecute(orderA: AddOrder, orderB: AddOrder, witnessA: MerkleMapWitness, witnessB: MerkleMapWitness) {
    // don't use it in prod we don't verify if order already fullfilled
    // const merkleOrder = this.merkleOrder.getAndRequireEquals()
    // as example we don
    const hashA = orderA.hash()
    const hashB = orderB.hash()

    const depositContract = this.depositContract.getAndRequireEquals()

    const tokenIdA = TokenId.derive(orderA.sender)
    const orderDepositA = new OrderDeposit(depositContract, tokenIdA)

    const tokenIdB = TokenId.derive(orderB.sender)
    const orderDepositB = new OrderDeposit(depositContract, tokenIdB)

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
