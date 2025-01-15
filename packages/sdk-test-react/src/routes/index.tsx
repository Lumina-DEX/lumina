import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { LuminaContext } from "../main"
import { useSelector } from "@lumina-dex/sdk/react"
import { fetchPoolTokenList, type Networks, type TokenDbToken } from "@lumina-dex/sdk"

export const Route = createFileRoute("/")({
	component: HomeComponent
})

function HomeComponent() {
	const { Wallet, Dex } = React.useContext(LuminaContext)

	const walletState = useSelector(Wallet, (state) => state.value)
	const dexState = useSelector(Dex, (state) => state.value)

	const minaBalances = useSelector(Wallet, (state) => state.context.balances["mina:testnet"])

	const [tokens, setTokens] = React.useState<TokenDbToken[]>([])

	const fetchTokenBalances = async () => {
		const result = await fetchPoolTokenList("mina:testnet")
		console.log(result)
		setTokens(result.tokens)
		for (const { address, symbol, tokenId, decimals, chainId } of tokens) {
			Wallet.send({
				type: "FetchBalance",
				networks: [chainId as Networks],
				token: { address, decimal: 10 ** decimals, tokenId, symbol }
			})
		}
	}

	React.useEffect(() => {
		Wallet.send({ type: "Connect" })
	}, [Wallet])

	const end = Wallet.subscribe((state) => {
		if (state.value === "READY") {
			console.log("Wallet Ready")
			fetchTokenBalances()
			end.unsubscribe()
		}
	})

	return (
		<div>
			<div>Wallet State {walletState}</div>
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
		</div>
	)
}
