import { useCallback, useContext, useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { LuminaContext } from "../main"
import { useSelector } from "@lumina-dex/sdk/react"
import { fetchTokenList, type LuminaToken } from "@lumina-dex/sdk"
import { version } from "../../../sdk/package.json" with { type: "json" }

export const Route = createFileRoute("/")({
	component: HomeComponent
})

export function LatestSwapTransaction() {
	const { Dex } = useContext(LuminaContext)
	const lid = useSelector(Dex, (s) => s.context.dex.swap.transactionLid)
	const txActor = useSelector(Dex, (s) => (lid ? s.context.transactions[lid] : undefined))
	const status = useSelector(txActor, (a) => a?.value)
	const result = useSelector(txActor, (a) => a?.context.result)
	if (!lid || !txActor) return null
	if (status === "DONE" && result && !(result instanceof Error)) {
		return (
			<a href={result.url} target="_blank">
				View Tx
			</a>
		)
	}
	return <span>Tx Status: {String(status)}</span>
}

function HomeComponent() {
	const { Wallet, Dex } = useContext(LuminaContext)

	const walletState = useSelector(Wallet, (state) => state.value)
	const dexState = useSelector(Dex, (state) => state.value)
	const minaBalances = useSelector(Wallet, (state) => state.context.balances["mina:devnet"])

	const [tokens, setTokens] = useState<LuminaToken[]>([])

	const fetchTokenBalances = useCallback(async () => {
		const tokens = await fetchTokenList("mina:devnet")
		setTokens(tokens)
		Wallet.send({
			type: "FetchBalance",
			network: "mina:devnet",
			tokens: tokens.map((token) => ({
				address: token.address,
				decimal: 10 ** token.decimals,
				tokenId: token.tokenId,
				symbol: token.symbol
			}))
		})
	}, [Wallet])

	const swapSettings = useCallback(() => {
		Dex.send({
			type: "ChangeSwapSettings",
			settings: {
				pool: "B62qjGGHziBe9brhAC4zkvQa2dyN7nisKnAhKC7rasGFtW31GiuTZoY",
				slippagePercent: 1,
				to: "MINA",
				from: {
					address: "B62qn71xMXqLmAT83rXW3t7jmnEvezaCYbcnb9NWYz85GTs41VYGDha",
					amount: "1",
					decimal: 10 ** 9
				}
			}
		})
	}, [Dex])

	const [loaded, setLoaded] = useState(false)
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		Wallet.send({ type: "Connect" })
		const end = Wallet.subscribe(() => {
			if (loaded === false) {
				setLoaded(true)
				console.log("Wallet Ready")
				fetchTokenBalances()
				end.unsubscribe()
			}
		})
		return end.unsubscribe
	}, [])

	return (
		<div>
			<div>Wallet State {walletState}</div>
			<div>SDK Version {version}</div>
			<div>Dex State {JSON.stringify(dexState)}</div>
			<div>
				Tokens <pre>{JSON.stringify(tokens)}</pre>
			</div>
			<div>
				<button type="button" onClick={fetchTokenBalances}>
					Fetch Balances
				</button>
				Mina Balances{JSON.stringify(minaBalances)}
			</div>
			<div>
				<button type="button" onClick={swapSettings}>
					SwapSettings
				</button>
			</div>
		</div>
	)
}
