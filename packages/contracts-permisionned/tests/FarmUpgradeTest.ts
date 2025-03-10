import { method, SmartContract, UInt64 } from "o1js"

export class FarmUpgradeTest extends SmartContract {
  @method.returns(UInt64)
  async version() {
    this.account.balance.requireBetween(UInt64.zero, UInt64.MAXINT())
    return UInt64.from(112)
  }
}
