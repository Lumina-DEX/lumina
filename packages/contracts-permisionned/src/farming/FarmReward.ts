import {
  AccountUpdate,
  AccountUpdateForest,
  Bool,
  DeployArgs,
  Field,
  MerkleWitness,
  method,
  Mina,
  Permissions,
  Poseidon,
  Provable,
  PublicKey,
  State,
  state,
  Struct,
  TokenContract,
  UInt64,
  VerificationKey
} from "o1js"
import { UpdateVerificationKeyEvent } from "../indexpool"
import { UpdateInitEvent } from "./Farm"

export interface FarmRewardDeployProps extends Exclude<DeployArgs, undefined> {
  merkleRoot: Field
  token: PublicKey
  owner: PublicKey
}

export class MintEvent extends Struct({
  sender: PublicKey
}) {
  constructor(value: {
    sender: PublicKey
  }) {
    super(value)
  }
}

export class ClaimEvent extends Struct({
  user: PublicKey,
  amount: UInt64
}) {
  constructor(value: {
    user: PublicKey
    amount: UInt64
  }) {
    super(value)
  }
}

/**
 * support 2^32 different claimer (easily adjustable)
 */
export const claimerNumber = 32
export class FarmMerkleWitness extends MerkleWitness(claimerNumber) {}

/**
 * we can't upgrade the contract before 1 day
 */
export const minTimeUnlockFarmReward = UInt64.from(86_400_000)

/**
 * Farm reward contract
 */
export class FarmReward extends TokenContract {
  @state(PublicKey)
  owner = State<PublicKey>()
  @state(PublicKey)
  token = State<PublicKey>()
  @state(Field)
  merkleRoot = State<Field>()
  @state(UInt64)
  timeUnlock = State<UInt64>()

  events = {
    upgrade: UpdateVerificationKeyEvent,
    upgradeInited: UpdateInitEvent,
    claim: ClaimEvent,
    mint: MintEvent
  }

  async deploy(args: FarmRewardDeployProps) {
    this.account.isNew.requireEquals(Bool(true))

    await super.deploy()

    args.merkleRoot.equals(Field(0)).assertFalse("Merkle root is empty")
    args.owner.isEmpty().assertFalse("Owner is empty")

    this.owner.set(args.owner)
    this.merkleRoot.set(args.merkleRoot)
    this.token.set(args.token)

    let permissions = Permissions.default()
    permissions.access = Permissions.proof()
    permissions.send = Permissions.proof()
    permissions.setPermissions = Permissions.impossible()
    permissions.setVerificationKey = Permissions.VerificationKey.proofDuringCurrentVersion()
    this.account.permissions.set(permissions)
  }

  /** Approve `AccountUpdate`s that have been created outside of the token contract.
   *
   * @argument {AccountUpdateForest} updates - The `AccountUpdate`s to approve. Note that the forest size is limited by the base token contract, @see TokenContract.MAX_ACCOUNT_UPDATES The current limit is 9.
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
    const timeUnlock = startTime.add(minTimeUnlockFarmReward)
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
  async claimReward(amount: UInt64, path: FarmMerkleWitness) {
    const farmReward = new FarmReward(this.address)
    const sender = this.sender.getAndRequireSignature()
    const senderBalance = AccountUpdate.create(sender, farmReward.deriveTokenId())
    senderBalance.account.balance.requireEquals(UInt64.zero)
    const fieldSender = sender.toFields()
    const hash = Poseidon.hash([fieldSender[0], fieldSender[1], amount.value])
    const root = this.merkleRoot.getAndRequireEquals()
    path.calculateRoot(hash).assertEquals(root, "Invalid request")
    this.send({ to: sender, amount: amount })

    // to prevent double withdraw we mint one token once a user withdraw
    this.internal.mint({ address: sender, amount: UInt64.one })
    this.emitEvent("mint", new MintEvent({ sender }))
    this.emitEvent("claim", new ClaimEvent({ user: sender, amount }))
  }

  /**
   * Don't call this method directly
   */
  @method
  async mint(sender: PublicKey) {
    const caller = this.sender.getAndRequireSignature()
    caller.assertEquals(sender)
    // check user never withdraw
    const senderBalance = AccountUpdate.create(sender, this.deriveTokenId())
    senderBalance.account.balance.requireEquals(UInt64.zero)

    this.internal.mint({ address: senderBalance, amount: UInt64.one })
    this.emitEvent("mint", new MintEvent({ sender }))
  }
}
