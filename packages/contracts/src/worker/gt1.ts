import { Field, ZkProgram, Proof } from "o1js"

export const Gt1 = ZkProgram({
  name: "gt1",
  publicInput: Field,
  methods: {
    check: {
      privateInputs: [],
      async method(n: Field) {
        n.assertGreaterThan(Field(1))
      }
    }
  }
})

export class Gt1Proof extends Proof<Field, void> {}
