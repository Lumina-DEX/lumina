import { FungibleToken } from "mina-fungible-token"
import {
  AccountUpdate,
  AccountUpdateForest,
  Bool,
  DeployArgs,
  Field,
  MerkleMap,
  MerkleMapWitness,
  method,
  Mina,
  Permissions,
  Poseidon,
  PublicKey,
  Signature,
  SmartContract,
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
  deployPoolRight,
  hasRight,
  Multisig,
  MultisigSigner,
  UpdateAccountInfo,
  updateDelegatorRight,
  UpdateFactoryInfo,
  updateProtocolRight,
  updateSigner,
  UpdateSignerData,
  updateSignerRight,
  verifySignature
} from "./Multisig.js"
import {
  poolDataMainnet,
  poolDataTestnet,
  poolHashMainnet,
  poolHashTestnet,
  poolTokenHolderDataMainnet,
  poolTokenHolderDataTestnet,
  poolTokenHolderHashMainnet,
  poolTokenHolderHashTestnet
} from "./VerificationKey.js"

export type PoolFactoryBase = SmartContract & {
  getPoolVK(): Promise<VerificationKey>
  getPoolTokenHolderVK(): Promise<VerificationKey>
  getProtocol(): Promise<PublicKey>
  getDelegator(): Promise<PublicKey>
  getApprovedSigner(): Promise<Field>
}

/**
 * Interface of current data needed to deploy the pool factory
 */
export interface PoolDeployProps extends Exclude<DeployArgs, undefined> {
  symbol: string
  src: string
  protocol: PublicKey
  delegator: PublicKey
  approvedSigner: Field
  multisig: Multisig
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
export class PoolFactory extends TokenContract implements PoolFactoryBase {
  /**
   * Current verification key of pool contract, can differ between networks
   */
  get vkPool(): VerificationKey {
    if (Mina.getNetworkId() === "mainnet") {
      return new VerificationKey({
        data: poolDataMainnet,
        hash: poolHashMainnet
      })
    } else if (Mina.getNetworkId() === "devnet" || Mina.getNetworkId() === "testnet") {
      return new VerificationKey({
        data: poolDataTestnet,
        hash: poolHashTestnet
      })
    } else {
      throw new Error(`Network ${Mina.getNetworkId()} not supported`)
    }
  }

  /**
   * Current verification key of pool token holder contract, can differ between networks
   */
  get vkPoolTokenHolder(): VerificationKey {
    if (Mina.getNetworkId() === "mainnet") {
      return new VerificationKey({
        data: poolTokenHolderDataMainnet,
        hash: poolTokenHolderHashMainnet
      })
    } else if (Mina.getNetworkId() === "devnet" || Mina.getNetworkId() === "testnet") {
      return new VerificationKey({
        data: poolTokenHolderDataTestnet,
        hash: poolTokenHolderHashTestnet
      })
    } else {
      throw new Error(`Network ${Mina.getNetworkId()} not supported`)
    }
  }

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

    this.account.isNew.requireEquals(new Bool(true))

    const defaultRoot = new MerkleMap().getRoot()
    args.approvedSigner.equals(Field.empty()).assertFalse("Approved signer is empty")
    args.approvedSigner.equals(defaultRoot).assertFalse("Approved signer is empty")

    this.network.globalSlotSinceGenesis.requireBetween(UInt32.zero, args.multisig.info.deadlineSlot)

    const updateSignerData = new UpdateSignerData({
      oldRoot: Field.empty(),
      newRoot: args.approvedSigner,
      deadlineSlot: args.multisig.info.deadlineSlot
    })
    // we need 2 signatures to update signer, prevent to deadlock contract update
    const right = updateSignerRight
    verifySignature(
      args.multisig.signatures,
      args.multisig.info.deadlineSlot,
      updateSigner,
      args.multisig.info,
      args.multisig.info.approvedUpgrader,
      updateSignerData.toFields(),
      right
    )

    this.account.zkappUri.set(args.src)
    this.account.tokenSymbol.set(args.symbol)
    this.approvedSigner.set(args.approvedSigner)
    this.protocol.set(args.protocol)
    this.delegator.set(args.delegator)

    const permissions = Permissions.default()
    permissions.access = Permissions.proof()
    permissions.setPermissions = Permissions.impossible()
    permissions.setVerificationKey = Permissions.VerificationKey.proofDuringCurrentVersion()
    this.account.permissions.set(permissions)
  }

  /**
   * Upgrade to a new version
   * @param multisig multisig data
   * @param vk new verification key
   */
  @method
  async updateVerificationKey(multisig: Multisig, vk: VerificationKey) {
    const deadlineSlot = multisig.info.deadlineSlot
    const approvedSigner = this.approvedSigner.getAndRequireEquals()
    multisig.info.approvedUpgrader.equals(approvedSigner).assertTrue("Incorrect signer list")
    this.network.globalSlotSinceGenesis.requireBetween(UInt32.zero, deadlineSlot)

    const upgradeInfo = new UpdateFactoryInfo({ newVkHash: vk.hash, deadlineSlot })
    multisig.verifyUpdateFactory(upgradeInfo)

    this.account.verificationKey.set(vk)
    this.emitEvent("upgrade", new UpdateVerificationKeyEvent(vk.hash))
  }

  /**
   * Update the list of approved signers
   * @param multisig multisig data
   * @param newRoot merkle root of the new list
   */
  @method
  async updateApprovedSigner(multisig: MultisigSigner, newRoot: Field) {
    const oldRoot = this.approvedSigner.getAndRequireEquals()
    multisig.info.approvedUpgrader.equals(oldRoot).assertTrue("Incorrect signer list")
    const deadlineSlot = multisig.info.deadlineSlot
    this.network.globalSlotSinceGenesis.requireBetween(UInt32.zero, deadlineSlot)

    const upgradeInfo = new UpdateSignerData({ oldRoot, newRoot, deadlineSlot })
    multisig.verifyUpdateSigner(upgradeInfo)

    this.approvedSigner.set(newRoot)
    this.emitEvent("updateSigner", new UpdateSignerEvent(newRoot))
  }

  /**
   * Update the protocol account address
   * @param multisig multisig data
   * @param newUser address of the new protocol collectord
   */
  @method
  async setNewProtocol(multisig: Multisig, newUser: PublicKey) {
    const oldUser = this.protocol.getAndRequireEquals()
    const deadlineSlot = multisig.info.deadlineSlot
    const approvedSigner = this.approvedSigner.getAndRequireEquals()
    multisig.info.approvedUpgrader.equals(approvedSigner).assertTrue("Incorrect signer list")
    this.network.globalSlotSinceGenesis.requireBetween(UInt32.zero, deadlineSlot)

    const right = updateProtocolRight
    const upgradeInfo = new UpdateAccountInfo({ oldUser, newUser, right, deadlineSlot })
    multisig.verifyUpdateProtocol(upgradeInfo)

    this.protocol.set(newUser)
    this.emitEvent("updateProtocol", new UpdateUserEvent(newUser))
  }

  /**
   * Update the delgator address
   * @param multisig multisig data
   * @param newUser address of the new delegator
   */
  @method
  async setNewDelegator(multisig: Multisig, newUser: PublicKey) {
    const oldUser = this.delegator.getAndRequireEquals()
    const deadlineSlot = multisig.info.deadlineSlot
    const approvedSigner = this.approvedSigner.getAndRequireEquals()
    multisig.info.approvedUpgrader.equals(approvedSigner).assertTrue("Incorrect signer list")
    this.network.globalSlotSinceGenesis.requireBetween(UInt32.zero, deadlineSlot)

    const right = updateDelegatorRight
    const upgradeInfo = new UpdateAccountInfo({ oldUser, newUser, right, deadlineSlot })
    multisig.verifyUpdateDelegator(upgradeInfo)

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
   * Get pool verification key
   * @returns the verification key of the pool contract
   */
  @method.returns(VerificationKey)
  async getPoolVK() {
    return this.vkPool
  }

  /**
   * Get pool token holder verification key
   * @returns the verification key of the pool token holder contract
   */
  @method.returns(VerificationKey)
  async getPoolTokenHolderVK() {
    return this.vkPoolTokenHolder
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
    right: Field
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
    right: Field
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
    right: Field,
    isTokenPool: boolean
  ) {
    const tokenAccount = AccountUpdate.create(token, this.deriveTokenId())
    // if the balance is not zero, so a pool already exist for this token
    tokenAccount.account.balance.requireEquals(UInt64.zero)

    // verify the signer has right to create the pool
    signer.equals(PublicKey.empty()).assertFalse("Empty signer")
    const signerHash = Poseidon.hash(signer.toFields())
    const approvedSignerRoot = this.approvedSigner.getAndRequireEquals()
    hasRight(right, deployPoolRight).assertTrue("Insufficient right to deploy a pool")
    const [root, key] = path.computeRootAndKey(Poseidon.hash(right.toFields()))
    root.assertEquals(approvedSignerRoot, "Invalid signer merkle root")
    key.assertEquals(signerHash, "Invalid signer")
    signature.verify(signer, newAccount.toFields()).assertTrue("Invalid signature")

    // create a pool as this new address
    const poolAccount = AccountUpdate.createSigned(newAccount)
    // Require this account didn't already exist
    poolAccount.account.isNew.requireEquals(Bool(true))

    // set pool account vk and permission
    poolAccount.body.update.verificationKey = { isSome: Bool(true), value: this.vkPool }
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
    poolHolderAccount.body.update.verificationKey = { isSome: Bool(true), value: this.vkPoolTokenHolder }
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
}
