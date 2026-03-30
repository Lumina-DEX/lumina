import { FungibleToken, FungibleTokenAdmin, Pool, PoolFactory, PoolTokenHolder } from "@lumina-dex/contracts"
import type { Cache } from "o1js"

type CompilableContract = {
	name: string
	compile: ({ cache }: { cache: Cache }) => Promise<unknown>
}

const contracts = [FungibleTokenAdmin, FungibleToken, PoolFactory, Pool, PoolTokenHolder] satisfies CompilableContract[]

export const cdnContracts = contracts.map((contract) => ({
	contract,
	slug: contract.name.toLowerCase()
}))
