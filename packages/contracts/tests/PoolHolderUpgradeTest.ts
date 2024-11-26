import { Field, Permissions, state, State, method, TokenContractV2, PublicKey, AccountUpdateForest, DeployArgs, UInt64, AccountUpdate, Provable, VerificationKey, TokenId, Account, Bool, Int64, Reducer, Struct, CircuitString, assert, Types } from 'o1js';
import { BalanceChangeEvent, FungibleToken, mulDiv, PoolData, PoolTokenHolder } from '../build/src/indexpool.js';

/**
 * Pool contract for Lumina dex (Future implementation for direct mina token support)
 */
export class PoolHolderUpgradeTest extends PoolTokenHolder {

    @method.returns(UInt64)
    async version() {
        this.account.balance.requireBetween(UInt64.zero, UInt64.MAXINT());
        return UInt64.from(55);
    }
}
