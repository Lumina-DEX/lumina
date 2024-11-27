import useAccount from "@/states/useAccount"
import { UInt64 } from "o1js"

export const mina = typeof window !== "undefined" && (window as any)?.mina

export const MINA_SUB_DECIMAL: number = 1e9
const WALLET_CONNECTED_BEFORE_FLAG: string = "wallet_connected_before"

type ChainInfoArgs = {
	networkID: string
}

export const zekoTestnet = "zeko:testnet"
export const minaTestnet = "mina:testnet"

export async function connect() {
	if (!mina) return
	await requestNetwork()
	await requestAccounts()

	typeof window !== "undefined" && window.localStorage.setItem(WALLET_CONNECTED_BEFORE_FLAG, "true")

	mina.on("accountsChanged", requestAccounts)
	mina.on("chainChanged", requestNetwork)
}

export async function disconnect() {
	useAccount.setState(() => ({
		balances: {},
		hasBeenSetup: false,
		publicKeyBase58: null,
		kycVerified: false
	}))
}

async function requestNetwork() {
	await mina
		.requestNetwork()
		.then(handleChainChanged)
		.catch((e: any) => console.error(e))
}

async function handleChainChanged(newChain: ChainInfoArgs) {
	console.log("newchain", newChain)
	const state = useAccount.getState()
	if (newChain?.networkID == zekoTestnet) {
		console.log("switc to zeko")
		state.zkappWorkerClient.setActiveInstanceToZeko()
	} else {
		console.log("switc to testnet")
		state.zkappWorkerClient.setActiveInstanceToDevnet()
	}
	await requestAccounts()
	useAccount.setState(() => ({ network: newChain?.networkID }))
}

export async function requestAccounts() {
	await mina
		.requestAccounts()
		.then(handleAccountsChanged)
		.catch((e: any) => console.error(e))
}

export async function switchChain(newNetwork: string) {
	const ret = await mina.switchChain({ networkID: newNetwork })
	return ret
}

async function handleAccountsChanged(accounts: string[]) {
	let publicKeyBase58: string = ""
	let walletConnected: boolean = false

	if (accounts?.length > 0) {
		publicKeyBase58 = accounts[0]
		console.log("user", publicKeyBase58)
		await setupWorkerClient(publicKeyBase58)
		walletConnected = true
	} else {
		typeof window !== "undefined" &&
			window.localStorage.setItem(WALLET_CONNECTED_BEFORE_FLAG, "false")
	}
	useAccount.setState(() => ({
		publicKeyBase58
	}))
}

async function setupWorkerClient(publicKeyBase58: string) {
	try {
		const state = useAccount.getState()
		// check if connected user account exists or not
		const res = await state.zkappWorkerClient!.fetchAccount({
			publicKeyBase58
		})
		const accountExists = !res.error
		useAccount.setState((state) => ({ accountExists }))

		// get account balance if account exists
		if (accountExists) {
			// toka token id
			const tokenId = "wTRtTRnW7hZCQSVgsuMVJRvnS1xEAbRRMWyaaJPkQsntSNh67n"
			const balance = await state.zkappWorkerClient!.getBalance(publicKeyBase58)
			// let balanceToka = UInt64.zero;
			// try {
			//   balanceToka = await state.zkappWorkerClient!.getBalanceToken(
			//     publicKeyBase58,
			//     tokenId
			//   );
			// } catch (error) {

			// }

			useAccount.setState((state) => ({
				...state,
				balances: {
					mina: Number(balance.toString()) / MINA_SUB_DECIMAL
					//toka: Number(balanceToka.toString()) / MINA_SUB_DECIMAL
				}
			}))
		} else {
			throw res
		}
	} catch (e: any) {
		console.error("setupWorkerClient", e)
	}
}
