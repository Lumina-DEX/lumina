import { describe, it, expect, beforeAll } from "vitest"
import { fork } from "node:child_process"
import { Field } from "o1js"
import { fileURLToPath } from "node:url"
import path from "node:path"
import { Gt1 } from "../src/worker/Gt1"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function runFork(n: Field) {
  return new Promise((resolve, reject) => {
    // On fork le worker ***compilé en JS***
    const workerPath = path.resolve(__dirname, "../dist/index.js")
    const child = fork(workerPath, { stdio: ["inherit", "inherit", "inherit", "ipc"] })

    child.once("message", (msg: any) => {
      if (msg?.ok) resolve(msg.proof)
      else reject(new Error(msg?.error ?? "unknown worker error"))
    })
    child.once("error", reject)
    child.once("exit", (code) => {
      if (code !== 0) {
        // si on n'a rien reçu, on rejette
        // (inutile si 'message' déjà traité)
      }
    })

    child.send({ n: n.toJSON() })
  })
}

describe("Worker", () => {
  beforeAll(async () => {
    console.time("compile gt1")
    await Gt1.compile()
    console.timeEnd("compile gt1")
  })

  it("No worker", async () => {
    const proof = await Gt1.check(Field(2))
    await proof.proof.verify()
  }, 180_000)

  it("Prove 3 in parrallel", async () => {
    const n1 = Field(2)
    const n2 = Field(3)
    const n3 = Field(5)

    const [proofJson1, proofJson2, proofJson3]: any = await Promise.all([runFork(n1), runFork(n2), runFork(n3)])

    const p1 = await Gt1.Proof.fromJSON(proofJson1)
    const p2 = await Gt1.Proof.fromJSON(proofJson2)
    const p3 = await Gt1.Proof.fromJSON(proofJson3)

    await p1.verify()
    await p2.verify()
    await p3.verify()
  }, 180_000)

  it("Prove 3 in serial", async () => {
    const n1 = Field(2)
    const n2 = Field(3)
    const n3 = Field(5)

    const p1 = await Gt1.check(n1)
    const p2 = await Gt1.check(n2)
    const p3 = await Gt1.check(n3)

    await p1.proof.verify()
    await p2.proof.verify()
    await p3.proof.verify()
  }, 180_000)
})
