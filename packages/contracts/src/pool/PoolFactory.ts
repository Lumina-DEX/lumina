import {
  AccountUpdate,
  AccountUpdateForest,
  Bool,
  DeployArgs,
  Field,
  MerkleWitness,
  method,
  Permissions,
  Poseidon,
  PublicKey,
  Signature,
  State,
  state,
  Struct,
  TokenContractV2,
  TokenId,
  UInt64,
  VerificationKey
} from "o1js"

import { FungibleToken } from "../indexpool.js"

export const contractData =
  "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"
export const contractHash = Field(876216147678504396040857161370670451801793973864230009070326996046852794013n)
export const contractHolderData =
  "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"
export const contractHolderHash = Field(26186233455214888172457609374695469854810783719484094509215890050361421009069n)

export interface PoolDeployProps extends Exclude<DeployArgs, undefined> {
  symbol: string
  src: string
  protocol: PublicKey
  owner: PublicKey
  delegator: PublicKey
  approvedSigner: Field
}

export class PoolCreationEvent extends Struct({
  sender: PublicKey,
  poolAddress: PublicKey,
  token0Address: PublicKey,
  token1Address: PublicKey
}) {
  constructor(value: {
    sender: PublicKey
    poolAddress: PublicKey
    token0Address: PublicKey
    token1Address: PublicKey
  }) {
    super(value)
  }
}

// 32 approved signer possible
export class SignerMerkleWitness extends MerkleWitness(32) {}

/**
 * Factory who create pools
 */
export class PoolFactory extends TokenContractV2 {
  @state(Field)
  approvedSigner = State<Field>()
  @state(PublicKey)
  owner = State<PublicKey>()
  @state(PublicKey)
  protocol = State<PublicKey>()
  @state(PublicKey)
  delegator = State<PublicKey>()

  events = {
    poolAdded: PoolCreationEvent,
    upgrade: Field,
    updateSigner: Field,
    updateProtocol: PublicKey,
    updateDelegator: PublicKey,
    updateOwner: PublicKey
  }

  async deploy(args: PoolDeployProps) {
    await super.deploy(args)
    args.owner.isEmpty().assertFalse("Owner is empty")

    this.account.zkappUri.set(args.src)
    this.account.tokenSymbol.set(args.symbol)
    this.approvedSigner.set(args.approvedSigner)
    this.owner.set(args.owner)
    this.protocol.set(args.protocol)
    this.delegator.set(args.delegator)

    const permissions = Permissions.default()
    permissions.access = Permissions.proofOrSignature()
    permissions.setPermissions = Permissions.impossible()
    permissions.setVerificationKey = Permissions.VerificationKey.proofOrSignature()
    this.account.permissions.set(permissions)
  }

  /**
   * Upgrade to a new version
   * @param vk new verification key
   */
  @method
  async updateVerificationKey(vk: VerificationKey) {
    await this.getOwnerSignature()
    this.account.verificationKey.set(vk)
    this.emitEvent("upgrade", vk.hash)
  }

  @method
  async updateApprovedSigner(newSigner: Field) {
    await this.getOwnerSignature()
    this.approvedSigner.set(newSigner)
    this.emitEvent("updateSigner", newSigner)
  }

  @method
  async setNewOwner(newOwner: PublicKey) {
    await this.getOwnerSignature()
    this.owner.set(newOwner)
    this.emitEvent("updateOwner", newOwner)
  }

  @method
  async setNewProtocol(newProtocol: PublicKey) {
    await this.getOwnerSignature()
    this.protocol.set(newProtocol)
    this.emitEvent("updateProtocol", newProtocol)
  }

  @method
  async setNewDelegator(newDelegator: PublicKey) {
    await this.getOwnerSignature()
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

  @method
  async approveBase(forest: AccountUpdateForest) {
    forest.isEmpty().assertTrue("You can't approve any token operation")
  }

  /**
   * Create a new pool
   * @param newAccount address of the new pool
   * @param token for which the pool is created
   * @param signer who sign the argument
   * @param signature who proves you can deploy this pool (only approved signer or token owner can deploy a pool)
   * @param path merkle witness to check if signer is in the approved list
   */
  @method
  async createPool(
    newAccount: PublicKey,
    token: PublicKey,
    signer: PublicKey,
    signature: Signature,
    path: SignerMerkleWitness
  ) {
    token.isEmpty().assertFalse("Token is empty")
    await this.createAccounts(newAccount, token, PublicKey.empty(), token, signer, signature, path, false)
  }

  /**
   * Create a new pool token
   * @param newAccount address of the new pool
   * @param token 0 of the pool
   * @param token 1 of the pool
   * @param signer who sign the argument
   * @param signature who proves you can deploy this pool (only approved signer or token owner can deploy a pool)
   * @param path merkle witness to check if signer is in the approved list
   */
  @method
  async createPoolToken(
    newAccount: PublicKey,
    token0: PublicKey,
    token1: PublicKey,
    signer: PublicKey,
    signature: Signature,
    path: SignerMerkleWitness
  ) {
    token0.x.assertLessThan(token1.x, "Token 0 need to be lesser than token 1")
    // create an address with the 2 public key as pool id
    const fields = token0.toFields().concat(token1.toFields())
    const publicKey = PublicKey.fromFields(fields)
    publicKey.isEmpty().assertFalse("publicKey is empty")
    await this.createAccounts(newAccount, publicKey, token0, token1, signer, signature, path, true)
  }

  private async createAccounts(
    newAccount: PublicKey,
    token: PublicKey,
    token0: PublicKey,
    token1: PublicKey,
    signer: PublicKey,
    signature: Signature,
    path: SignerMerkleWitness,
    isTokenPool: boolean
  ) {
    const tokenAccount = AccountUpdate.create(token, this.deriveTokenId())
    // if the balance is not zero, so a pool already exist for this token
    tokenAccount.account.balance.requireEquals(UInt64.zero)

    // verify the signer has right to create the pool
    signer.equals(PublicKey.empty()).assertFalse("Empty signer")
    const signerHash = Poseidon.hash(signer.toFields())
    const approvedSignerRoot = this.approvedSigner.getAndRequireEquals()
    const approvedSigner = path.calculateRoot(signerHash).equals(approvedSignerRoot)
    const signerToken0 = signer.equals(token0)
    const signerToken1 = signer.equals(token1)
    approvedSigner.or(signerToken0).or(signerToken1).assertTrue("Invalid signer")
    signature.verify(signer, newAccount.toFields()).assertTrue("Invalid signature")

    // create a pool as this new address
    const poolAccount = AccountUpdate.createSigned(newAccount)
    // Require this account didn't already exist
    poolAccount.account.isNew.requireEquals(Bool(true))

    // set pool account vk and permission
    poolAccount.body.update.verificationKey = { isSome: Bool(true), value: { data: contractData, hash: contractHash } }
    poolAccount.body.update.permissions = {
      isSome: Bool(true),
      value: {
        ...Permissions.default(),
        // only proof to prevent signature owner to steal liquidity
        access: Permissions.proof(),
        setVerificationKey: Permissions.VerificationKey.impossibleDuringCurrentVersion(),
        send: Permissions.proof(),
        setDelegate: Permissions.proof(),
        setPermissions: Permissions.impossible()
      }
    }

    // set poolAccount initial state
    const appState = this.createState(token0, token1)
    poolAccount.body.update.appState = appState

    // Liquidity token default name
    poolAccount.account.tokenSymbol.set("LUM")

    // create a token holder as this new address
    if (isTokenPool) {
      // only pool token need an account at token 0 address
      await this.createPoolHolderAccount(newAccount, token0, appState)
    }
    await this.createPoolHolderAccount(newAccount, token1, appState)

    // create a liquidity token holder as this new address
    const tokenId = TokenId.derive(newAccount)
    const liquidityAccount = AccountUpdate.createSigned(newAccount, tokenId)
    // Require this account didn't already exist
    liquidityAccount.account.isNew.requireEquals(Bool(true))
    liquidityAccount.body.update.permissions = {
      isSome: Bool(true),
      value: {
        ...Permissions.default(),
        setVerificationKey: Permissions.VerificationKey.impossibleDuringCurrentVersion(),
        // This is necessary in order to allow burn circulation supply without signature
        send: Permissions.none(),
        setPermissions: Permissions.impossible()
      }
    }

    // we mint one token to check if this pool exist
    this.internal.mint({ address: tokenAccount, amount: UInt64.one })

    await poolAccount.approve(liquidityAccount)

    const sender = this.sender.getUnconstrainedV2()
    this.emitEvent(
      "poolAdded",
      new PoolCreationEvent({ sender, poolAddress: newAccount, token0Address: token0, token1Address: token1 })
    )
  }

  private createState(token0: PublicKey, token1: PublicKey) {
    const token0Fields = token0.toFields()
    const token1Fields = token1.toFields()
    const poolFactory = this.address.toFields()
    const protocol = this.protocol.getAndRequireEquals()
    const protocolFields = protocol.toFields()

    return [
      { isSome: Bool(true), value: token0Fields[0] },
      { isSome: Bool(true), value: token0Fields[1] },
      { isSome: Bool(true), value: token1Fields[0] },
      { isSome: Bool(true), value: token1Fields[1] },
      { isSome: Bool(true), value: poolFactory[0] },
      { isSome: Bool(true), value: poolFactory[1] },
      { isSome: Bool(true), value: protocolFields[0] },
      { isSome: Bool(true), value: protocolFields[1] }
    ]
  }

  private async createPoolHolderAccount(
    newAccount: PublicKey,
    token: PublicKey,
    appState: { isSome: Bool; value: Field }[]
  ): Promise<AccountUpdate> {
    const fungibleToken = new FungibleToken(token)
    const poolHolderAccount = AccountUpdate.createSigned(newAccount, fungibleToken.deriveTokenId())
    // Require this account didn't already exist
    poolHolderAccount.account.isNew.requireEquals(Bool(true))

    // set pool token holder account vk and permission
    poolHolderAccount.body.update.verificationKey = {
      isSome: Bool(true),
      value: { data: contractHolderData, hash: contractHolderHash }
    }
    poolHolderAccount.body.update.permissions = {
      isSome: Bool(true),
      value: {
        ...Permissions.default(),
        setVerificationKey: Permissions.VerificationKey.impossibleDuringCurrentVersion(),
        send: Permissions.proof(),
        setPermissions: Permissions.impossible()
      }
    }
    poolHolderAccount.body.update.appState = appState
    await fungibleToken.approveAccountUpdate(poolHolderAccount)
    return poolHolderAccount
  }

  private async getOwnerSignature() {
    const owner = this.owner.getAndRequireEquals()
    // only owner can update a pool
    AccountUpdate.createSigned(owner)
  }
}
