import {
  AccountUpdate,
  AccountUpdateForest,
  Bool,
  DeployArgs,
  method,
  Mina,
  Permissions,
  Provable,
  PublicKey,
  State,
  state,
  Struct,
  TokenContract,
  UInt64,
  VerificationKey
} from "o1js"
import { Pool, UpdateVerificationKeyEvent } from "../indexpool.js"

export class FarmingInfo extends Struct({
  startTimestamp: UInt64,
  endTimestamp: UInt64
}) {
  constructor(value: {
    startTimestamp: UInt64
    endTimestamp: UInt64
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

export class BurnEvent extends Struct({
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

export class UpdateInitEvent extends Struct({
  owner: PublicKey
}) {
  constructor(value: {
    owner: PublicKey
  }) {
    super(value)
  }
}

export interface FarmingDeployProps extends Exclude<DeployArgs, undefined> {
  pool: PublicKey
  owner: PublicKey
  startSlot: UInt64
  endSlot: UInt64
}

/**
 * we can't upgrade the contract before 1 day
 */
export const minTimeUnlockFarm = UInt64.from(86_400_000)

/**
 * Farm contract
 */
export class Farm extends TokenContract {
  // Farming for one pool
  @state(PublicKey)
  pool = State<PublicKey>()
  @state(PublicKey)
  owner = State<PublicKey>()
  @state(UInt64)
  startTimestamp = State<UInt64>()
  @state(UInt64)
  endTimestamp = State<UInt64>()
  @state(UInt64)
  timeUnlock = State<UInt64>()

  events = {
    upgrade: UpdateVerificationKeyEvent,
    upgradeInited: UpdateInitEvent,
    deposit: FarmingEvent,
    burn: BurnEvent
  }

  async deploy(args: FarmingDeployProps) {
    this.account.isNew.requireEquals(Bool(true))

    await super.deploy(args)

    args.pool.isEmpty().assertFalse("Pool empty")
    args.owner.isEmpty().assertFalse("Owner empty")

    // calculate start and end base on slot
    const { genesisTimestamp, slotTime } = Mina.getNetworkConstants()
    const startTimestamp = UInt64.from(args.startSlot).mul(slotTime).add(genesisTimestamp)
    const endTimestamp = UInt64.from(args.endSlot).mul(slotTime).add(genesisTimestamp)
    startTimestamp.lessThan(endTimestamp)

    // check starttimestamp greater than current timestamp
    this.network.timestamp.requireBetween(UInt64.zero, startTimestamp)

    this.pool.set(args.pool)
    this.owner.set(args.owner)
    this.startTimestamp.set(startTimestamp)
    this.endTimestamp.set(endTimestamp)

    let permissions = Permissions.default()
    permissions.access = Permissions.proof()
    permissions.send = Permissions.proof()
    permissions.setPermissions = Permissions.impossible()
    permissions.setVerificationKey = Permissions.VerificationKey.proofDuringCurrentVersion()
    this.account.permissions.set(permissions)
  }

  /**
   *  Transfer is locked only depositor can withdraw his token
   */
  @method
  async approveBase(updates: AccountUpdateForest): Promise<void> {
    updates.isEmpty().assertTrue("You can't manage the token")
  }

  /**
   * Init Upgrade to a new version
   * @param vk new verification key
   */
  @method
  async initUpdate(startTime: UInt64) {
    const owner = await this.owner.getAndRequireEquals()
    // only owner can init a update
    AccountUpdate.createSigned(owner)

    this.network.timestamp.requireBetween(UInt64.zero, startTime)

    // owner need to wait minimum 1 day before update this contract
    const timeUnlock = startTime.add(minTimeUnlockFarm)
    this.timeUnlock.set(timeUnlock)
    this.emitEvent("upgradeInited", new UpdateInitEvent({ owner }))
  }

  /**
   * Upgrade to a new version
   * @param vk new verification key
   */
  @method
  async updateVerificationKey(vk: VerificationKey) {
    const timeUnlock = this.timeUnlock.getAndRequireEquals()
    timeUnlock.assertGreaterThan(UInt64.zero, "Time unlock is not defined")
    this.network.timestamp.requireBetween(timeUnlock, UInt64.MAXINT())

    const owner = await this.owner.getAndRequireEquals()

    // only owner can update a pool
    AccountUpdate.createSigned(owner)

    this.account.verificationKey.set(vk)
    this.emitEvent("upgrade", new UpdateVerificationKeyEvent(vk.hash))
  }

  @method
  async deposit(amount: UInt64) {
    const startTimestamp = this.startTimestamp.getAndRequireEquals()
    const endTimestamp = this.endTimestamp.getAndRequireEquals()
    // user can deposit only during this period
    this.network.timestamp.requireBetween(startTimestamp, endTimestamp)

    const poolAddress = this.pool.getAndRequireEquals()
    const pool = new Pool(poolAddress)
    const sender = this.sender.getUnconstrained()
    // transfer amount to this account
    await pool.transfer(sender, this.address, amount)
    this.internal.mint({ address: sender, amount })
    this.emitEvent("deposit", new FarmingEvent({ sender, amount }))
  }

  /**
   * Don't call this method directly
   */
  @method
  async burnLiquidity(sender: PublicKey, amount: UInt64) {
    const caller = this.sender.getAndRequireSignature()
    caller.assertEquals(sender)
    this.internal.burn({ address: sender, amount })
    this.emitEvent("burn", new BurnEvent({ sender, amount }))
  }
}
