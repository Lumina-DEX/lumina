import type { Networks } from "@lumina-dex/sdk"
import { internal_fetchAllTokensFromPoolFactory } from "../../sdk/src/helpers/blockchain"

// type CreateTuple<
// 	Length extends number,
// 	ElementType,
// 	Accumulator extends unknown[] = []
// > = Accumulator["length"] extends Length
// 	? Accumulator
// 	: CreateTuple<Length, ElementType, [...Accumulator, ElementType]>

// biome-ignore lint/suspicious/noExplicitAny: Generic Type
export const processSettledPromises = <T extends any[]>(
	settledPromises: {
		[P in keyof T]: PromiseSettledResult<T[P]>
	}
): T => {
	return settledPromises.map((result) => {
		if (result.status === "rejected") throw new Error(result.reason)
		return result.value
	}) as T
}
const generateTokens = async (network: Networks) => {
	const tokens = await internal_fetchAllTokensFromPoolFactory({ network })
	const success = processSettledPromises(tokens)
	console.log(success)

	// const __dirname = path.dirname(new URL(import.meta.url).pathname)
	// const genDir = path.resolve(__dirname, "../generated")
	// await fs.mkdir(genDir, { recursive: true })

	// await fs.writeFile(
	// 	path.resolve(genDir, `${network}.ts`),
	// 	`export const data = ${JSON.stringify(success, null, 2)}`,
	// 	"utf8"
	// )
}

await generateTokens("mina:testnet")
