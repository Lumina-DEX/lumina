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
  VerificationKey
} from "o1js"
import { BalanceChangeEvent, mulDiv, Pool, PoolTokenHolder } from "../indexpool.js"
import { Farm } from "./Farm.js"

export interface FarmingDeployProps extends Exclude<DeployArgs, undefined> {
  pool: PublicKey
  owner: PublicKey
}

/**
 * Farm contract
 */
export class FarmPoolHolder extends SmartContract {
  // Farming for one pool
  @state(PublicKey)
  pool = State<PublicKey>()
  @state(PublicKey)
  owner = State<PublicKey>()

  events = {
    upgrade: Field,
    BalanceChange: BalanceChangeEvent
  }

  async deploy(args: FarmingDeployProps) {
    await super.deploy()

    args.pool.isEmpty().assertFalse("Pool empty")
    args.owner.isEmpty().assertFalse("Owner empty")

    this.pool.set(args.pool)
    this.owner.set(args.owner)

    let permissions = Permissions.default()
    permissions.access = Permissions.proof()
    permissions.setPermissions = Permissions.impossible()
    permissions.setVerificationKey = Permissions.VerificationKey.impossibleDuringCurrentVersion()
    this.account.permissions.set(permissions)
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
  async withdraw(amount: UInt64) {
    const sender = this.sender.getUnconstrainedV2()
    this.send({ to: sender, amount })
    const farm = new Farm(this.address)
    await farm.burnFarmToken(amount)
  }
}
