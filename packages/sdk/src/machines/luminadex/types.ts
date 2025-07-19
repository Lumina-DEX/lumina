import type * as Comlink from "comlink"
import type { ActorRefFrom } from "xstate"
import type { LuminaDexWorker, MintToken } from "../../dex/luminadex-worker"
import type { WalletActorRef } from "../wallet/actors"
import type { WalletEmit } from "../wallet/types"
import type { createPoolMachine } from "./actors/createPool"

export type DexWorker = Comlink.Remote<LuminaDexWorker>

export interface Token {
	address: string
	amount: string
	decimal?: number
}

interface LuminaError {
	message: string
	error: unknown
}

interface ContractContext {
	worker: DexWorker
	loaded: {
		[name in ContractName]: boolean
	}
	toLoad: Set<ContractName>
	currentlyLoading: ContractName | null
	error: LuminaError | null
}

interface DexContext {
	error: LuminaError | null
	addLiquidity: {
		transactionResult: DexTransactionResult
		calculated: {
			tokenA: { address: string; amountIn: number; balanceMax: number }
			tokenB: { address: string; amountIn: number; balanceMax: number }
			liquidity: number
			supplyMin: number
		} | null
	} & AddLiquiditySettings
	removeLiquidity: {
		transactionResult: DexTransactionResult
		calculated: {
			tokenA: { address: string; amountOut: number; balanceMin: number }
			tokenB: { address: string; amountOut: number; balanceMin: number }
			liquidity: number
			supplyMax: number
		} | null
	} & RemoveLiquiditySettings
	swap: {
		transactionResult: DexTransactionResult
		calculated: {
			amountIn: number
			amountOut: number
			balanceOutMin: number
			balanceInMax: number
		} | null
	} & SwapSettings
	mint: Omit<MintToken, "user"> & { transactionResult: DexTransactionResult }
	deployPool: PoolSettings & { transactionResult: DexTransactionResult }
	createPool: PoolSettings & { pools: Record<string, ActorRefFrom<typeof createPoolMachine>> }
	claim: { transactionResult: DexTransactionResult }
	deployToken: {
		symbol: string
		transactionResult: DexTransactionResult
		result: {
			tokenKey: string
			tokenAdminKey: string
			tokenKeyPublic: string
			tokenAdminKeyPublic: string
		} | null
	}
}

type ContractEvent =
	| { type: "LoadContracts" }
	| { type: "LoadNextContract" }
	| { type: "LoadFeatures"; features: DexFeatures }

type DexEvent =
	// Swap
	| { type: "ChangeSwapSettings"; settings: SwapSettings }
	| { type: "Swap" }
	// Remove Liquidity
	| { type: "ChangeRemoveLiquiditySettings"; settings: RemoveLiquiditySettings }
	| { type: "RemoveLiquidity" }
	// Add Liquidity
	| { type: "ChangeAddLiquiditySettings"; settings: AddLiquiditySettings }
	| { type: "AddLiquidity" }
	// Deploy
	| { type: "DeployPool"; settings: PoolSettings }
	| { type: "DeployToken"; settings: { symbol: string } }
	// Mint
	| { type: "MintToken"; settings: Omit<MintToken, "user"> }
	// Claim
	| { type: "ClaimTokensFromFaucet" }

interface FrontendFee {
	destination: string
	amount: number
}

export type LuminaDexMachineEvent = ContractEvent | DexEvent | WalletEmit

export interface Can {
	// [Pool, FungibleToken]
	changeSwapSettings: boolean
	// [Pool, FungibleToken, PoolTokenHolder] calculatedSwap
	swap: boolean
	// [Pool, FungibleToken] calculatedAddLiquidity
	changeAddLiquiditySettings: boolean
	// [Pool, FungibleToken]
	addLiquidity: boolean
	// [Pool, FungibleToken]
	changeRemoveLiquiditySettings: boolean
	// [Pool, FungibleToken, PoolTokenHolder] calculatedRemoveLiquidity
	removeLiquidity: boolean
	// [PoolFactory]
	deployPool: boolean
	// [FungibleToken, FungibleTokenAdmin]
	deployToken: boolean
	// [FungibleToken]
	mintToken: boolean
	// [FungibleToken, Faucet]
	claim: boolean
}

export interface LuminaDexMachineContext {
	features: DexFeatures
	can: Can
	wallet: WalletActorRef
	dex: DexContext
	contract: ContractContext
	frontendFee: FrontendFee
}

type DexFeature = "Swap" | "ManualDeployPool" | "DeployToken" | "Claim"

export type DexFeatures = DexFeature[]

export interface LuminaDexMachineInput {
	wallet: WalletActorRef
	frontendFee: FrontendFee
	features?: DexFeatures
}

export interface InputDexWorker {
	worker: DexWorker
	wallet: WalletActorRef
}

export interface SwapSettings {
	pool: string
	from: Token
	to: string
	slippagePercent: number
}

export interface AddLiquiditySettings {
	pool: string
	tokenA: Token
	tokenB: Token
	slippagePercent: number
}

export interface RemoveLiquiditySettings {
	pool: string
	lpAmount: string
	slippagePercent: number
}

export interface PoolSettings {
	tokenA: string
	tokenB: string
	manual?: boolean
}

export interface User {
	user: string
}

export type ContractName =
	| "PoolFactory"
	| "Pool"
	| "PoolTokenHolder"
	| "FungibleToken"
	| "FungibleTokenAdmin"
	| "Faucet"

export type DexTransactionResult = { hash: string; url: string } | null
