import "@/styles/globals.css"
import type { AppProps } from "next/app"
import ErrorBoundary from "@/components/ErrorBoundary"
import Layout from "@/components/Layout"
import { type LuminaContext as LC, createDex, createWallet } from "@lumina-dex/sdk"
import { createContext } from "react"

const Wallet = createWallet()

const Dex = createDex({
	input: {
		wallet: Wallet,
		frontendFee: { destination: "", amount: 0 }
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
