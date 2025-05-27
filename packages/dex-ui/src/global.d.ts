import type Mina from "@aurowallet/mina-provider"

declare global {
	interface Window {
		mina: Mina
	}
}
