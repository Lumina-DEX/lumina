import ZkappWorkerClient from "@/lib/zkappWorkerClient"
import { Field, PublicKey } from "o1js"
import { create } from "zustand"

interface AccountModel {
	zkappWorkerClient: null | ZkappWorkerClient
	hasWallet: null | boolean
	hasSideos: boolean
	hasBeenSetup: boolean
	accountExists: boolean
	currentNum: null | Field
	publicKey: null | PublicKey
	publicKeyBase58: null | string
	zkappPublicKey: null | PublicKey
	creatingTransaction: boolean
	//
	network: null | string
	balances: { [id: string]: number }
}

interface AccountState extends AccountModel {
	update: (value: Partial<AccountModel>) => void
}

export const InitialAccountState = {
	zkappWorkerClient: null,
	hasWallet: null,
	hasSideos: false,
	hasBeenSetup: false,
	accountExists: false,
	currentNum: null,
	publicKey: null,
	publicKeyBase58: null,
	zkappPublicKey: null,
	creatingTransaction: false,
	network: "",
	balances: {}
}

const useAccount = create<AccountState>((set) => ({
	...InitialAccountState,
	update: (value: Partial<AccountModel>) => {
		console.log("update accountstate")
		set((state) => ({ ...state, ...value }))
	}
}))

export default useAccount
