<script lang="ts" setup>
import {
  canDoDexAction,
  dexMachine,
  fetchPoolTokenList,
  type Networks,
  type TokenDbToken,
  walletMachine
} from "@lumina-dex/sdk"
import { useActor } from "@lumina-dex/sdk/vue"
import type { Reactive } from "vue"

const Wallet = useActor(walletMachine)

const Dex = useActor(dexMachine, {
  input: {
    wallet: Wallet.actorRef,
    frontendFee: {
      destination: "B62qmdQRb8FKaKA7cwaujmuTBbpp5NXTJFQqL1X9ya5nkvHSuWsiQ1H",
      amount: 1
    }
  }
})

const walletState = computed(() => Wallet.snapshot.value.value)
const dexStatus = computed(() => Dex.snapshot.value.value)
const dexError = computed(() => ({
  dexError: Dex.snapshot.value.context.dex.error,
  contractError: Dex.snapshot.value.context.contract.error
}))
const canDo = computed(() => canDoDexAction(Dex.snapshot.value.context))
const minaBalances = computed(() =>
  Wallet.snapshot.value.context.balances["mina:testnet"]
)
const tokens = ref<TokenDbToken[]>([])

// Form states for each operation

const swapSettings = computed(() => Dex.snapshot.value.context.dex.swap)
const swapForm = reactive({
  pool: "B62qjGnANmDdJoBhWCQpbN2v3V4CBb5u1VJSCqCVZbpS5uDs7aZ7TCH",
  fromAddress: "MINA",
  toAddress: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
  fromAmount: "1",
  slippagePercent: 0.5
})

const addLiquiditySettings = computed(() =>
  Dex.snapshot.value.context.dex.addLiquidity
)
const addLiquidityForm = reactive({
  pool: "B62qjGnANmDdJoBhWCQpbN2v3V4CBb5u1VJSCqCVZbpS5uDs7aZ7TCH",
  tokenAAddress: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
  tokenAAmount: "10",
  tokenBAddress: "MINA",
  tokenBAmount: "10",
  slippagePercent: 0.5
})

const removedLiquiditySettings = computed(() =>
  Dex.snapshot.value.context.dex.removeLiquidity
)
const removeLiquidityForm = reactive({
  pool: "B62qjGnANmDdJoBhWCQpbN2v3V4CBb5u1VJSCqCVZbpS5uDs7aZ7TCH",
  tokenAAddress: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
  tokenAAmount: "5",
  tokenBAddress: "MINA",
  tokenBAmount: "5",
  slippagePercent: 0.5
})

const deployPoolSettings = computed(() =>
  Dex.snapshot.value.context.dex.deployPool
)
const deployTokenSettings = computed(() =>
  Dex.snapshot.value.context.dex.deployToken
)

const deployPoolForm = reactive({
  tokenA: "",
  tokenB: ""
})

const deployTokenForm = reactive({ symbol: "" })

const mintSettings = computed(() => Dex.snapshot.value.context.dex.mint)
const mintForm = reactive({
  to: "",
  token: "",
  amount: 0
})

const claimSettings = computed(() => Dex.snapshot.value.context.dex.claim)

// Action handlers
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

const addLiquidity = () => {
  Dex.send({ type: "AddLiquidity" })
}

const calculateRemoveLiquidity = () => {
  Dex.send({
    type: "ChangeRemoveLiquiditySettings",
    settings: {
      pool: removeLiquidityForm.pool,
      tokenA: {
        address: removeLiquidityForm.tokenAAddress,
        amount: removeLiquidityForm.tokenAAmount
      },
      tokenB: {
        address: removeLiquidityForm.tokenBAddress,
        amount: removeLiquidityForm.tokenBAmount
      },
      slippagePercent: removeLiquidityForm.slippagePercent
    }
  })
}

const handleRemoveLiquidity = () => {
  Dex.send({ type: "RemoveLiquidity" })
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

const handleDeployToken = () => {
  Dex.send({
    type: "DeployToken",
    settings: {
      symbol: deployTokenForm.symbol
    }
  })
}

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

const handleClaimFromFaucet = () => {
  Dex.send({ type: "ClaimTokensFromFaucet" })
}

const fetchTokenBalances = async () => {
  const result = await fetchPoolTokenList("mina:testnet")
  tokens.value = result.tokens
  for (const { address, symbol, tokenId, decimals, chainId } of tokens.value) {
    Wallet.send({
      type: "FetchBalance",
      networks: [chainId as Networks],
      token: { address, decimal: 10 ** decimals, tokenId, symbol }
    })
  }
}

onMounted(() => {
  Wallet.send({ type: "Connect" })
})

const end = Wallet.actorRef.subscribe(state => {
  if (state.value === "READY") {
    fetchTokenBalances()
    end.unsubscribe()
  }
})

const notEmpty = (obj: Reactive<unknown>) =>
  Object.values(obj).every(a => typeof a === "string" ? a.length > 0 : true)
</script>

<template>
  <div>
    <h2>Wallet and DEX Status</h2>
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
        :disabled="!(canDo.changeSwapSettings && notEmpty(swapForm))"
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
        :disabled="
          !(canDo.changeAddLiquiditySettings
          && notEmpty(addLiquidityForm))
        "
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
      <input
        v-model="removeLiquidityForm.tokenAAddress"
        placeholder="Token A Address"
      >
      <input
        v-model="removeLiquidityForm.tokenAAmount"
        placeholder="Token A Amount"
      >
      <input
        v-model="removeLiquidityForm.tokenBAddress"
        placeholder="Token B Address"
      >
      <input
        v-model="removeLiquidityForm.tokenBAmount"
        placeholder="Token B Amount"
      >
      <input
        v-model="removeLiquidityForm.slippagePercent"
        type="number"
        placeholder="Slippage %"
      >
      <button
        :disabled="
          !(canDo.changeRemoveLiquiditySettings
          && notEmpty(removeLiquidityForm))
        "
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
    <pre>{{ deployPoolSettings }}</pre>
    <pre>{{ deployTokenSettings }}</pre>
    <div>
      <input v-model="deployPoolForm.tokenA" placeholder="Token A Address">
      <input v-model="deployPoolForm.tokenB" placeholder="Token B Address">
      <button
        :disabled="!(canDo.deployPool && notEmpty(deployPoolForm))"
        @click="handleDeployPool"
      >
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
    <pre>{{ claimSettings }}</pre>
    <div>
      <button :disabled="!canDo.claim" @click="handleClaimFromFaucet">
        Claim From Faucet
      </button>
    </div>
  </div>
</template>
