import {
  Account,
  AccountUpdate,
  AccountUpdateForest,
  Bool,
  DeployArgs,
  Field,
  method,
  Permissions,
  Provable,
  PublicKey,
  Reducer,
  SmartContract,
  State,
  state,
  UInt64,
  VerificationKey,
} from "o1js"
import { mulDiv } from "../indexpool.js"

export function getAmountOut(amountIn: number, balanceIn: number, balanceOut: number, percent: number) {
  const balanceInMax = balanceIn + balanceIn * percent / 100
  const balanceOutMin = balanceOut - balanceOut * percent / 100

  let amountOut = balanceOutMin * amountIn / (balanceInMax + amountIn)
  // 0.25 % tax
  amountOut = amountOut - amountOut / 400

  // truncate - 1
  amountOut = Math.trunc(amountOut) - 1

  return { amountIn, amountOut, balanceOutMin, balanceInMax }
}

export function getAmountOutUint(amountIn: UInt64, balanceIn: UInt64, balanceOut: UInt64, percent: UInt64) {
  const balanceInMax = balanceIn.add(mulDiv(balanceIn, percent, UInt64.from(100)))
  const balanceOutMin = balanceOut.add(mulDiv(balanceOut, percent, UInt64.from(100)))

  // tax not calculated
  const amountOut = mulDiv(balanceOutMin, amountIn, balanceInMax.add(amountIn))

  return { amountIn, amountOut, balanceOutMin, balanceInMax }
}

export function getAmountLiquidityOut(
  amountAIn: number,
  balanceA: number,
  balanceB: number,
  supply: number,
  percent: number,
) {
  const balanceAMax = balanceA + balanceA * percent / 100
  const balanceBMax = balanceB + balanceB * percent / 100
  const supplyMin = supply - supply * percent / 100

  const liquidityA = Math.trunc(amountAIn * supplyMin / balanceAMax)
  const amountBIn = Math.trunc(liquidityA * balanceBMax / supplyMin)
  const liquidityB = Math.trunc(amountBIn * supplyMin / balanceBMax)

  let liquidity = Math.min(liquidityA, liquidityB)

  // remove 0.1 % protocol tax
  liquidity = liquidity - liquidity / 1000

  // truncate - 1
  liquidity = Math.trunc(liquidity) - 1

  return { amountAIn, amountBIn, balanceAMax, balanceBMax, supplyMin, liquidity }
}

export function getFirstAmountLiquidityOut(amountAIn: number, amountBIn: number) {
  let liquidity = amountAIn + amountBIn

  // remove 0.1 % protocol tax
  liquidity = liquidity - liquidity / 1000

  // truncate - 1
  liquidity = Math.trunc(liquidity) - 1

  // use same return than getAmountLiquidityOut to use same method on supply liquidity
  return { amountAIn, amountBIn, balanceAMax: 0, balanceBMax: 0, supplyMin: 0, liquidity }
}

export function getAmountOutFromLiquidity(
  liquidity: number,
  balanceA: number,
  balanceB: number,
  supply: number,
  percent: number,
) {
  const balanceAMin = balanceA - balanceA * percent / 100
  const balanceBMin = balanceB - balanceB * percent / 100
  const supplyMax = supply + supply * percent / 100

  // truncate - 1
  const amountAOut = Math.trunc(liquidity * balanceAMin / supplyMax) - 1
  const amountBOut = Math.trunc(liquidity * balanceBMin / supplyMax) - 1

  return { amountAOut, amountBOut, balanceAMin, balanceBMin, supplyMax, liquidity }
}
