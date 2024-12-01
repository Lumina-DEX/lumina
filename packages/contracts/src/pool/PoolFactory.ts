import { AccountUpdateForest, DeployArgs, VerificationKey } from "o1js"
import {
  AccountUpdate,
  Bool,
  Field,
  method,
  Permissions,
  PublicKey,
  State,
  state,
  Struct,
  TokenContractV2,
  TokenId,
  UInt64
} from "o1js"

import { FungibleToken, PoolData } from "../indexpool.js"

export const contractData =
  "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"
export const contractHash = Field(2443235764604187378858686660653599062000595798680534405393609674246090327173n)
export const contractHolderData =
  "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"
export const contractHolderHash = Field(23522069926848419218668041691296736418746368972160078975771669587518069657386n)

export interface PoolDeployProps extends Exclude<DeployArgs, undefined> {
  symbol: string
  src: string
  poolData: PublicKey
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

/**
 * Factory who create pools
 */
export class PoolFactory extends TokenContractV2 {
  @state(PublicKey)
  poolData = State<PublicKey>()

  events = {
    poolAdded: PoolCreationEvent,
    upgrade: Field
  }

  async deploy(args: PoolDeployProps) {
    await super.deploy(args)
    args.poolData.isEmpty().assertFalse("Pool data empty")

    this.account.zkappUri.set(args.src)
    this.account.tokenSymbol.set(args.symbol)
    this.poolData.set(args.poolData)

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
    const poolDataAddress = this.poolData.getAndRequireEquals()
    const poolData = new PoolData(poolDataAddress)
    const owner = poolData.owner.getAndRequireEquals()

    // only owner can update a pool
    AccountUpdate.createSigned(owner)

    this.account.verificationKey.set(vk)
    this.emitEvent("upgrade", vk.hash)
  }

  @method
  async approveBase(forest: AccountUpdateForest) {
    forest.isEmpty().assertTrue("You can't approve any token operation")
  }

  /**
   * Create a new pool
   * @param newAccount address of the new pool
   * @param token for which the pool is created
   */
  @method
  async createPool(newAccount: PublicKey, token: PublicKey) {
    token.isEmpty().assertFalse("Token is empty")

    const fungibleToken = new FungibleToken(token)

    const tokenAccount = AccountUpdate.create(token, this.deriveTokenId())
    // if the balance is not zero, so a pool already exist for this token
    tokenAccount.account.balance.requireEquals(UInt64.zero)

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

    // set poolAccount initial state, mina is equal to an empty field
    const token0Fields = PublicKey.empty().toFields()
    const token1Fields = token.toFields()
    const poolDataAddress = this.poolData.getAndRequireEquals()
    const poolDataFields = poolDataAddress.toFields()

    poolAccount.body.update.appState = [
      { isSome: Bool(true), value: token0Fields[0] },
      { isSome: Bool(true), value: token0Fields[1] },
      { isSome: Bool(true), value: token1Fields[0] },
      { isSome: Bool(true), value: token1Fields[1] },
      { isSome: Bool(true), value: poolDataFields[0] },
      { isSome: Bool(true), value: poolDataFields[1] },
      { isSome: Bool(true), value: Field(0) },
      { isSome: Bool(true), value: Field(0) }
    ]

    // Liquidity token default name
    poolAccount.account.tokenSymbol.set("LUM")

    // create a token holder as this new address
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

    poolHolderAccount.body.update.appState = [
      { isSome: Bool(true), value: token0Fields[0] },
      { isSome: Bool(true), value: token0Fields[1] },
      { isSome: Bool(true), value: token1Fields[0] },
      { isSome: Bool(true), value: token1Fields[1] },
      { isSome: Bool(true), value: poolDataFields[0] },
      { isSome: Bool(true), value: poolDataFields[1] },
      { isSome: Bool(true), value: Field(0) },
      { isSome: Bool(true), value: Field(0) }
    ]

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

    await fungibleToken.approveAccountUpdate(poolHolderAccount)
    await poolAccount.approve(liquidityAccount)

    const sender = this.sender.getUnconstrainedV2()
    this.emitEvent(
      "poolAdded",
      new PoolCreationEvent({
        sender,
        poolAddress: newAccount,
        token0Address: PublicKey.empty(),
        token1Address: token
      })
    )
  }

  /**
   * Create a new pool
   * @param newAccount address of the new pool
   * @param token for which the pool is created
   */
  @method
  async createPoolToken(newAccount: PublicKey, token0: PublicKey, token1: PublicKey) {
    token0.x.assertLessThan(token1.x, "Token 0 need to be lesser than token 1")
    const fields = token0.toFields().concat(token1.toFields())
    const publicKey = PublicKey.fromFields(fields)

    publicKey.isEmpty().assertFalse("publicKey is empty")

    const tokenAccount = AccountUpdate.create(publicKey, this.deriveTokenId())
    // if the balance is not zero, so a pool already exist for this token
    tokenAccount.account.balance.requireEquals(UInt64.zero)

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
    const token0Fields = token0.toFields()
    const token1Fields = token1.toFields()
    const poolDataAddress = this.poolData.getAndRequireEquals()
    const poolDataFields = poolDataAddress.toFields()

    poolAccount.body.update.appState = [
      { isSome: Bool(true), value: token0Fields[0] },
      { isSome: Bool(true), value: token0Fields[1] },
      { isSome: Bool(true), value: token1Fields[0] },
      { isSome: Bool(true), value: token1Fields[1] },
      { isSome: Bool(true), value: poolDataFields[0] },
      { isSome: Bool(true), value: poolDataFields[1] },
      { isSome: Bool(true), value: Field(0) },
      { isSome: Bool(true), value: Field(0) }
    ]

    // Liquidity token default name
    poolAccount.account.tokenSymbol.set("LUM")

    // create a token holder as this new address
    const tokenId0 = TokenId.derive(token0)
    const tokenId1 = TokenId.derive(token1)
    const poolHolderAccount0 = AccountUpdate.createSigned(newAccount, tokenId0)
    // Require this account didn't already exist
    poolHolderAccount0.account.isNew.requireEquals(Bool(true))

    // set pool token holder account vk and permission
    poolHolderAccount0.body.update.verificationKey = {
      isSome: Bool(true),
      value: { data: contractHolderData, hash: contractHolderHash }
    }
    poolHolderAccount0.body.update.permissions = {
      isSome: Bool(true),
      value: {
        ...Permissions.default(),
        setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
        send: Permissions.proof(),
        setPermissions: Permissions.impossible()
      }
    }

    poolHolderAccount0.body.update.appState = [
      { isSome: Bool(true), value: token0Fields[0] },
      { isSome: Bool(true), value: token0Fields[1] },
      { isSome: Bool(true), value: token1Fields[0] },
      { isSome: Bool(true), value: token1Fields[1] },
      { isSome: Bool(true), value: poolDataFields[0] },
      { isSome: Bool(true), value: poolDataFields[1] },
      { isSome: Bool(true), value: Field(0) },
      { isSome: Bool(true), value: Field(0) }
    ]

    const poolHolderAccount1 = AccountUpdate.createSigned(newAccount, tokenId1)
    // Require this account didn't already exist
    poolHolderAccount1.account.isNew.requireEquals(Bool(true))

    // set pool token holder account vk and permission
    poolHolderAccount1.body.update.verificationKey = {
      isSome: Bool(true),
      value: { data: contractHolderData, hash: contractHolderHash }
    }
    poolHolderAccount1.body.update.permissions = {
      isSome: Bool(true),
      value: {
        ...Permissions.default(),
        setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
        send: Permissions.proof(),
        setPermissions: Permissions.impossible()
      }
    }

    poolHolderAccount1.body.update.appState = [
      { isSome: Bool(true), value: token0Fields[0] },
      { isSome: Bool(true), value: token0Fields[1] },
      { isSome: Bool(true), value: token1Fields[0] },
      { isSome: Bool(true), value: token1Fields[1] },
      { isSome: Bool(true), value: poolDataFields[0] },
      { isSome: Bool(true), value: poolDataFields[1] },
      { isSome: Bool(true), value: Field(0) },
      { isSome: Bool(true), value: Field(0) }
    ]

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

    const fungibleToken0 = new FungibleToken(token0)
    const fungibleToken1 = new FungibleToken(token1)
    await fungibleToken0.approveAccountUpdate(poolHolderAccount0)
    await fungibleToken1.approveAccountUpdate(poolHolderAccount1)
    await poolAccount.approve(liquidityAccount)

    const sender = this.sender.getUnconstrainedV2()
    this.emitEvent(
      "poolAdded",
      new PoolCreationEvent({ sender, poolAddress: newAccount, token0Address: token0, token1Address: token1 })
    )
  }
}
