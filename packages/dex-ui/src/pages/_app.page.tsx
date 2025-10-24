import "@/styles/globals.css"
import { HydrationBoundary, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { AppProps } from "next/app"
import dynamic from "next/dynamic"
import { useState } from "react"
import ErrorBoundary from "@/components/ErrorBoundary"

export default function App({ Component, pageProps }: AppProps) {
	const Layout = dynamic(() => import("@/components/Layout"), { ssr: false })
	const [queryClient] = useState(() => new QueryClient())

	return (
		<ErrorBoundary>
			<QueryClientProvider client={queryClient}>
				<HydrationBoundary state={pageProps.dehydratedState}>
					<Layout>
						<Component {...pageProps} />
					</Layout>
				</HydrationBoundary>
			</QueryClientProvider>
		</ErrorBoundary>
	)
}
