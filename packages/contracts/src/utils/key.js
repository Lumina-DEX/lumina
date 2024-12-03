import { PrivateKey } from "o1js"

// node src/utils/key.js
for (let index = 0; index < 10; index++) {
  const key = PrivateKey.random()

  console.log("key " + index, {
    public: key.toPublicKey().toBase58(),
    private: key.toBase58()
  })
}
