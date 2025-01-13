import { Field, Provable, Gadgets as RangeCheck, UInt64 } from "o1js";

/**
 * Function to multiply one Uint64 by another and divide the result,
 * We check for overflow on the final result to avoid a premature overflow error.
 * @param a The multiplicand
 * @param b The multiplier 
 * @param denominator The divisor
 * @returns  the quotient and the remainder
 */
export function mulDivMod(a: UInt64, b: UInt64, denominator: UInt64): { quotient: UInt64, rest: UInt64 } {
    let x = a.value.mul(b.value);
    let y_ = denominator.value;
    if (x.isConstant() && y_.isConstant()) {
        let xn = x.toBigInt();
        let yn = y_.toBigInt();
        let q = xn / yn;
        let r = xn - q * yn;
        return {
            quotient: new UInt64(q),
            rest: new UInt64(r),
        };
    }
    y_ = y_.seal();
    let q = Provable.witness(UInt64, () => {
        const result = new Field(x.toBigInt() / y_.toBigInt());
        return UInt64.Unsafe.fromField(result)
    });
    let r = x.sub(q.value.mul(y_)).seal();
    RangeCheck.rangeCheckN(UInt64.NUM_BITS, r);
    let r_ = new UInt64(r.value);
    r_.assertLessThan(new UInt64(y_.value));
    return { quotient: q, rest: r_ };
}

/**
 * Function to multiply one Uint64 by another and divide the result,
 * We check for overflow on the final result to avoid a premature overflow error.
 * @param a The multiplicand
 * @param b The multiplier 
 * @param denominator The divisor
 * @returns The 64-bit result 
 */
export function mulDiv(a: UInt64, b: UInt64, denominator: UInt64): UInt64 {
    return mulDivMod(a, b, denominator).quotient;
}
