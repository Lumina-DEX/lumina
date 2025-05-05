# Vue Integration

The LuminaDex SDK provides first-class support for Vue applications through dedicated composables and utilities. This guide explains how to integrate the SDK with your Vue application.

::: info
For a complete example, refer to the [sdk-test-vue](https://github.com/Lumina-DEX/lumina/tree/main/packages/sdk-test-vue) project in the Lumina DEX monorepo.
:::

## Setting Up

::: info
Refer to [xstate vue documentation](https://stately.ai/docs/xstate-vue) for a list of available features.
:::

In a setup function, run :

```ts
import {
	dexMachine,
	type LuminaContext as LC,
	walletMachine
} from "@lumina-dex/sdk"
import { useActor } from "@lumina-dex/sdk/vue"
import { createSharedComposable } from "@vueuse/core"

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
```

You can use `createSharedComposable` from VueUse or `defineStore` from Pinia to share stateful logic between different components.

## Using the SDK in Components

In your Vue components:

```vue
<script setup lang="ts">
import { useLuminaDex } from "../composables/useLuminaDex"
import { onMounted, computed } from "vue"

// Get the actors
const { Wallet, Dex } = useLuminaDex()

// Access wallet state with computed properties. You can also use `useSelector`.
const walletState = computed(() => Wallet.snapshot.value.value)
const isReady = computed(() => Wallet.snapshot.value.matches("READY"))
const account = computed(() => Wallet.snapshot.value.context.account)
const minaBalance = computed(() => 
  Wallet.snapshot.value.context.balances["mina:devnet"]?.MINA || 0
)

// Connect to wallet on component mount
onMounted(() => {
  if (walletState.value === "INIT") {
    Wallet.send({ type: "Connect" })
  }
})

// Handle manual connect
const connect = () => Wallet.send({ type: "Connect" })
</script>

<template>
  <div>
    <div v-if="!isReady">
      <button @click="connect">Connect Wallet</button>
    </div>
    <div v-else>
      <p>Connected: {{ account }}</p>
      <p>MINA Balance: {{ minaBalance }}</p>
    </div>
  </div>
</template>
```

## Fetching Token Data

Here's how to fetch token data and update balances in a Vue component:

```vue
<script setup lang="ts">
import { useLuminaDex } from "../composables/useLuminaDex"
import { fetchTokenList, type Networks, type LuminaToken } from "@lumina-dex/sdk"
import { onMounted, ref, watch } from "vue"

const { Wallet } = useLuminaDex()
const tokens = ref<LuminaToken[]>([])

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

// Watch for wallet ready state
const end = Wallet.actorRef.subscribe(state => {
  if (state.value === "READY") {
    fetchTokenBalances()
    end.unsubscribe()
  }
})
</script>

<template>
  <div>
    <h2>Available Tokens</h2>
    <div v-if="loading">Loading tokens...</div>
    <ul v-else>
      <li v-for="token in tokens" :key="token.tokenId">
        {{ token.symbol }} - {{ token.address }}
      </li>
    </ul>
    <button @click="fetchTokens">Refresh Tokens</button>
  </div>
</template>
```

## Implementing Token Swapping

Here's an example of a token swap component in Vue:

```vue
<script setup lang="ts">
import { useLuminaDex } from "../composables/useLuminaDex"
import { canDoDexAction } from "@lumina-dex/sdk"
import { computed, reactive } from "vue"

const { Dex } = useLuminaDex()

// Form state using reactive
const swapForm = reactive({
  pool: "B62qjGnANmDdJoBhWCQpbN2v3V4CBb5u1VJSCqCVZbpS5uDs7aZ7TCH",
  fromAddress: "MINA",
  toAddress: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
  fromAmount: "1",
  slippagePercent: 0.5
})

// Computed properties for state access
const dexState = computed(() => Dex.snapshot.value.value)
const swapSettings = computed(() => Dex.snapshot.value.context.dex.swap)
const canDo = computed(() => canDoDexAction(Dex.snapshot.value.context))
const dexError = computed(() => ({
  dexError: Dex.snapshot.value.context.dex.error,
  contractError: Dex.snapshot.value.context.contract.error
}))

// Form validation
const isValid = computed(() => 
  swapForm.pool && 
  swapForm.fromAddress && 
  swapForm.toAddress && 
  swapForm.fromAmount && 
  swapForm.slippagePercent > 0
)

// Handle calculate swap
const calculateSwap = () => {
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

// Handle execute swap
const executeSwap = () => {
  Dex.send({ type: "Swap" })
}
</script>

<template>
  <div>
    <h2>Swap Tokens</h2>
    
    <div v-if="dexError.dexError || dexError.contractError" class="error">
      <p>Error: {{ dexError.dexError?.message || dexError.contractError?.message }}</p>
    </div>
    
    <div class="form-group">
      <label>Pool Address</label>
      <input v-model="swapForm.pool" placeholder="Pool Address" />
    </div>
    
    <div class="form-group">
      <label>From Token</label>
      <input v-model="swapForm.fromAddress" placeholder="From Token Address (or MINA)" />
    </div>
    
    <div class="form-group">
      <label>To Token</label>
      <input v-model="swapForm.toAddress" placeholder="To Token Address" />
    </div>
    
    <div class="form-group">
      <label>Amount</label>
      <input v-model="swapForm.fromAmount" placeholder="Amount" type="text" />
    </div>
    
    <div class="form-group">
      <label>Slippage (%)</label>
      <input 
        v-model="swapForm.slippagePercent" 
        placeholder="Slippage %" 
        type="number" 
        min="0.1" 
        max="10" 
        step="0.1" 
      />
    </div>
    
    <button 
      @click="calculateSwap" 
      :disabled="!(canDo.changeSwapSettings && isValid)"
    >
      Calculate Swap
    </button>
    
    <div v-if="swapSettings.calculated" class="swap-result">
      <p>Expected output: {{ swapSettings.calculated.amountOut / 1e9 }}</p>
      <button 
        @click="executeSwap" 
        :disabled="!canDo.swap"
      >
        Execute Swap
      </button>
    </div>
    
    <div v-if="swapSettings.transactionResult" class="transaction-result">
      <h3>Transaction Completed</h3>
      <pre>{{ swapSettings.transactionResult }}</pre>
    </div>
  </div>
</template>
```

## Caveats

There's a few important caveats to mention. If you are using vite, you must configure the dependencies optimizer to play nicely with web workers :

```ts
export default defineConfig({
	optimizeDeps: {
		include: ["@lumina-dex/sdk > react", "@lumina-dex/sdk > @xstate/react"],
		exclude: ["@lumina-dex/sdk"]
	}
})
```

Your devserver/production server MUST use the following headers to use o1js :

```ts
const webWorkerHeaders = {
	"Cross-Origin-Opener-Policy": "same-origin",
	"Cross-Origin-Resource-Policy": "same-site",
	"Cross-Origin-Embedder-Policy": "require-corp"
}
```
