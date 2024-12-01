import { DeployArgs, VerificationKey } from "o1js"
import { AccountUpdate, Field, method, Permissions, PublicKey, SmartContract, State, state } from "o1js"

export interface PoolDataDeployProps extends Exclude<DeployArgs, undefined> {
  protocol: PublicKey
  owner: PublicKey
  delegator: PublicKey
}

/**
 * Pool informations, use to manage protocol, receiver and verification key update
 */
export class PoolData extends SmartContract {
  events = {
    upgradePool: Field,
    upgradePoolHolder: Field,
    upgrade: Field,
    setNewOwner: PublicKey,
    acceptOwnership: PublicKey,
    updateProtocol: PublicKey,
    updateDelegator: PublicKey
  }

  @state(PublicKey)
  protocol = State<PublicKey>()
  @state(PublicKey)
  delegator = State<PublicKey>()
  @state(PublicKey)
  owner = State<PublicKey>()
  @state(PublicKey)
  newOwner = State<PublicKey>()

  async deploy(args: PoolDataDeployProps) {
    await super.deploy()

    args.protocol.isEmpty().assertFalse("Protocol empty")
    args.owner.isEmpty().assertFalse("Owner empty")
    args.delegator.isEmpty().assertFalse("Delegator empty")

    this.protocol.set(args.protocol)
    this.owner.set(args.owner)
    this.delegator.set(args.delegator)

    const permissions = Permissions.default()
    permissions.access = Permissions.proofOrSignature()
    permissions.setPermissions = Permissions.impossible()
    permissions.setVerificationKey = Permissions.VerificationKey.proofDuringCurrentVersion()
    this.account.permissions.set(permissions)
  }

  /**
   * Upgrade to a new version
   * @param vk new verification key
   */
  @method
  async updateVerificationKey(vk: VerificationKey) {
    const owner = this.owner.getAndRequireEquals()
    // check if owner signed the tx
    AccountUpdate.createSigned(owner)

    this.account.verificationKey.set(vk)
    this.emitEvent("upgrade", vk.hash)
  }

  @method
  async setNewOwner(newOwner: PublicKey) {
    const owner = this.owner.getAndRequireEquals()
    // check if owner signed the tx
    AccountUpdate.createSigned(owner)

    // two steps upgrade to prevent bad update
    this.newOwner.set(newOwner)
    this.emitEvent("setNewOwner", newOwner)
  }

  @method
  async acceptOwnership() {
    const newOwner = this.newOwner.getAndRequireEquals()
    // check if newOwner signed the tx
    AccountUpdate.createSigned(newOwner)

    // two steps upgrade to prevent bad update
    this.owner.set(newOwner)
    this.emitEvent("acceptOwnership", newOwner)
  }

  @method
  async setNewProtocol(newProtocol: PublicKey) {
    const owner = this.owner.getAndRequireEquals()
    // check if owner signed the tx
    AccountUpdate.createSigned(owner)

    this.protocol.set(newProtocol)
    this.emitEvent("updateProtocol", newProtocol)
  }

  @method
  async setNewDelegator(newDelegator: PublicKey) {
    const owner = this.owner.getAndRequireEquals()
    // check if owner signed the tx
    AccountUpdate.createSigned(owner)

    this.delegator.set(newDelegator)
    this.emitEvent("updateDelegator", newDelegator)
  }

  @method.returns(PublicKey)
  async getProtocol() {
    const protocol = this.protocol.getAndRequireEquals()
    return protocol
  }

  @method.returns(PublicKey)
  async getOwner() {
    const owner = this.owner.getAndRequireEquals()
    return owner
  }

  @method.returns(PublicKey)
  async getDelegator() {
    const delegator = this.delegator.getAndRequireEquals()
    return delegator
  }
}
