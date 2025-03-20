# React Integration

The LuminaDex SDK provides first-class support for React applications through dedicated hooks and utilities. This guide explains how to integrate the SDK with your React application.

:::info
For a complete example, refer to the [sdk-test-react](https://github.com/Lumina-DEX/lumina/tree/main/packages/sdk-test-react) project in the Lumina DEX monorepo.
:::

## Setting Up the Context Provider

::: tip
Please refer to [xstate documentation](https://stately.ai/docs/xstate-react) for detailled information about the available hooks.
:::

The recommended approach is to use React Context to make the Wallet and DEX actors available throughout your application:

```tsx
import {
	createDex,
	createWallet,
	type LuminaContext as LC
} from "@lumina-dex/sdk"
import { createContext, ReactNode } from "react"

const Wallet = createWallet()

const Dex = createDex({
	input: {
		wallet: Wallet,
		frontendFee: {
			destination: "B62qmdQRb8FKaKA7cwaujmuTBbpp5NXTJFQqL1X9ya5nkvHSuWsiQ1H",
			amount: 1 // 1% fee
		}
	}
})

// This is necessary for type-safety
const Context: LC = { Dex, Wallet }
export const LuminaContext = createContext(Context)

// Start-up your app
const rootElement = document.getElementById("app")

if (!rootElement?.innerHTML) {
	const root = ReactDOM.createRoot(rootElement as HTMLElement)
	root.render(
		<LuminaContext.Provider value={Context}>
			{/* Your app goes here */}
		</LuminaContext.Provider>
	)
}
```

## Using the SDK in Components

The SDK re-exports xstate hooks : Use `useSelector` to efficiently accessing state from the machines:

```tsx
// src/components/WalletConnect.tsx
import { useSelector } from "@lumina-dex/sdk/react"
import { useContext, useEffect } from "react"
import { LuminaContext } from "../providers/LuminaProvider"

export function WalletConnect() {
	// Get the wallet actor from context
	const { Wallet } = useContext(LuminaContext)

	// Use the useSelector hook to access state
	const walletState = useSelector(Wallet, (state) => state.value)
	const isReady = useSelector(Wallet, (state) => state.matches("READY"))
	const account = useSelector(Wallet, (state) => state.context.account)
	const minaBalance = useSelector(
		Wallet,
		(state) => state.context.balances["mina:devnet"]?.MINA || 0
	)

	// Handle connect button click
	const connect = () => Wallet.send({ type: "Connect" })

	// Automatically connect on component mount
	useEffect(() => {
		if (walletState === "INIT") {
			connect()
		}
	}, [walletState])

	return (
		<div>
			{!isReady ? <button onClick={connect}>Connect Wallet</button> : (
				<div>
					<p>Connected: {account}</p>
					<p>MINA Balance: {minaBalance}</p>
				</div>
			)}
		</div>
	)
}
```

## Fetching Token Data

You can fetch token data and update balances as follows:

```tsx
import {
	fetchPoolTokenList,
	type Networks,
	type TokenDbToken
} from "@lumina-dex/sdk"
import { useContext, useEffect, useState } from "react"
import { LuminaContext } from "../providers/LuminaProvider"

export function TokenList() {
	const { Wallet } = useContext(LuminaContext)
	const [tokens, setTokens] = useState<TokenDbToken[]>([])
	const [loading, setLoading] = useState(false)

	const fetchTokens = async () => {
		setLoading(true)
		try {
			// Fetch token list from CDN
			const result = await fetchPoolTokenList("mina:devnet")
			setTokens(result.tokens)

			// Update token balances in wallet
			for (
				const { address, symbol, tokenId, decimals, chainId } of result.tokens
			) {
				Wallet.send({
					type: "FetchBalance",
					networks: [chainId as Networks],
					token: { address, decimal: 10 ** decimals, tokenId, symbol }
				})
			}
		} catch (error) {
			console.error("Failed to fetch tokens:", error)
		} finally {
			setLoading(false)
		}
	}

	// Fetch tokens when wallet is ready
	const [loaded, setLoaded] = useState(false)
	useEffect(() => {
		if (loaded) return
		Wallet.send({ type: "Connect" })
		const end = Wallet.subscribe(() => {
			if (loaded === false) {
				setLoaded(true)
				console.log("Wallet Ready")
				fetchTokens()
				end.unsubscribe()
			}
		})
	}, [Wallet, loaded, fetchTokens])

	return (
		<div>
			<h2>Available Tokens</h2>
			{loading ? <p>Loading tokens...</p> : (
				<ul>
					{tokens.map((token) => (
						<li key={token.tokenId}>
							{token.symbol} - {token.address}
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
```

## Implementing Token Swapping

Here's an example of how to implement a basic token swap component:

```tsx
import { canDoDexAction } from "@lumina-dex/sdk"
import { useSelector } from "@lumina-dex/sdk/react"
import { useContext, useState } from "react"
import { LuminaContext } from "../providers/LuminaProvider"

export function SwapComponent() {
	const { Dex } = useContext(LuminaContext)

	// Form state
	const [pool, setPool] = useState(
		"B62qjGnANmDdJoBhWCQpbN2v3V4CBb5u1VJSCqCVZbpS5uDs7aZ7TCH"
	)
	const [fromAddress, setFromAddress] = useState("MINA")
	const [toAddress, setToAddress] = useState(
		"B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w"
	)
	const [amount, setAmount] = useState("1")
	const [slippage, setSlippage] = useState(0.5)

	// Get current state
	const dexState = useSelector(Dex, (state) => state.value)
	const swapSettings = useSelector(Dex, (state) => state.context.dex.swap)
	const canDo = useSelector(Dex, (state) => canDoDexAction(state.context))

	// Handle calculate swap
	const calculateSwap = () => {
		Dex.send({
			type: "ChangeSwapSettings",
			settings: {
				pool,
				from: {
					address: fromAddress,
					amount
				},
				to: toAddress,
				slippagePercent: slippage
			}
		})
	}

	// Handle execute swap
	const executeSwap = () => {
		Dex.send({ type: "Swap" })
	}

	return (
		<div>
			<h2>Swap Tokens</h2>

			<div>
				<input
					value={pool}
					onChange={(e) => setPool(e.target.value)}
					placeholder="Pool Address"
				/>
			</div>

			<div>
				<input
					value={fromAddress}
					onChange={(e) => setFromAddress(e.target.value)}
					placeholder="From Token Address (or MINA)"
				/>
			</div>

			<div>
				<input
					value={toAddress}
					onChange={(e) => setToAddress(e.target.value)}
					placeholder="To Token Address"
				/>
			</div>

			<div>
				<input
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					placeholder="Amount"
					type="text"
				/>
			</div>

			<div>
				<input
					value={slippage}
					onChange={(e) => setSlippage(Number(e.target.value))}
					placeholder="Slippage (%)"
					type="number"
					min="0.1"
					max="10"
					step="0.1"
				/>
			</div>

			<button
				onClick={calculateSwap}
				disabled={!canDo.changeSwapSettings}
			>
				Calculate Swap
			</button>

			{swapSettings.calculated && (
				<div>
					<p>Expected output: {swapSettings.calculated.amountOut / 1e9}</p>
					<button
						onClick={executeSwap}
						disabled={!canDo.swap}
					>
						Execute Swap
					</button>
				</div>
			)}
		</div>
	)
}
```

## Caveats

There's a few important caveats to mention. If you are using vite, you must configure the dependencies optimizer to play nicely with web workers :

```ts
export default defineConfig({
	optimizeDeps: {
		include: ["@lumina-dex/sdk > react", "@lumina-dex/sdk > @xstate/react"],
		exclude: ["@lumina-dex/sdk"]
	}
})
```

Your devserver/production server MUST use the following headers to use o1js :

```ts
const webWorkerHeaders = {
	"Cross-Origin-Opener-Policy": "same-origin",
	"Cross-Origin-Resource-Policy": "same-site",
	"Cross-Origin-Embedder-Policy": "require-corp"
}
```
