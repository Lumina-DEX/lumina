import type { Networks } from "@lumina-dex/sdk"

export interface Multisig {
	id: number
	signerId: number
	signature: string
	data: string
	network: Networks
	deadline: number
	createdAt: Date
	signer?: {
		id: number
		publicKey: string
	}
}
