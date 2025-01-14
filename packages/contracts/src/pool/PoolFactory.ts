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
  TokenContract,
  TokenId,
  UInt64,
  VerificationKey
} from "o1js"

import { FungibleToken } from "../indexpool.js"

export const contractData =
  "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"
export const contractHash = Field(19886508804440342866369331113486660749272202868627011742798848683469179637118n)
export const contractHolderData =
  "AAAquFdEgAiP0gVQOFC1AYSsV9ylHwU1kj9trP0Iz00FP8zx9+7n59XMLqpjue1wA4VfgD2aXaC4seFCHAfaZwUkB+uHOnxXH7vN8sUeDQi50gWdXzRlzSS1jsT9t+XsQwHNWgMQp04pKmF+0clYz1zwOO95BwHGcQ/olrSYW4tbJCzCu0+M5beMUxHl3qo9fsP2UE6wUyrUH+bkM1NQAsAz0p0Kf7RXT4K2tC3hCxybh9Cj1ZLfvzg03OR4HBo61jF6ax6ymlATB4YBL0ETiEPTE/Qk1zGWUSL2UB6aY45/LlfTLCKlyLq7cR3HOucFfBncVfzI7D8j5n4wVqY+vAI4cf+Yv7iVRLbeFcycXtsuPQntgBzKa/mcqcWuVM7p2SYRrtKdX8EKvOO6NhfLx4x0atAi8pKf+vZR76LSP4iOA8hwXvk6MNvPt1fxCS96ZAKuAzZnAcK+MH1OcKeLj+EHtZmf40WRb3AEG5TWRKuD6DT5noDclZsE8ROZKUSOKAUGIBvt7MpzOWPPchmnromWEevmXo3GoPUZCKnWX6ZLAtJwAszLUgiVS8rx3JnLXuXrtcVFto5FFQhwSHZyzuYZANwlbJsQnR4vVR2/DXGiLerAPVstDnvanaJsAmDJXlIo+1kdY4KirMYR9E9/1aL2bs6YcGGPat+Elwwl/bckcSOudLNGembA1WoZF8XJaqYJfDIFxV6GLIWlPXsRXYpBMtZUfxt3SoH6b/0i0rXfwO+8B0SWo7m4BczsepqyCuwRJ5M/KjfmCc2/EsnV7Mhax350ZtrXdzh/HWIWzEZKKxcbERFbRtf+fkMOOLNpNov1FEFvKOU612vDOIbrVHeBN9mwuepUrJctcfgLc0Mi3Sxs3+NA0I74qm5ktjmplDwgUtKzIs3IrVFv6b1pg/J32HmwNzJZw2fYzpFE1LDjBSK/SX3axwMy5yEd8+jl4uAdQZpa9UQQIHu1Y1ZMgJSDDicXz6D1bZMA1Q2/lU+8AYbldgQVmlLq/lzr63krX+AMQgaMi2k4YuP2FVlrHcQu7EpHvtXtcRLjd5IZbLlsDDhsd97MQUYFpIgj2q8QieE7P/EwbBK/TeOAirB0wBCmPOUF5KDF+PrS7YSyLppXgLC8pr2mxrwLz8DzCsPV4wcwGge4eKC0gBshoykOUN+wWY4ZGtJ4IHrj5eKNtw5Blin59l19FcR35ItoigIxtMfkv3rdlCOeBVI93oVl5esiH8AvYGHhulWIvrNfKol3Viir41zv4qMBOcQg8+ygqjwqREU5+qiYeJlQ2AtT0/PVeZWg4mHC39uz1Lld3N2hyyxRo+Z0nC/8220uuf9gAnQ+JFixgyYW0NowUtuFj+uYAV9Dh/Zpe4LyAOkU0kBW4CEuOxNr+gz+9h0BoPfBHlMuuQAUc5L8uMunJC7uBKZiL+/tT1ZGfyIuqU47fEP9Hghxmip8v7gpf+4wB0MVUUwav9QRe9g88ER1HcJPqYb4EIOc2kbYSX75bT0mAFqR8lwZrj6lbQtNS0QQboG5fzoyYGi8YnSXhC2T5fFDpGJ319GHUsna58o5wk8LMwKWNTxq+FN6XiRgu0BFOrtG6MtT1OxYE9Dti6WatGDsWv+KMLDHjxUK1bhiSRnvkWYNcnuDJ0Ry+PRGHNUijVU0SbchntC2JHdhwKbwIofwKHE8HhvlK8FgQ1VOLDioA26UFzr23LpCTqwSJ7/sAqttNGcPR8MSeeR9TQvXNYQPKrA7Gh720X+7LD6BuHdy4vkcr9EKBU0ccUJ2ABBiyPdji+AgEbUCL/wrp6/GX8pui5YJGWx3XmIFj/RnYS2Je5FZ7w74JclD3XhLUo5Dhpq5RznHplpLB9mNdZdm5269US/XCgC/ZKyUxW3+0ajdBY1cLzF6qglitaYTp3MVUENVOkACM2RyKw6jIK2Leq3qLp6AUz21VXj4WznZcdI8MXqT9v8HxjXbAI9dtbhLRZRpJmu/129vrVmwSTHvsVoA7vXyYh/iO3ZMcy+D1x+HZU6Q/oDYCicqOPHxpSc9QGehmNyeGzI//524Gz3RudkU7s6MPdLWqZrieRTnWsTIrCDieu4ValfP8BFz7asYUv0t9jMWpv3yjbY7c5h8N/m7IUXwTQCzFpjPV7HC72BjVwPaYqh5/oAQsSNcv5I3c2GsCGj5C4hFFoT7eWfVtu/6ibQl0COhRDsegnOBtZ7NGfybI8IIO/4yrgel92bypb3eSxeMvdE5wzURluGDkBVVIACD8C5W1MzqrejUiiTfc3mkLhQ0xKRRhT0qqkmYWlbGN5hmMOA9YaYx8OFTgMys1WbzdidWgEkyvvdkWctGlges6eg/lJE61tJ8wGxvJfKtpyDW/2MRvsnO1+2EXIQ2eV3hkxg="
export const contractHolderHash = Field(3136047689507452170676206666427056446165687414746481324971605397228752520555n)

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

export class UpdateUserEvent extends Struct({
  newUser: PublicKey
}) {
  constructor(
    newUser: PublicKey
  ) {
    super({ newUser })
  }
}

export class UpdateVerificationKeyEvent extends Struct({
  hash: Field
}) {
  constructor(
    hash: Field
  ) {
    super({ hash })
  }
}

export class UpdateSignerEvent extends Struct({
  root: Field
}) {
  constructor(
    root: Field
  ) {
    super({ root })
  }
}

// 2^32 signers approved signer possible
export class SignerMerkleWitness extends MerkleWitness(32) {}

/**
 * Factory who create pools
 */
export class PoolFactory extends TokenContract {
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
    upgrade: UpdateVerificationKeyEvent,
    updateSigner: UpdateSignerEvent,
    updateProtocol: UpdateUserEvent,
    updateDelegator: UpdateUserEvent,
    updateOwner: UpdateUserEvent
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
    this.emitEvent("upgrade", new UpdateVerificationKeyEvent(vk.hash))
  }

  @method
  async updateApprovedSigner(newSigner: Field) {
    await this.getOwnerSignature()
    this.approvedSigner.set(newSigner)
    this.emitEvent("updateSigner", new UpdateSignerEvent(newSigner))
  }

  @method
  async setNewOwner(newOwner: PublicKey) {
    await this.getOwnerSignature()
    // require signature for the new owner to prevent incorrect transfer
    AccountUpdate.createSigned(newOwner)
    this.owner.set(newOwner)
    this.emitEvent("updateOwner", new UpdateUserEvent(newOwner))
  }

  @method
  async setNewProtocol(newProtocol: PublicKey) {
    await this.getOwnerSignature()
    this.protocol.set(newProtocol)
    this.emitEvent("updateProtocol", new UpdateUserEvent(newProtocol))
  }

  @method
  async setNewDelegator(newDelegator: PublicKey) {
    await this.getOwnerSignature()
    this.delegator.set(newDelegator)
    this.emitEvent("updateDelegator", new UpdateUserEvent(newDelegator))
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
    const hash = Poseidon.hashToGroup(fields)
    const publicKey = PublicKey.fromGroup(hash)
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
    path.calculateRoot(signerHash).assertEquals(approvedSignerRoot, "Invalid signer")
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
        setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
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
