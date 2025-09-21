import "@/styles/globals.css"
import ErrorBoundary from "@/components/ErrorBoundary"
import type { AppProps } from "next/app"
import dynamic from "next/dynamic"

export default function App({ Component, pageProps }: AppProps) {
	const Layout = dynamic(() => import("@/components/Layout"), { ssr: false })

	return (
		<ErrorBoundary>
			<Layout>
				<Component {...pageProps} />
			</Layout>
		</ErrorBoundary>
	)
}
