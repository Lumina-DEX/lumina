import { PublicKey, State } from "o1js";

/**
 * Data needed by pool and pool token
 */
export interface IPool {
    token0: State<PublicKey>;
    token1: State<PublicKey>;
    poolFactory: State<PublicKey>;
}

export function checkToken(pool: IPool, isMinaPool: boolean): [PublicKey, PublicKey] {
    const token0 = pool.token0.getAndRequireEquals();
    const token1 = pool.token1.getAndRequireEquals();
    // token 0 need to be empty on mina pool
    token0.equals(PublicKey.empty()).assertEquals(isMinaPool, isMinaPool ? "Not a mina pool" : "Invalid token 0 address");
    token1.equals(PublicKey.empty()).assertFalse("Invalid token 1 address");
    return [token0, token1];
}