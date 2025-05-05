import {
  AccountUpdate,
  AccountUpdateForest,
  Bool,
  DeployArgs,
  Field,
  MerkleMap,
  MerkleMapWitness,
  MerkleWitness,
  method,
  Permissions,
  Poseidon,
  PublicKey,
  Signature,
  State,
  state,
  Struct,
  TokenContract,
  TokenId,
  UInt32,
  UInt64,
  VerificationKey
} from "o1js"

import {
  FungibleToken,
  MultisigInfo,
  MultisigProof,
  SignatureInfo,
  SignatureRight,
  UpdateAccountInfo,
  UpdateFactoryInfo,
  UpdateSignerData,
  verifyProof,
  verifySignature
} from "../indexpool.js"

/**
 * Current verification key of pool contract
 */
export const contractData =
  "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"
/**
 * Current hash of verification key of pool contract
 */
export const contractHash = Field(22088920449266910463544792652207054139709579229651710584203461448689628238245n)
/**
 * Current verification key of pool token holder contract
 */
export const contractHolderData =
  "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"
/**
 * Current hash of verification key of pool token holder contract
 */
export const contractHolderHash = Field(13058873845478387767176880682468944953157545591594557298961883198416093432169n)

/**
 * Interface of current data needed to deploy the pool factory
 */
export interface PoolDeployProps extends Exclude<DeployArgs, undefined> {
  symbol: string
  src: string
  protocol: PublicKey
  delegator: PublicKey
  approvedSigner: Field
  signatures: SignatureInfo[]
  signatureInfo: MultisigInfo
}

/**
 * Event emitted when a new pool is created
 */
export class PoolCreationEvent extends Struct({
  sender: PublicKey,
  signer: PublicKey,
  poolAddress: PublicKey,
  token0Address: PublicKey,
  token1Address: PublicKey
}) {
  constructor(value: {
    sender: PublicKey
    signer: PublicKey
    poolAddress: PublicKey
    token0Address: PublicKey
    token1Address: PublicKey
  }) {
    super(value)
  }
}

/**
 * Event emitted when an address is updated
 */
export class UpdateUserEvent extends Struct({
  newUser: PublicKey
}) {
  constructor(
    newUser: PublicKey
  ) {
    super({ newUser })
  }
}

/**
 * Event emitted when the verification key is updated
 */
export class UpdateVerificationKeyEvent extends Struct({
  hash: Field
}) {
  constructor(
    hash: Field
  ) {
    super({ hash })
  }
}

/**
 * Event emitted when the signer list is updated
 */
export class UpdateSignerEvent extends Struct({
  root: Field
}) {
  constructor(
    root: Field
  ) {
    super({ root })
  }
}

/**
 * Factory who create pools
 */
export class PoolFactory extends TokenContract {
  /**
   * List of signer approved to deploy a new pool
   */
  @state(Field)
  approvedSigner = State<Field>()
  /**
   * Account who collect protocol fees
   */
  @state(PublicKey)
  protocol = State<PublicKey>()
  /**
   * Delegator account for mina pools
   */
  @state(PublicKey)
  delegator = State<PublicKey>()

  /**
   * List of pool factory events
   */
  events = {
    poolAdded: PoolCreationEvent,
    upgrade: UpdateVerificationKeyEvent,
    updateSigner: UpdateSignerEvent,
    updateProtocol: UpdateUserEvent,
    updateDelegator: UpdateUserEvent,
    updateOwner: UpdateUserEvent
  }

  /**
   * Method call when you deploy the pool factory contracts
   * @param args default data stored in the contracts
   */
  async deploy(args: PoolDeployProps) {
    await super.deploy(args)
    const defaultRoot = new MerkleMap().getRoot()
    args.approvedSigner.equals(Field.empty()).assertFalse("Approved signer is empty")
    args.approvedSigner.equals(defaultRoot).assertFalse("Approved signer is empty")

    this.network.globalSlotSinceGenesis.requireBetween(UInt32.zero, args.signatureInfo.deadlineSlot)

    const updateSignerData = new UpdateSignerData({
      oldRoot: Field.empty(),
      newRoot: args.approvedSigner,
      deadlineSlot: args.signatureInfo.deadlineSlot
    })
    // we need 3 signatures to update signer, prevent to deadlock contract update
    const right = SignatureRight.canUpdateSigner()
    verifySignature(
      args.signatures,
      args.signatureInfo.deadlineSlot,
      args.signatureInfo,
      args.signatureInfo.approvedUpgrader,
      updateSignerData.toFields(),
      right
    )

    this.account.zkappUri.set(args.src)
    this.account.tokenSymbol.set(args.symbol)
    this.approvedSigner.set(args.approvedSigner)
    this.protocol.set(args.protocol)
    this.delegator.set(args.delegator)

    let permissions = Permissions.default()
    permissions.access = Permissions.proof()
    permissions.setPermissions = Permissions.impossible()
    permissions.setVerificationKey = Permissions.VerificationKey.proofDuringCurrentVersion()
    this.account.permissions.set(permissions)
  }

  /**
   * Upgrade to a new version
   * @param proof multisig proof
   * @param vk new verification key
   */
  @method
  async updateVerificationKey(proof: MultisigProof, vk: VerificationKey) {
    const deadlineSlot = proof.publicInput.deadlineSlot
    const upgradeInfo = new UpdateFactoryInfo({ newVkHash: vk.hash, deadlineSlot })
    await this.verifyMultisigProof(proof, upgradeInfo.hash(), SignatureRight.canUpdateFactory())

    this.account.verificationKey.set(vk)
    this.emitEvent("upgrade", new UpdateVerificationKeyEvent(vk.hash))
  }

  /**
   * Update the list of approved signers
   * @param proof multisig proof
   * @param newRoot merkle root of the new list
   */
  @method
  async updateApprovedSigner(proof: MultisigProof, newRoot: Field) {
    const oldRoot = this.approvedSigner.getAndRequireEquals()
    const deadlineSlot = proof.publicInput.deadlineSlot
    const upgradeInfo = new UpdateSignerData({ oldRoot, newRoot, deadlineSlot })
    await this.verifyMultisigProof(proof, upgradeInfo.hash(), SignatureRight.canUpdateSigner())

    this.approvedSigner.set(newRoot)
    this.emitEvent("updateSigner", new UpdateSignerEvent(newRoot))
  }

  /**
   * Update the protocol account address
   * @param proof multisig proof
   * @param newUser address of the new protocol collectord
   */
  @method
  async setNewProtocol(proof: MultisigProof, newUser: PublicKey) {
    const oldUser = this.protocol.getAndRequireEquals()
    const deadlineSlot = proof.publicInput.deadlineSlot
    const upgradeInfo = new UpdateAccountInfo({ oldUser, newUser, deadlineSlot })
    await this.verifyMultisigProof(proof, upgradeInfo.hash(), SignatureRight.canUpdateProtocol())

    this.protocol.set(newUser)
    this.emitEvent("updateProtocol", new UpdateUserEvent(newUser))
  }

  /**
   * Update the delgator address
   * @param proof multisig proof
   * @param newUser address of the new delegator
   */
  @method
  async setNewDelegator(proof: MultisigProof, newUser: PublicKey) {
    const oldUser = this.delegator.getAndRequireEquals()
    const deadlineSlot = proof.publicInput.deadlineSlot
    const upgradeInfo = new UpdateAccountInfo({ oldUser, newUser, deadlineSlot })
    await this.verifyMultisigProof(proof, upgradeInfo.hash(), SignatureRight.canUpdateProtocol())

    this.delegator.set(newUser)
    this.emitEvent("updateDelegator", new UpdateUserEvent(newUser))
  }

  /**
   * Get protocol address
   * @returns address of the protocol
   */
  @method.returns(PublicKey)
  async getProtocol() {
    const protocol = this.protocol.getAndRequireEquals()
    return protocol
  }

  /**
   * Get delegator address
   * @returns address of the delegator
   */
  @method.returns(PublicKey)
  async getDelegator() {
    const delegator = this.delegator.getAndRequireEquals()
    return delegator
  }

  /**
   * Get approved signer
   * @returns root of approved signer
   */
  @method.returns(Field)
  async getApprovedSigner() {
    const approvedSigner = this.approvedSigner.getAndRequireEquals()
    return approvedSigner
  }

  /**
   * Method use by token allowance but it's not permissible to use it
   * @param forest account forest to update
   */
  @method
  async approveBase(forest: AccountUpdateForest) {
    forest.isEmpty().assertTrue("You can't approve any token operation")
  }

  /**
   * Create a new mina/token pool
   * @param newAccount address of the new pool
   * @param token token 1 for the mina pool
   * @param signer who sign the argument
   * @param signature who proves you can deploy this pool (only approved signer can deploy a pool)
   * @param path merkle witness to check if signer is in the approved list
   * @param right right of the signer
   */
  @method
  async createPool(
    newAccount: PublicKey,
    token: PublicKey,
    signer: PublicKey,
    signature: Signature,
    path: MerkleMapWitness,
    right: SignatureRight
  ) {
    token.isEmpty().assertFalse("Token is empty")
    await this.createAccounts(newAccount, token, PublicKey.empty(), token, signer, signature, path, right, false)
  }

  /**
   * Create a new token/token pool
   * @param newAccount address of the new pool
   * @param token 0 of the pool
   * @param token 1 of the pool
   * @param signer who sign the argument
   * @param signature who proves you can deploy this pool (only approved signer can deploy a pool)
   * @param path merkle witness to check if signer is in the approved list
   * @param right right of the signer
   */
  @method
  async createPoolToken(
    newAccount: PublicKey,
    token0: PublicKey,
    token1: PublicKey,
    signer: PublicKey,
    signature: Signature,
    path: MerkleMapWitness,
    right: SignatureRight
  ) {
    token0.x.assertLessThan(token1.x, "Token 0 need to be lesser than token 1")
    // create an address with the 2 public key as pool id
    const fields = token0.toFields().concat(token1.toFields())
    const hash = Poseidon.hashToGroup(fields)
    const publicKey = PublicKey.fromGroup(hash)
    publicKey.isEmpty().assertFalse("publicKey is empty")
    await this.createAccounts(newAccount, publicKey, token0, token1, signer, signature, path, right, true)
  }

  private async createAccounts(
    newAccount: PublicKey,
    token: PublicKey,
    token0: PublicKey,
    token1: PublicKey,
    signer: PublicKey,
    signature: Signature,
    path: MerkleMapWitness,
    right: SignatureRight,
    isTokenPool: boolean
  ) {
    let tokenAccount = AccountUpdate.create(token, this.deriveTokenId())
    // if the balance is not zero, so a pool already exist for this token
    tokenAccount.account.balance.requireEquals(UInt64.zero)

    // verify the signer has right to create the pool
    signer.equals(PublicKey.empty()).assertFalse("Empty signer")
    const signerHash = Poseidon.hash(signer.toFields())
    const approvedSignerRoot = this.approvedSigner.getAndRequireEquals()
    right.deployPool.assertTrue("Insufficient right to deploy a pool")
    const [root, key] = path.computeRootAndKey(right.hash())
    root.assertEquals(approvedSignerRoot, "Invalid signer merkle root")
    key.assertEquals(signerHash, "Invalid signer")
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
        setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
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

    const sender = this.sender.getAndRequireSignature()
    this.emitEvent(
      "poolAdded",
      new PoolCreationEvent({ sender, signer, poolAddress: newAccount, token0Address: token0, token1Address: token1 })
    )
  }

  private createState(token0: PublicKey, token1: PublicKey): { isSome: Bool; value: Field }[] {
    let token0Fields = token0.toFields()
    let token1Fields = token1.toFields()
    let poolFactory = this.address.toFields()
    let protocol = this.protocol.getAndRequireEquals()
    let protocolFields = protocol.toFields()

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
        setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
        send: Permissions.proof(),
        setPermissions: Permissions.impossible()
      }
    }
    poolHolderAccount.body.update.appState = appState
    await fungibleToken.approveAccountUpdate(poolHolderAccount)
    return poolHolderAccount
  }

  private async verifyMultisigProof(proof: MultisigProof, messageHash: Field, right: SignatureRight) {
    const merkle = this.approvedSigner.getAndRequireEquals()
    const deadlineSlot = proof.publicInput.deadlineSlot
    // we can update only before the deadline to prevent signature reuse
    this.network.globalSlotSinceGenesis.requireBetween(UInt32.zero, deadlineSlot)
    verifyProof(proof, merkle, messageHash, right)
  }
}
