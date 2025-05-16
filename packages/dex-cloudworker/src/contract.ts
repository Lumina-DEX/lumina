import {
	SelfProof,
	ZkProgram,
	method,
	Struct,
	TokenContract,
	AccountUpdateForest,
	PublicKey,
	AccountUpdate,
	UInt64,
	Bool,
	Field,
	state,
	State
} from "o1js"

export const limit = 1000

export class AddValue extends Struct({
	value: UInt64,
	limit: UInt64
}) {
	toState() {
		return [this.value.value, this.limit.value]
	}
}

export class AddValueEvent extends Struct({
	addValue: AddValue,
	address: PublicKey
}) {}

export const AddProgram = ZkProgram({
	name: "AddProgram",
	publicOutput: AddValue,

	methods: {
		create: {
			privateInputs: [AddValue],
			async method(addValue: AddValue) {
				addValue.value.assertLessThan(addValue.limit, "Value exceeds limit")
				addValue.value.assertGreaterThan(UInt64.from(0), "Value must be positive")
				return { publicOutput: addValue }
			}
		},

		merge: {
			privateInputs: [SelfProof, SelfProof],
			async method(proof1: SelfProof<void, AddValue>, proof2: SelfProof<void, AddValue>) {
				proof1.verify()
				proof2.verify()
				proof1.publicOutput.limit.assertEquals(proof2.publicOutput.limit)

				return {
					publicOutput: new AddValue({
						value: proof1.publicOutput.value.add(proof2.publicOutput.value),
						limit: proof1.publicOutput.limit
					})
				}
			}
		}
	}
})

export class AddProgramProof extends ZkProgram.Proof(AddProgram) {}

export class AddContract extends TokenContract {
	@state(UInt64) limit = State<UInt64>()

	init() {
		super.init()
		this.limit.set(UInt64.from(limit))
	}

	async approveBase(forest: AccountUpdateForest) {
		throw Error("transfers are not allowed")
	}

	events = {
		addValue: AddValueEvent
	}

	@method async addOne(address: PublicKey, addValue: AddValue) {
		const limit = this.limit.getAndRequireEquals()
		addValue.value.assertLessThan(limit, "Value exceeds limit")
		addValue.value.assertGreaterThan(UInt64.from(0), "Value must be positive")
		await this.createAddValue(address, addValue)
	}

	@method async addMany(address: PublicKey, proof: AddProgramProof) {
		const limit = this.limit.getAndRequireEquals()
		limit.assertEquals(proof.publicOutput.limit)
		proof.verify()
		await this.createAddValue(address, proof.publicOutput)
	}

	async createAddValue(address: PublicKey, addValue: AddValue) {
		const tokenId = this.deriveTokenId()
		const update = AccountUpdate.createSigned(address, tokenId)
		update.account.balance.getAndRequireEquals().assertEquals(UInt64.from(0))
		this.internal.mint({
			address: address,
			amount: addValue.value
		})
		const state = addValue.toState()
		update.body.update.appState = [
			{ isSome: Bool(true), value: state[0] },
			{ isSome: Bool(true), value: state[1] },
			{ isSome: Bool(false), value: Field(0) },
			{ isSome: Bool(false), value: Field(0) },
			{ isSome: Bool(false), value: Field(0) },
			{ isSome: Bool(false), value: Field(0) },
			{ isSome: Bool(false), value: Field(0) },
			{ isSome: Bool(false), value: Field(0) }
		]
		this.emitEvent("addValue", new AddValueEvent({ addValue, address }))
	}
}
