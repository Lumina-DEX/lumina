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
  MerkleWitness,
  method,
  Permissions,
  Poseidon,
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

export interface FarmingDeployProps extends Exclude<DeployArgs, undefined> {
  pool: PublicKey
  owner: PublicKey
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

// support 65536 different depositor
export class FarmMerkleWitness extends MerkleWitness(65536) {}

/**
 * Farm contract
 */
export class FarmReward extends TokenContractV2 {
  @state(PublicKey)
  owner = State<PublicKey>()
  @state(Field)
  merkleRoot = State<Field>()

  events = {
    upgrade: Field,
    claim: ClaimEvent
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
    permissions.setVerificationKey = Permissions.VerificationKey.proofDuringCurrentVersion()
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

  @method
  async withdrawReward(amount: UInt64, path: FarmMerkleWitness) {
    const sender = this.sender.getAndRequireSignatureV2()
    const senderBalance = AccountUpdate.create(sender, this.deriveTokenId())
    senderBalance.account.balance.requireEquals(UInt64.zero)
    const fieldSender = sender.toFields()
    const hash = Poseidon.hash([fieldSender[0], fieldSender[1], amount.value])
    const root = this.merkleRoot.getAndRequireEquals()
    path.calculateRoot(hash).assertEquals(root, "Invalid request")
    this.send({ to: sender, amount: amount })

    // to prevent double withdraw we mint one token once a user withdraw
    this.internal.mint({ address: senderBalance, amount: UInt64.one })
    this.emitEvent("claim", new ClaimEvent({ user: sender, amount }))
  }

  @method
  async withdrawDust() {
    const sender = this.sender.getAndRequireSignatureV2()
    this.owner.requireEquals(sender)
    // only owner can winthdraw
    const accountBalance = this.account.balance.getAndRequireEquals()
    this.send({ to: sender, amount: accountBalance })
    this.emitEvent("claim", new ClaimEvent({ user: sender, amount: accountBalance }))
  }
}
