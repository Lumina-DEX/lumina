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
  State,
  state,
  Struct,
  TokenContractV2,
  TokenId,
  Types,
  UInt64,
  VerificationKey
} from "o1js"
import { BalanceChangeEvent, mulDiv, Pool, PoolTokenHolder } from "../indexpool.js"
import { FarmStorage } from "./FarmStorage"

export interface FarmingDeployProps extends Exclude<DeployArgs, undefined> {
  pool: PublicKey
  owner: PublicKey
  tokenBySecond: UInt64
  startTimestamp: UInt64
  endTimestamp: UInt64
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
  @state(UInt64)
  tokenBySecond = State<UInt64>()
  @state(UInt64)
  startTimestamp = State<UInt64>()
  @state(UInt64)
  endTimestamp = State<UInt64>()

  events = {
    upgrade: Field,
    BalanceChange: BalanceChangeEvent
  }

  async deploy(args: FarmingDeployProps) {
    await super.deploy()

    args.pool.isEmpty().assertFalse("Pool empty")
    args.owner.isEmpty().assertFalse("Owner empty")
    args.tokenBySecond.assertGreaterThan(UInt64.zero, "Token by second can't be 0")
    const currentTimestamp = this.network.timestamp.getAndRequireEquals()
    args.startTimestamp.assertGreaterThanOrEqual(
      currentTimestamp,
      "Start timestamp need to be greater or equal to the current timestamp"
    )
    args.endTimestamp.assertGreaterThan(currentTimestamp, "End timestamp need to be greater than current timestamp")

    this.pool.set(args.pool)
    this.owner.set(args.owner)
    this.tokenBySecond.set(args.tokenBySecond)
    this.startTimestamp.set(args.startTimestamp)
    this.endTimestamp.set(args.endTimestamp)

    let permissions = Permissions.default()
    permissions.access = Permissions.proof()
    permissions.setPermissions = Permissions.impossible()
    permissions.setVerificationKey = Permissions.VerificationKey.proofDuringCurrentVersion()
    this.account.permissions.set(permissions)

    const circulationUpdate = AccountUpdate.create(this.address, this.deriveTokenId())
    this.internal.mint({ address: circulationUpdate, amount: args.tokenBySecond })
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

  /** Approve `AccountUpdate`s that have been created outside of the token contract.
   *
   * @argument {AccountUpdateForest} updates - The `AccountUpdate`s to approve. Note that the forest size is limited by the base token contract, @see TokenContractV2.MAX_ACCOUNT_UPDATES The current limit is 9.
   */
  @method
  async approveBase(updates: AccountUpdateForest): Promise<void> {
    Bool(false).assertTrue("You can't manage the token")
  }

  @method
  async deployStorage() {
    const sender = this.sender.getUnconstrainedV2()

    const newStorage = AccountUpdate.create(sender, this.deriveTokenId())
    // Require this account didn't already exist
    newStorage.account.isNew.requireEquals(Bool(true))

    // set pool account vk and permission
    newStorage.body.update.verificationKey = { isSome: Bool(true), value: { data: "", hash: Field(123n) } }
    newStorage.body.update.permissions = {
      isSome: Bool(true),
      value: {
        ...Permissions.default(),
        // only proof to prevent signature owner to steal liquidity
        access: Permissions.proof(),
        setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
        send: Permissions.proof(),
        setPermissions: Permissions.impossible()
      }
    }

    const poolAddress = this.pool.getAndRequireEquals()
    const poolFields = poolAddress.toFields()

    // init value
    newStorage.body.update.appState = [
      { isSome: Bool(true), value: poolFields[0] },
      { isSome: Bool(true), value: poolFields[1] },
      { isSome: Bool(true), value: Field(0) },
      { isSome: Bool(true), value: Field(0) },
      { isSome: Bool(true), value: Field(0) },
      { isSome: Bool(true), value: Field(0) },
      { isSome: Bool(true), value: Field(0) },
      { isSome: Bool(true), value: Field(0) }
    ]
  }

  @method
  async checkPool(poolAddress: PublicKey) {
    this.pool.requireEquals(poolAddress)
  }

  @method
  async deposit(amount: UInt64, supplyMax: UInt64, oldDebt: UInt64, oldAmount: UInt64, oldCommitment: UInt64) {
    // recaculate from current supply
    this.account.balance.requireBetween(UInt64.zero, supplyMax)
    const sender = this.sender.getAndRequireSignatureV2()
    const senderBalanceAccount = AccountUpdate.create(sender, this.deriveTokenId())
    senderBalanceAccount.account.balance.requireEquals(oldAmount)
    const time = this.network.timestamp.getAndRequireEquals()

    // check correct time range
    const start = this.startTimestamp.getAndRequireEquals()
    const end = this.startTimestamp.getAndRequireEquals()
    this.network.timestamp.requireBetween(start, end)

    const tokenBySecond = this.tokenBySecond.getAndRequireEquals()
    const rewardBySecond = mulDiv(tokenBySecond, oldAmount, supplyMax)
    const elapsed = time.sub(start)
    const reward = elapsed.mul(rewardBySecond)
    // manage transfer reward

    const newStorage = new FarmStorage(sender, this.deriveTokenId())
    await newStorage.deposit(amount, oldCommitment, oldDebt)
    // mint token to user and this account to track balance
    this.internal.mint({ address: sender, amount })
    this.internal.mint({ address: this.address, amount })
  }
}
