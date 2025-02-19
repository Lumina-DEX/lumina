"use client"

import "@/styles/globals.css"
import type { AppProps } from "next/app"
import ErrorBoundary from "@/components/ErrorBoundary"
import Layout from "@/components/Layout"
import { type LuminaContext as LC, createDex, createWallet } from "@lumina-dex/sdk"
import { createContext } from "react"

const Wallet = createWallet()

export const feeAmount = 10

const Dex = createDex({
	input: {
		wallet: Wallet,
		frontendFee: {
			destination: "B62qrUAGW6S4pSBcZko2LdbUAhtLd15zVs9KtQedScBvwuZVbcnej35",
			amount: feeAmount
		}
	}
})

const Context: LC = { Dex, Wallet }

export const LuminaContext = createContext(Context)

export default function App({ Component, pageProps }: AppProps) {
	return (
		<ErrorBoundary>
			<LuminaContext.Provider value={Context}>
				<Layout>
					<Component {...pageProps} />
				</Layout>
			</LuminaContext.Provider>
		</ErrorBoundary>
	)
}
