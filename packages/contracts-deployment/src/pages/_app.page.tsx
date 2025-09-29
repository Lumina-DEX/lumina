import "@/styles/globals.css"
import type { AppProps } from "next/app"
import "./reactCOIServiceWorker"
import ErrorBoundary from "@/components/ErrorBoundary"
import Layout from "@/components/Layout"

export default function App({ Component, pageProps }: AppProps) {
	return (
		<ErrorBoundary>
			<Layout>
				<Component {...pageProps} />
			</Layout>
		</ErrorBoundary>
	)
}
