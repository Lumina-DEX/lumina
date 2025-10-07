import { parentPort } from "node:worker_threads"
import { Field } from "o1js"
import { Gt1 } from "./gt1.js"
;(async () => {
  try {
    // message parent -> enfant : { n: string }
    process.on("message", async (msg: any) => {
      try {
        console.time("compile fork gt1")
        await Gt1.compile()
        console.timeEnd("compile fork gt1")
        const n = Field.fromJSON(msg.n)
        const proof = await Gt1.check(n)
        process.send?.({ ok: true, proof: proof.proof.toJSON() })
        process.exit(0)
      } catch (err: any) {
        process.send?.({ ok: false, error: String(err?.message ?? err) })
        process.exit(1)
      }
    })
  } catch (e) {
    process.send?.({ ok: false, error: String(e) })
    process.exit(1)
  }
})()
