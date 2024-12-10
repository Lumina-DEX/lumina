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
  UInt32,
  UInt64,
  VerificationKey
} from "o1js"
import { BalanceChangeEvent, mulDiv, Pool, PoolTokenHolder } from "../indexpool.js"

export class FarmingInfo extends Struct({
  tokenAddress: PublicKey,
  startTimestamp: UInt64,
  endTimestamp: UInt64,
  root: Field
}) {
  constructor(value: {
    tokenAddress: PublicKey
    totalReward: UInt64
    startTimestamp: UInt64
    endTimestamp: UInt64
    root: Field
  }) {
    super(value)
  }
}

export class FarmingEvent extends Struct({
  sender: PublicKey,
  amount: UInt64
}) {
  constructor(value: {
    sender: PublicKey
    amount: UInt64
  }) {
    super(value)
  }
}

export interface FarmingDeployProps extends Exclude<DeployArgs, undefined> {
  pool: PublicKey
  owner: PublicKey
  rewardAddress: PublicKey
  farmingInfo: FarmingInfo
}

/**
 * Farm contract
 */
export class Farm extends TokenContractV2 {
  // Farming for one pool
  @state(PublicKey)
  pool = State<PublicKey>()
  @state(PublicKey)
  owner = State<PublicKey>()
  @state(FarmingInfo)
  farmingInfo = State<FarmingInfo>()

  events = {
    upgrade: Field,
    deposit: FarmingEvent,
    withdraw: FarmingEvent
  }

  async deploy(args: FarmingDeployProps) {
    await super.deploy()

    args.pool.isEmpty().assertFalse("Pool empty")
    args.owner.isEmpty().assertFalse("Owner empty")

    const currentTimestamp = this.network.timestamp.getAndRequireEquals()
    args.farmingInfo.startTimestamp.assertGreaterThanOrEqual(
      currentTimestamp,
      "Start timestamp need to be greater or equal to the current timestamp"
    )
    args.farmingInfo.endTimestamp.assertGreaterThan(
      currentTimestamp,
      "End timestamp need to be greater than current timestamp"
    )

    this.pool.set(args.pool)
    this.owner.set(args.owner)
    this.farmingInfo.set(args.farmingInfo)

    let permissions = Permissions.default()
    permissions.access = Permissions.proof()
    permissions.setPermissions = Permissions.impossible()
    permissions.setVerificationKey = Permissions.VerificationKey.impossibleDuringCurrentVersion()
    this.account.permissions.set(permissions)
  }

  /** Approve `AccountUpdate`s that have been created outside of the token contract.
   *
   * @argument {AccountUpdateForest} updates - The `AccountUpdate`s to approve. Note that the forest size is limited by the base token contract, @see TokenContractV2.MAX_ACCOUNT_UPDATES The current limit is 9.
   */
  @method
  async approveBase(updates: AccountUpdateForest): Promise<void> {
    Bool(false).assertTrue("You can't manage the token")
  }

  /**
   * Upgrade to a new version
   * @param vk new verification key
   */
  @method
  async updateVerificationKey(vk: VerificationKey) {
    const owner = await this.owner.getAndRequireEquals()

    // only owner can update a pool
    AccountUpdate.createSigned(owner)

    this.account.verificationKey.set(vk)
    this.emitEvent("upgrade", vk.hash)
  }

  @method
  async deposit(amount: UInt64) {
    const farmingInfo = this.farmingInfo.getAndRequireEquals()
    // user can deposit only during this period
    this.network.timestamp.requireBetween(farmingInfo.startTimestamp, farmingInfo.endTimestamp)

    const poolAddress = this.pool.getAndRequireEquals()
    const pool = new Pool(poolAddress)
    const sender = this.sender.getUnconstrainedV2()
    // transfer amount to this account
    await pool.transfer(sender, this.address, amount)
    this.internal.mint({ address: sender, amount })
    this.emitEvent("deposit", new FarmingEvent({ sender, amount }))
  }

  @method
  async withdraw(amount: UInt64) {
    const sender = this.sender.getUnconstrainedV2()
    this.send({ to: sender, amount })
    this.internal.burn({ address: sender, amount })
    this.emitEvent("withdraw", new FarmingEvent({ sender, amount }))
  }
}
