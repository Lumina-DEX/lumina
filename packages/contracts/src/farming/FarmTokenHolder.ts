import { AccountUpdate, AccountUpdateForest, Bool, DeployArgs, Field, method, Permissions, PublicKey, SmartContract, State, state, UInt64, VerificationKey } from "o1js"
import { Farm, FarmingEvent } from "./Farm.js"
import { UpdateVerificationKeyEvent } from "../indexpool.js"

export interface FarmingDeployProps extends Exclude<DeployArgs, undefined> {
  owner: PublicKey
}

/**
 * Farm contract
 */
export class FarmTokenHolder extends SmartContract {

  @state(PublicKey)
  owner = State<PublicKey>()

  events = {
    upgrade: Field,
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
   * Upgrade to a new version
   * @param vk new verification key
   */
  @method
  async updateVerificationKey(vk: VerificationKey) {
    const owner = await this.owner.getAndRequireEquals()
    // only owner can update a pool
    AccountUpdate.createSigned(owner)
    this.account.verificationKey.set(vk)
    this.emitEvent("upgrade", new UpdateVerificationKeyEvent(vk.hash))
  }

  @method
  async withdraw(amount: UInt64) {
    const sender = this.sender.getAndRequireSignature()
    const accountUpdate = this.send({ to: sender, amount });
    accountUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;
    const farm = new Farm(this.address);
    await farm.burnLiquidity(sender, amount);
    this.emitEvent("withdraw", new FarmingEvent({ sender, amount }))
  }
}
