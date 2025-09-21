import { createDex, createWallet, type LuminaContext as LC } from "@lumina-dex/sdk"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { createContext } from "react"
import ReactDOM from "react-dom/client"
import { routeTree } from "./routeTree.gen"

const Wallet = createWallet()

const Dex = createDex({
	input: {
		wallet: Wallet,
		features: ["Swap"],
		frontendFee: { destination: "", amount: 0 }
	}
})

const Context: LC = { Dex, Wallet }

export const LuminaContext = createContext(Context)

// Set up a Router instance
const router = createRouter({
	routeTree,
	defaultPreload: "intent"
})

// Register things for typesafety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}

const rootElement = document.getElementById("app")

if (!rootElement?.innerHTML) {
	const root = ReactDOM.createRoot(rootElement as HTMLElement)
	root.render(
		<LuminaContext.Provider value={Context}>
			<RouterProvider router={router} />
		</LuminaContext.Provider>
	)
}
