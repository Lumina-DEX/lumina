import {
  Account,
  AccountUpdate,
  AccountUpdateForest,
  assert,
  Bool,
  CircuitString,
  DeployArgs,
  Field,
  Int64,
  method,
  Permissions,
  Provable,
  PublicKey,
  Reducer,
  SmartContract,
  State,
  state,
  Struct,
  TokenContractV2,
  TokenId,
  Types,
  UInt64,
  VerificationKey,
} from "o1js"
import { BalanceChangeEvent, mulDiv, Pool, PoolData, PoolTokenHolder } from "../indexpool.js"

export interface FarmingDeployProps extends Exclude<DeployArgs, undefined> {
  pool: PublicKey
  owner: PublicKey
}

/**
 * Farm contract
 */
export class FarmStorage extends SmartContract {
  // Farming for one pool
  @state(PublicKey)
  pool = State<PublicKey>()
  // current amount deposited
  @state(UInt64)
  amount = State<UInt64>()
  // last time commited
  @state(UInt64)
  lastCommitment = State<UInt64>()
  // points win before last deposit (1 point by token by minute)
  @state(UInt64)
  points = State<UInt64>()

  events = {
    upgrade: Field,
  }

  async deploy() {
    await super.deploy()
  }

  @method.returns(UInt64)
  async getAmount() {
    const currentAmount = this.amount.getAndRequireEquals()
    return currentAmount
  }

  @method
  async deposit(amount: UInt64) {
    const poolAddress = this.pool.getAndRequireEquals()
    const pool = new Pool(poolAddress)

    const sender = this.sender.getUnconstrainedV2()
    this.address.assertEquals(sender)
    // transfer amount to this account
    await pool.transfer(sender, this.address, amount)

    const currentAmount = this.amount.getAndRequireEquals()
    const newAmount = currentAmount.add(amount)
    this.amount.set(newAmount)

    // maybe is to this method to call deposit ?
    const timestamp = this.network.timestamp.getAndRequireEquals()
    const lastCommitment = this.lastCommitment.getAndRequireEquals()
    const winPoints = this.calculatePoint(currentAmount, lastCommitment, timestamp)

    const currentPoint = this.points.getAndRequireEquals()
    const newPoints = currentPoint.add(winPoints)
    this.points.set(newPoints)

    this.lastCommitment.set(timestamp)
  }

  @method
  async withdraw(amount: UInt64) {
    const poolAddress = this.pool.getAndRequireEquals()
    const pool = new Pool(poolAddress)

    const currentAmount = this.amount.getAndRequireEquals()
    amount.assertLessThanOrEqual(currentAmount, "Insuffisient amount")

    const sender = this.sender.getUnconstrainedV2()
    this.address.assertEquals(sender)
    // transfer amount to this account
    await pool.transfer(this.address, sender, amount)

    const newAmount = currentAmount.sub(amount)
    this.amount.set(newAmount)

    // maybe is to this method to call deposit ?
    const timestamp = this.network.timestamp.getAndRequireEquals()
    const lastCommitment = this.lastCommitment.getAndRequireEquals()
    const winPoints = this.calculatePoint(currentAmount, lastCommitment, timestamp)

    const currentPoint = this.points.getAndRequireEquals()
    const newPoints = currentPoint.add(winPoints)
    this.points.set(newPoints)

    this.lastCommitment.set(timestamp)
  }

  @method.returns(UInt64)
  async withdrawReward() {
    const currentAmount = this.amount.getAndRequireEquals()

    // prevent from reinit points
    const sender = this.sender.getAndRequireSignatureV2()

    // maybe is to this method to call deposit ?
    const timestamp = this.network.timestamp.getAndRequireEquals()
    const lastCommitment = this.lastCommitment.getAndRequireEquals()
    const winPoints = this.calculatePoint(currentAmount, lastCommitment, timestamp)

    const currentPoint = this.points.getAndRequireEquals()
    const newPoints = currentPoint.add(winPoints)

    // reinit points
    this.points.set(UInt64.zero)

    this.lastCommitment.set(timestamp)

    return newPoints
  }

  private calculatePoint(currentAmount: UInt64, lastDeposit: UInt64, timestamp: UInt64): UInt64 {
    lastDeposit.assertLessThan(timestamp, "last deposit is not older than current block")

    const time = timestamp.sub(lastDeposit)
    // calculate points by minutes
    const points = mulDiv(time, currentAmount, UInt64.from(60))
    return points
  }
}
