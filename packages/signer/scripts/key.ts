import { PrivateKey } from "o1js"

const privateKey = PrivateKey.random()
const publicKey = privateKey.toPublicKey()

const stringPrivateKey = privateKey.toBase58()
PrivateKey.fromBase58(stringPrivateKey)
console.log([stringPrivateKey, publicKey.toBase58()])
