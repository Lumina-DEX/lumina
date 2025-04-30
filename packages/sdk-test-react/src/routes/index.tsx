import { useCallback, useContext, useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { LuminaContext } from "../main"
import { useSelector } from "@lumina-dex/sdk/react"
import { fetchTokenList, type LuminaToken } from "@lumina-dex/sdk"
import { version } from "../../../sdk/package.json" with { type: "json" }

export const Route = createFileRoute("/")({
	component: HomeComponent
})

function HomeComponent() {
	const { Wallet, Dex } = useContext(LuminaContext)

	const walletState = useSelector(Wallet, (state) => state.value)
	const dexState = useSelector(Dex, (state) => state.value)

	const minaBalances = useSelector(Wallet, (state) => state.context.balances["mina:devnet"])

	const [tokens, setTokens] = useState<LuminaToken[]>([])

	const fetchTokenBalances = useCallback(async () => {
		const result = await fetchTokenList("mina:devnet")
		setTokens(result.tokens)
		Wallet.send({
			type: "FetchBalance",
			network: "mina:devnet",
			tokens: result.tokens.map((token) => ({
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
				pool: "B62qjGnANmDdJoBhWCQpbN2v3V4CBb5u1VJSCqCVZbpS5uDs7aZ7TCH",
				slippagePercent: 1,
				to: "MINA",
				from: {
					address: "B62qjDaZ2wDLkFpt7a7eJme6SAJDuc3R3A2j2DRw7VMmJAFahut7e8w",
					amount: "1",
					decimal: 10 ** 9
				}
			}
		})
	}, [Dex])

	const [loaded, setLoaded] = useState(false)
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
	}, [Wallet, loaded, fetchTokenBalances])

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
