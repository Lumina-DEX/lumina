<script lang="ts" setup>
import {
  dexMachine,
  fetchPoolTokenList,
  type Networks,
  type TokenDbToken,
  walletMachine
} from "@lumina-dex/sdk"
import { useActor } from "@lumina-dex/sdk/vue"

const Wallet = useActor(walletMachine, {
  inspect: event => {
    // console.log(event)
  }
})

const Dex = useActor(dexMachine, {
  input: {
    wallet: Wallet.actorRef,
    frontendFee: { destination: "", amount: 0 }
  }
})

const walletState = computed(() => Wallet.snapshot.value.value)
const dexState = computed(() => Dex.snapshot.value.value)

const minaBalances = computed(() =>
  Wallet.snapshot.value.context.balances["mina:testnet"]
)
const tokens = ref<TokenDbToken[]>([])

const fetchTokenBalances = async () => {
  const result = await fetchPoolTokenList("mina:testnet")
  console.log(result)
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
    console.log("Wallet Ready")
    fetchTokenBalances()
    end.unsubscribe()
  }
})
</script>
<template>
  <div>Wallet State {{ walletState }}</div>
  <div>Dex State {{ dexState }}</div>
  <div>
    Tokens <pre>{{ tokens  }}</pre>
  </div>
  <div>
    <button @click="fetchTokenBalances">Fetch Balances</button>
    Mina Balances{{ minaBalances }}
  </div>
</template>
