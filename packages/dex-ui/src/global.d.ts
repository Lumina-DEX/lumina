import type Mina from "@aurowallet/mina-provider"

declare module "*.module.css" {
	const classes: { readonly [key: string]: string }
	export default classes
}

declare global {
	interface Window {
		mina: Mina
	}
}
