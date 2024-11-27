import {
  Account,
  AccountUpdate,
  AccountUpdateForest,
  Bool,
  DeployArgs,
  Field,
  method,
  Permissions,
  Poseidon,
  Provable,
  PublicKey,
  Reducer,
  SmartContract,
  State,
  state,
  UInt64,
  VerificationKey,
} from "o1js"
import { PoolData } from "../build/src/indexpool"

/**
 * Pool informations, use to manage protocol, receiver and verification key update
 */
export class PoolSampleTest extends PoolData {
  @method.returns(UInt64)
  async version() {
    return UInt64.from(2)
  }
}
