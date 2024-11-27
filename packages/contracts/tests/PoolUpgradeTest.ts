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
  State,
  state,
  Struct,
  TokenContractV2,
  TokenId,
  Types,
  UInt64,
  VerificationKey,
} from "o1js"
import { BalanceChangeEvent, FungibleToken, mulDiv, Pool, PoolData, PoolTokenHolder } from "../build/src/indexpool"

/**
 * Pool contract for Lumina dex (Future implementation for direct mina token support)
 */
export class PoolUpgradeTest extends Pool {
  @method.returns(UInt64)
  async version() {
    this.account.balance.requireBetween(UInt64.zero, UInt64.MAXINT())
    return UInt64.from(33)
  }
}
