import { Field, Gadgets as RangeCheck, Provable, UInt64 } from "o1js"

/**
 * Function to multiply one Uint64 by another and divide the result,
 * We check for overflow on the final result to avoid a premature overflow error.
 * @param a The multiplicand
 * @param b The multiplier
 * @param denominator The divisor
 * @returns  the quotient and the remainder
 */
export function mulDivMod(a: UInt64, b: UInt64, denominator: UInt64) {
  const x = a.value.mul(b.value)
  let y_ = denominator.value
  if (x.isConstant() && y_.isConstant()) {
    const xn = x.toBigInt()
    const yn = y_.toBigInt()
    const q = xn / yn
    const r = xn - q * yn
    return {
      quotient: new UInt64(q),
      rest: new UInt64(r)
    }
  }
  y_ = y_.seal()
  const q = Provable.witness(Field, () => new Field(x.toBigInt() / y_.toBigInt()))
  RangeCheck.rangeCheckN(UInt64.NUM_BITS, q)
  // TODO: Could be a bit more efficient
  const r = x.sub(q.mul(y_)).seal()
  RangeCheck.rangeCheckN(UInt64.NUM_BITS, r)
  const r_ = new UInt64(r.value)
  const q_ = new UInt64(q.value)
  r_.assertLessThan(new UInt64(y_.value))
  return { quotient: q_, rest: r_ }
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
  return mulDivMod(a, b, denominator).quotient
}
