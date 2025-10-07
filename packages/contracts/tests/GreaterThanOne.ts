import { SmartContract, method, Field, DeployArgs } from "o1js"

export class GreaterThanOne extends SmartContract {
  async deploy(args: DeployArgs) {
    await super.deploy(args)
  }
  @method
  async verifyGreaterThanOne(n: Field) {
    n.greaterThan(Field(1)).assertTrue()
  }
}
