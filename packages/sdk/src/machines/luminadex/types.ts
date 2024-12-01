import type { ProviderError, SendZkTransactionResult } from "@aurowallet/mina-provider"
import type * as Comlink from "comlink"
import type { InitZkappInstance, LuminaDexWorker, MintToken } from "../../dex/luminadex-worker"
import type { Networks, Wallet } from "../wallet"

type DexWorker = Comlink.Remote<LuminaDexWorker>

export interface Token {
	address: string
	amount: string
}

interface ContractContext {
	worker: DexWorker | null
	error: Error | null
}

interface DexContext {
	error: Error | null
	addLiquidity: {
		transactionResult: DexTransactionResult
		calculated: {
			amountAIn: number
			amountBIn: number
			balanceAMax: number
			balanceBMax: number
			liquidity: number
			supplyMin: number
		} | null
	} & AddLiquiditySettings
	removeLiquidity: {
		transactionResult: DexTransactionResult
		calculated: {
			liquidity: number
			amountAOut: number
			amountBOut: number
			balanceAMin: number
			balanceBMin: number
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

type ContractEvent = { type: "InitializeWorker" }

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
	// Claimå
	| { type: "ClaimTokensFromFaucet" }

interface FrontendFee {
	destination: string
	amount: number
}

type WalletEvents =
	| { type: "NetworkChanged"; network: Networks }
	| { type: "AccountChanged"; account: string }

export type LuminaDexMachineEvent = ContractEvent | DexEvent | WalletEvents

export interface LuminaDexMachineContext {
	wallet: { actor: Wallet; account: string; network: Networks }
	dex: DexContext
	contract: ContractContext
	addresses: InitZkappInstance
	frontendFee: FrontendFee
}

export interface LuminaDexMachineInput {
	wallet: Wallet
	addresses: InitZkappInstance
	frontendFee: FrontendFee
}

export interface InputDexWorker {
	worker: DexWorker
}

export interface SwapSettings {
	pool: string
	from: Token
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
	tokenA: Token
	tokenB: Token
	slippagePercent: number
}

export interface PoolSettings {
	tokenA: string
	tokenB: string
}

export interface User {
	user: string
}

export type DexTransactionResult = SendZkTransactionResult | ProviderError | null
