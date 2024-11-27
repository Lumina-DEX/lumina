import { fetchAccount, Mina, PublicKey } from "o1js"

try {
  // node build/src/call.js
  const devnet = Mina.Network(
    {
      networkId: "testnet",
      mina: "https://devnet.minaprotocol.network/graphql",
    },
  )

  Mina.setActiveInstance(devnet)

  const publicKey = PublicKey.fromBase58("B62qkkjqtrVmRLQhmkCQPw2dwhCZfUsmxCRTSfgdeUPhyTdoMv7h6b9")
  await fetchAccount({ publicKey })
  const balance = Mina.getBalance(publicKey)

  console.log("balance", balance.toBigInt())
} catch (error) {
  console.error(error)
}
