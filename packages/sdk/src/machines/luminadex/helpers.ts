import { hash } from "ohash"
import type { ActionArgs, ErrorActorEvent } from "xstate"
import { luminadexFactories } from "../../constants"
import { createLogger } from "../../helpers/debug"
import type { TransactionMachineInput } from "../transaction"
import type {
	Can,
	ContractName,
	DexFeatures,
	LuminaDexMachineContext,
	LuminaDexMachineEvent,
	Token
} from "./types"

export const { act, logger } = createLogger("[DEX]")

export const amount = (token: Token) => Number.parseFloat(token.amount) * (token.decimal ?? 1e9)

export const setToLoadFromFeatures = (features: DexFeatures) => {
	const toLoad = new Set<ContractName>([])
	if (features.includes("Swap")) {
		toLoad.add("FungibleToken")
		toLoad.add("Pool")
		toLoad.add("PoolTokenHolder")
	}
	if (features.includes("ManualDeployPool")) {
		toLoad.add("PoolFactory")
	}
	if (features.includes("DeployToken")) {
		toLoad.add("FungibleToken")
		toLoad.add("FungibleTokenAdmin")
	}
	if (features.includes("Claim")) {
		toLoad.add("FungibleToken")
		toLoad.add("Faucet")
	}
	return toLoad
}

export const walletNetwork = (c: LuminaDexMachineContext) =>
	c.wallet.getSnapshot().context.currentNetwork

export const walletUser = (c: LuminaDexMachineContext) => c.wallet.getSnapshot().context.account

export const inputWorker = (c: LuminaDexMachineContext) => ({
	worker: c.contract.worker
})

export const luminaDexFactory = (c: LuminaDexMachineContext) => luminadexFactories[walletNetwork(c)]

export const inputCompile = (
	{ context, contract }: { contract: ContractName; context: LuminaDexMachineContext }
) => ({ worker: context.contract.worker, contract })

export const loaded = (
	{ context, contract }: { contract: ContractName; context: LuminaDexMachineContext }
) => {
	return {
		contract: {
			...context.contract,
			currentlyLoading: null,
			loaded: { ...context.contract.loaded, [contract]: true }
		}
	}
}

export const setContractError = (message: string) =>
(
	{ context, event }: ActionArgs<LuminaDexMachineContext, ErrorActorEvent, LuminaDexMachineEvent>
) => {
	return { contract: { ...context.contract, error: { message, error: event.error } } }
}

export const setDexError = (message: string) =>
(
	{ context, event }: ActionArgs<LuminaDexMachineContext, ErrorActorEvent, LuminaDexMachineEvent>
) => {
	return { dex: { ...context.dex, error: { message, error: event.error } } }
}

export const createTransactionInput = (
	{ context, transaction }: { context: LuminaDexMachineContext; transaction: string }
): TransactionMachineInput => {
	const id = hash(transaction)
	return {
		id,
		transaction,
		wallet: context.wallet,
		worker: context.contract.worker
	}
}

export const resetSettings = { calculated: null, transactionLid: null } as const

/**
 * Verify if the contracts are loaded for a given action.
 */
export const canStartDexAction = (context: LuminaDexMachineContext) => {
	const loaded = context.contract.loaded
	return {
		changeSwapSettings: loaded.Pool && loaded.FungibleToken,
		swap: loaded.Pool && loaded.FungibleToken,
		changeAddLiquiditySettings: loaded.Pool && loaded.FungibleToken,
		addLiquidity: loaded.Pool && loaded.FungibleToken,
		changeRemoveLiquiditySettings: loaded.Pool && loaded.FungibleToken,
		removeLiquidity: loaded.Pool && loaded.FungibleToken && loaded.PoolTokenHolder,
		deployPool: loaded.PoolFactory,
		deployToken: loaded.FungibleToken && loaded.FungibleTokenAdmin,
		mintToken: loaded.FungibleToken,
		claim: loaded.FungibleToken && loaded.Faucet
	} satisfies Record<keyof Can, boolean>
}

/**
 * Verify if the user can perform a Dex action based on loaded contracts and calculated values.
 */
export const canDoDexAction = (context: LuminaDexMachineContext) => {
	const start = canStartDexAction(context)
	return {
		...start,
		addLiquidity: start.addLiquidity && context.dex.addLiquidity.calculated !== null,
		removeLiquidity: start.removeLiquidity && context.dex.removeLiquidity.calculated !== null,
		swap: start.swap && context.dex.swap.calculated !== null
	}
}
