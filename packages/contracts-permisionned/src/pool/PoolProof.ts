import {
  AccountUpdate,
  AccountUpdateForest,
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
  Struct,
  TokenContract,
  TokenId,
  Types,
  UInt64,
  VerificationKey
} from "o1js"

import { FungibleToken, mulDiv, PoolFactory, UpdateUserEvent, UpdateVerificationKeyEvent } from "../indexpool.js"

import { checkToken, IPool } from "./IPoolState.js"
import { SideloadedProgramProof } from "./KycProof.js"
import { Pool } from "./Pool.js"

/**
 * Pool contract for Lumina dex (Future implementation for direct mina token support)
 */
export class PoolProof extends Pool {
  @state(Field)
  verifierId = State<Field>()

  async deploy() {
    await super.deploy()

    Bool(false).assertTrue("You can't directly deploy a pool")
  }

  @method.returns(UInt64)
  override async supplyFirstLiquidities(amountMina: UInt64, amountToken: UInt64) {
    return UInt64.zero
  }

  @method.returns(UInt64)
  async supplyFirstLiquiditiesProof(
    amountMina: UInt64,
    amountToken: UInt64,
    proof: SideloadedProgramProof,
    vk: VerificationKey
  ) {
    const sender = this.sender.getAndRequireSignature()
    proof.publicInput.sender.assertEquals(sender)
    proof.verify(vk)

    const liquidityUser = await this.supply(amountMina, amountToken, UInt64.zero, UInt64.zero, UInt64.zero, true, true)
    return liquidityUser
  }

  @method.returns(UInt64)
  override async supplyLiquidity(
    amountMina: UInt64,
    amountToken: UInt64,
    reserveMinaMax: UInt64,
    reserveTokenMax: UInt64,
    supplyMin: UInt64
  ) {
    return UInt64.zero
  }

  @method.returns(UInt64)
  async supplyLiquidityProof(
    amountMina: UInt64,
    amountToken: UInt64,
    reserveMinaMax: UInt64,
    reserveTokenMax: UInt64,
    supplyMin: UInt64,
    proof: SideloadedProgramProof,
    vk: VerificationKey
  ) {
    const sender = this.sender.getAndRequireSignature()
    proof.publicInput.sender.assertEquals(sender)
    proof.verify(vk)

    const liquidityUser = await this.supply(
      amountMina,
      amountToken,
      reserveMinaMax,
      reserveTokenMax,
      supplyMin,
      true,
      false
    )
    return liquidityUser
  }

  @method.returns(UInt64)
  override async supplyFirstLiquiditiesToken(amountToken0: UInt64, amountToken1: UInt64) {
    return UInt64.zero
  }

  @method.returns(UInt64)
  override async supplyLiquidityToken(
    amountToken0: UInt64,
    amountToken1: UInt64,
    reserveToken0Max: UInt64,
    reserveToken1Max: UInt64,
    supplyMin: UInt64
  ) {
    return UInt64.zero
  }

  @method
  override async swapFromTokenToMina(
    frontend: PublicKey,
    taxFeeFrontend: UInt64,
    amountTokenIn: UInt64,
    amountMinaOutMin: UInt64,
    balanceInMax: UInt64,
    balanceOutMin: UInt64
  ) {
  }

  /**
   * Don't call this method directly, use pool token holder or you will just lost mina
   * @param sender use in the previous method
   * @param amountMinaIn mina amount in
   * @param balanceInMax actual reserve max in
   */
  @method
  override async swapFromMinaToToken(
    sender: PublicKey,
    protocol: PublicKey,
    amountMinaIn: UInt64,
    balanceInMax: UInt64
  ) {
  }

  /**
   * Don't call this method directly, use withdrawLiquidity from PoolTokenHolder
   */
  @method.returns(UInt64)
  override async withdrawLiquidity(
    sender: PublicKey,
    liquidityAmount: UInt64,
    amountMinaMin: UInt64,
    reserveMinaMin: UInt64,
    supplyMax: UInt64
  ) {
    return UInt64.zero
  }

  /**
   * Don't call this method directly, use withdrawLiquidityToken from PoolTokenHolder
   */
  @method
  override async burnLiquidityToken(sender: PublicKey, liquidityAmount: UInt64, supplyMax: UInt64) {
  }
}
