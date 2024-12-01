import { AccountUpdateForest, DeployArgs, UInt64, VerificationKey } from "o1js"
import {
  AccountUpdate,
  assert,
  Bool,
  Field,
  Int64,
  method,
  Permissions,
  Provable,
  PublicKey,
  State,
  state,
  TokenContractV2,
  Types
} from "o1js"

import { BalanceChangeEvent } from "../indexpool.js"

import { FarmStorage } from "./FarmStorage"

export interface FarmingDeployProps extends Exclude<DeployArgs, undefined> {
  pool: PublicKey
  owner: PublicKey
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
    let totalBalance = Int64.from(0)
    this.forEachUpdate(updates, (update, usesToken) => {
      // Make sure that the account permissions are not changed
      this.checkPermissionsUpdate(update)
      this.emitEventIf(
        usesToken,
        "BalanceChange",
        new BalanceChangeEvent({ address: update.publicKey, amount: update.balanceChange })
      )

      // Don't allow transfers to/from the account that's tracking circulation
      update.publicKey.equals(this.address).and(usesToken).assertFalse(
        "Can't transfer to/from the circulation account"
      )
      totalBalance = Provable.if(usesToken, totalBalance.add(update.balanceChange), totalBalance)
      totalBalance.isPositiveV2().assertFalse(
        "Flash-minting or unbalanced transaction detected"
      )
    })
    totalBalance.assertEquals(Int64.zero, "Unbalanced transaction")
  }

  private checkPermissionsUpdate(update: AccountUpdate) {
    const permissions = update.update.permissions

    const { access, receive } = permissions.value
    const accessIsNone = Provable.equal(Types.AuthRequired, access, Permissions.none())
    const receiveIsNone = Provable.equal(Types.AuthRequired, receive, Permissions.none())
    const updateAllowed = accessIsNone.and(receiveIsNone)

    assert(
      updateAllowed.or(permissions.isSome.not()),
      "Can't change permissions for access or receive on token accounts"
    )
  }

  @method
  async transfer(from: PublicKey, to: PublicKey, amount: UInt64) {
    from.equals(this.address).assertFalse("Can't transfer to/from the circulation account")
    to.equals(this.address).assertFalse("Can't transfer to/from the circulation account")
    this.internal.send({ from, to, amount })
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
  async deposit(amount: UInt64) {
    const sender = this.sender.getAndRequireSignatureV2()
    const newStorage = new FarmStorage(sender, this.deriveTokenId())
    await newStorage.deposit(amount)
  }
}
