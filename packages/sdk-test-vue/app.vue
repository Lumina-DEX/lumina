<script lang="ts" setup>
import {
	canDoDexAction,
	dexMachine,
	fetchTokenList,
	type LuminaToken,
	walletMachine
} from "@lumina-dex/sdk"
import { useActor, useSelector } from "@lumina-dex/sdk/vue"
import type { Reactive } from "vue"

const sdkVersion = useRuntimeConfig().public.sdkVersion

const Wallet = useActor(walletMachine)

const Dex = useActor(dexMachine, {
	input: {
		wallet: Wallet.actorRef,
		features: ["Swap"],
		frontendFee: {
			destination: "B62qmdQRb8FKaKA7cwaujmuTBbpp5NXTJFQqL1X9ya5nkvHSuWsiQ1H",
			amount: 1
		}
	}
})

const walletState = computed(() => Wallet.snapshot.value.value)
const dexFullContext = computed(() => Dex.snapshot.value.context.dex)
const dexStatus = computed(() => Dex.snapshot.value.value)
const dexError = computed(() => ({
	dexError: Dex.snapshot.value.context.dex.error,
	contractError: Dex.snapshot.value.context.contract.error
}))
const canDo = computed(() => canDoDexAction(Dex.snapshot.value.context))
const contractStatus = computed(() => ({
	toLoad: Dex.snapshot.value.context.contract.toLoad,
	currentlyLoading: Dex.snapshot.value.context.contract.currentlyLoading,
	loaded: Dex.snapshot.value.context.contract.loaded
}))
const minaBalances = computed(
	() => Wallet.snapshot.value.context.balances["mina:devnet"]
)

const notEmpty = (obj: Reactive<unknown>) =>
	Object.values(obj).every((a) =>
		typeof a === "string" ? a.length > 0 : typeof a === "boolean"
	)

const tokens = ref<LuminaToken[]>([])

/**
 * Swap
 * _____________________________________________________________________________________ */
const swapSettings = computed(() => Dex.snapshot.value.context.dex.swap)
const swapForm = reactive({
	pool: "B62qjGGHziBe9brhAC4zkvQa2dyN7nisKnAhKC7rasGFtW31GiuTZoY",
	fromAddress: "MINA",
	toAddress: "B62qn71xMXqLmAT83rXW3t7jmnEvezaCYbcnb9NWYz85GTs41VYGDha",
	fromAmount: "1",
	slippagePercent: 0.5
})

const handleCalculateSwap = () => {
	Dex.send({
		type: "ChangeSwapSettings",
		settings: {
			pool: swapForm.pool,
			from: {
				address: swapForm.fromAddress,
				amount: swapForm.fromAmount
			},
			to: swapForm.toAddress,
			slippagePercent: swapForm.slippagePercent
		}
	})
}

const handleSwap = () => {
	Dex.send({ type: "Swap" })
}

/**
 * Liquidity
 * _____________________________________________________________________________________ */
const addLiquiditySettings = computed(
	() => Dex.snapshot.value.context.dex.addLiquidity
)
const addLiquidityForm = reactive({
	pool: "B62qjGGHziBe9brhAC4zkvQa2dyN7nisKnAhKC7rasGFtW31GiuTZoY",
	tokenAAddress: "B62qn71xMXqLmAT83rXW3t7jmnEvezaCYbcnb9NWYz85GTs41VYGDha",
	tokenAAmount: "10",
	tokenBAddress: "MINA",
	tokenBAmount: "10",
	slippagePercent: 0.5
})

const removedLiquiditySettings = computed(
	() => Dex.snapshot.value.context.dex.removeLiquidity
)
const removeLiquidityForm = reactive({
	pool: "B62qjGGHziBe9brhAC4zkvQa2dyN7nisKnAhKC7rasGFtW31GiuTZoY",
	lpAmount: "5",
	slippagePercent: 0.5
})

const addLiquidity = () => {
	Dex.send({ type: "AddLiquidity" })
}

const calculateRemoveLiquidity = () => {
	Dex.send({
		type: "ChangeRemoveLiquiditySettings",
		settings: {
			pool: removeLiquidityForm.pool,
			lpAmount: removeLiquidityForm.lpAmount,
			slippagePercent: removeLiquidityForm.slippagePercent
		}
	})
}

const handleAddLiquidity = () => {
	Dex.send({
		type: "ChangeAddLiquiditySettings",
		settings: {
			pool: addLiquidityForm.pool,
			tokenA: {
				address: addLiquidityForm.tokenAAddress,
				amount: addLiquidityForm.tokenAAmount
			},
			tokenB: {
				address: addLiquidityForm.tokenBAddress,
				amount: addLiquidityForm.tokenBAmount
			},
			slippagePercent: addLiquidityForm.slippagePercent
		}
	})
}

const handleRemoveLiquidity = () => {
	Dex.send({ type: "RemoveLiquidity" })
}

/**
 * Pool
 * _____________________________________________________________________________________ */
const deployPoolSettings = computed(
	() => Dex.snapshot.value.context.dex.deployPool
)
const deployTokenSettings = computed(
	() => Dex.snapshot.value.context.dex.deployToken
)

const deployPoolForm = reactive({
	tokenA: "MINA",
	tokenB: "B62qqbQt3E4re5VLpgsQnhDj4R4bYvhXLds1dK9nRiUBRF9wweFxadW",
	manual: false
})

const enableManualDeployPool = () => {
	Dex.send({ type: "LoadFeatures", features: ["ManualDeployPool"] })
}

const handleDeployPool = () => {
	Dex.send({
		type: "DeployPool",
		settings: {
			tokenA: deployPoolForm.tokenA,
			tokenB: deployPoolForm.tokenB
		}
	})
}

// In practice, do not use useSelector in a loop. Create components.
const creatingPool = computed(() => {
	const createPool = Dex.snapshot.value.context.dex.createPool
	return Object.entries(createPool.pools).map(([poolId, pool]) => {
		return {
			id: poolId,
			pool: useSelector(pool, (state) => ({
				status: state.value,
				context: state.context
			}))
		}
	})
})

/**
 * Transactions
 * _____________________________________________________________________________________ */

// In practice, do not use useSelector in a loop. Create components.
const transactions = computed(() => {
	const list = Dex.snapshot.value.context.transactions
	return Object.entries(list).map(([id, actor]) => {
		return {
			id,
			actor: useSelector(actor, (state) => ({
				status: state.value,
				context: state.context
			}))
		}
	})
})
/**
 * Token
 * _____________________________________________________________________________________ */
const deployTokenForm = reactive({ symbol: "" })

const handleDeployToken = () => {
	Dex.send({
		type: "DeployToken",
		settings: {
			symbol: deployTokenForm.symbol
		}
	})
}

const enableDeployToken = () => {
	Dex.send({ type: "LoadFeatures", features: ["DeployToken"] })
}

/**
 * Mint
 * _____________________________________________________________________________________ */
const mintSettings = computed(() => Dex.snapshot.value.context.dex.mint)
const mintForm = reactive({
	to: "",
	token: "",
	amount: 0
})

const handleMintToken = () => {
	Dex.send({
		type: "MintToken",
		settings: {
			to: mintForm.to,
			token: mintForm.token,
			amount: mintForm.amount
		}
	})
}

/**
 * Claim
 * _____________________________________________________________________________________ */
const claimSettings = computed(() => Dex.snapshot.value.context.dex.claim)

const handleClaimFromFaucet = () => {
	Dex.send({ type: "ClaimTokensFromFaucet" })
}

const enableClaim = () => {
	Dex.send({ type: "LoadFeatures", features: ["Claim"] })
}

const fetchTokenBalances = async () => {
	const resultTokens = await fetchTokenList("mina:devnet")
	tokens.value = resultTokens
	Wallet.send({
		type: "FetchBalance",
		network: "mina:devnet",
		tokens: resultTokens.map((token) => ({
			address: token.address,
			decimal: 10 ** token.decimals,
			tokenId: token.tokenId,
			symbol: token.symbol
		}))
	})
}

const end = Wallet.actorRef.subscribe((state) => {
	if (state.value === "READY") {
		fetchTokenBalances()
		end.unsubscribe()
	}
})

onMounted(() => {
	if (Wallet.snapshot.value.matches("INIT")) {
		Wallet.send({ type: "Connect" })
	}
})
</script>

<template>
  <div>
    <h2>Lumina SDK Test v{{ sdkVersion }}</h2>
    <hr>
    {{ contractStatus }}
    <hr>
    {{ dexFullContext }}
    <hr>
    {{ creatingPool }}
    <hr>
    <div>
      <button @click="fetchTokenBalances">Fetch Balances</button>
      <div>Mina Balances: {{ minaBalances }}</div>
    </div>
    <div>Wallet State: {{ walletState }}</div>
    <div>Dex Status: {{ dexStatus }}</div>
    <div>Can Do: {{ canDo }}</div>
    <div>Error: {{ dexError }}</div>
    <h2>Available Tokens</h2>
    <pre>{{ tokens }}</pre>
    <h2>Transactions</h2>
    <pre>{{ transactions }}</pre>
    <h2>Swap</h2>
    <pre>{{ swapSettings }}</pre>
    <div>
      <input v-model="swapForm.pool" placeholder="Pool Address">
      <input v-model="swapForm.fromAddress" placeholder="From Token Address">
      <input v-model="swapForm.toAddress" placeholder="To Token Address">
      <input v-model="swapForm.fromAmount" placeholder="Amount">
      <input
        v-model="swapForm.slippagePercent"
        type="number"
        placeholder="Slippage %"
      >
      <button
        :disabled="!canDo.changeSwapSettings || notEmpty(swapForm)"
        @click="handleCalculateSwap"
      >
        Calculate Swap
      </button>
      <button :disabled="!canDo.swap" @click="handleSwap">Swap</button>
    </div>

    <h2>Add Liquidity</h2>
    <pre>{{ addLiquiditySettings }}</pre>
    <div>
      <input v-model="addLiquidityForm.pool" placeholder="Pool Address">
      <input
        v-model="addLiquidityForm.tokenAAddress"
        placeholder="Token A Address"
      >
      <input
        v-model="addLiquidityForm.tokenAAmount"
        placeholder="Token A Amount"
      >
      <input
        v-model="addLiquidityForm.tokenBAddress"
        placeholder="Token B Address"
      >
      <input
        v-model="addLiquidityForm.tokenBAmount"
        placeholder="Token B Amount"
      >
      <input
        v-model="addLiquidityForm.slippagePercent"
        type="number"
        placeholder="Slippage %"
      >
      <button
        :disabled="!(canDo.changeAddLiquiditySettings
        && notEmpty(addLiquidityForm))"
        @click="handleAddLiquidity"
      >
        Calculate Liquidity
      </button>
      <button :disabled="!canDo.addLiquidity" @click="addLiquidity">
        Add Liquidity
      </button>
    </div>

    <h2>Remove Liquidity</h2>
    <pre>{{ removedLiquiditySettings }}</pre>
    <div>
      <input v-model="removeLiquidityForm.pool" placeholder="Pool Address">
      <input v-model="removeLiquidityForm.lpAmount" placeholder="LP Amount">
      <input
        v-model="removeLiquidityForm.slippagePercent"
        type="number"
        placeholder="Slippage %"
      >
      <button
        :disabled="!(canDo.changeRemoveLiquiditySettings
        && notEmpty(removeLiquidityForm))"
        @click="handleRemoveLiquidity"
      >
        Calculate Remove Liquidity
      </button>
      <button
        :disabled="!canDo.removeLiquidity"
        @click="calculateRemoveLiquidity"
      >
        Remove Liquidity
      </button>
    </div>

    <h2>Deploy</h2>
    <button :disabled="canDo.deployPool" @click="enableManualDeployPool">
      Enable Deploy Pool
    </button>
    <button :disabled="canDo.deployToken" @click="enableDeployToken">
      Enable Deploy Token
    </button>
    <pre>{{ deployPoolSettings }}</pre>
    <pre>{{ deployTokenSettings }}</pre>
    <div>
      <input v-model="deployPoolForm.tokenA" placeholder="Token A Address">
      <input v-model="deployPoolForm.tokenB" placeholder="Token B Address">
      <input v-model="deployPoolForm.manual" type="checkbox" />
      <button :disabled="!(notEmpty(deployPoolForm))" @click="handleDeployPool">
        Deploy Pool
      </button>
    </div>
    <div>
      <input v-model="deployTokenForm.symbol" placeholder="Token Symbol">
      <button
        :disabled="!(canDo.deployToken && notEmpty(deployTokenForm))"
        @click="handleDeployToken"
      >
        Deploy Token
      </button>
    </div>

    <h2>Mint Token</h2>
    <pre>{{ mintSettings }}</pre>
    <div>
      <input v-model="mintForm.to" placeholder="To Address">
      <input v-model="mintForm.token" placeholder="Token Address">
      <input v-model="mintForm.amount" type="number" placeholder="Amount">
      <button
        :disabled="!(canDo.mintToken && notEmpty(mintForm))"
        @click="handleMintToken"
      >
        Mint Token
      </button>
    </div>

    <h2>Faucet</h2>
    <button :disabled="canDo.claim" @click="enableClaim">Enable Claim</button>
    <pre>{{ claimSettings }}</pre>
    <div>
      <button :disabled="!canDo.claim" @click="handleClaimFromFaucet">
        Claim From Faucet
      </button>
    </div>
  </div>
</template>
