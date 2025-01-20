import {
  AccountUpdate,
  AccountUpdateForest,
  Bool,
  DeployArgs,
  Field,
  method,
  Mina,
  Permissions,
  Provable,
  PublicKey,
  SmartContract,
  State,
  state,
  UInt64,
  VerificationKey
} from "o1js"
import { UpdateVerificationKeyEvent } from "../indexpool.js"
import { Farm, FarmingEvent, minTimeUnlockFarm, UpdateInitEvent } from "./Farm.js"

export interface FarmingDeployProps extends Exclude<DeployArgs, undefined> {
  owner: PublicKey
}

/**
 * Farm contract
 */
export class FarmTokenHolder extends SmartContract {
  @state(PublicKey)
  owner = State<PublicKey>()
  @state(UInt64)
  timeUnlock = State<UInt64>()

  events = {
    upgrade: UpdateVerificationKeyEvent,
    upgradeInited: UpdateInitEvent,
    withdraw: FarmingEvent
  }

  async deploy(args: FarmingDeployProps) {
    this.account.isNew.requireEquals(Bool(true))

    await super.deploy(args)

    args.owner.isEmpty().assertFalse("Owner empty")
    this.owner.set(args.owner)

    let permissions = Permissions.default()
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
  async withdraw(amount: UInt64) {
    const sender = this.sender.getAndRequireSignature()
    const accountUpdate = this.send({ to: sender, amount })
    accountUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent
    const farm = new Farm(this.address)
    await farm.burnLiquidity(sender, amount)
    this.emitEvent("withdraw", new FarmingEvent({ sender, amount }))
  }
}
