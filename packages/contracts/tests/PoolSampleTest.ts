import { method, UInt64 } from "o1js"

import { PoolData } from "../dist"

/**
 * Pool informations, use to manage protocol, receiver and verification key update
 */
export class PoolSampleTest extends PoolData {
  @method.returns(UInt64)
  async version() {
    return UInt64.from(2)
  }
}
