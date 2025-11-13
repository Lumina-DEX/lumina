import type { Networks } from "@lumina-dex/sdk"

export interface SignerNetwork {
	id: number
	signerId: number
	network: Networks
	permission: number
	active: boolean
	createdAt: Date
}

export interface Signer {
	id: number
	publicKey: string
	createdAt: Date
	networks?: SignerNetwork[]
}
