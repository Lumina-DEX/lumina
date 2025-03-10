import { method, UInt64 } from "o1js"

import { Pool } from "../dist"

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
