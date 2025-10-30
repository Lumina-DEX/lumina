import { Networks } from "@lumina-dex/sdk"

export type NetworkEnum = "mina_mainnet" | "mina_devnet" | "zeko_mainnet" | "zeko_testnet"

export const networkValueToEnum = (value: Networks): NetworkEnum => {
	return value.replace(":", "_") as NetworkEnum
}

export const networkEnumToValue = (enumValue: NetworkEnum): Networks => {
	return enumValue.replace("_", ":") as Networks
}

export const NETWORK_OPTIONS: { value: NetworkEnum; label: string }[] = [
	{ value: "mina_mainnet", label: "Mina Mainnet" },
	{ value: "mina_devnet", label: "Mina Devnet" },
	{ value: "zeko_mainnet", label: "Zeko Mainnet" },
	{ value: "zeko_testnet", label: "Zeko Testnet" }
]
