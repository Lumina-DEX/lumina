import type { Networks } from "@lumina-dex/sdk"
import {
	internal_fetchAllPoolTokens,
	internal_fetchAllTokensFromPoolFactory
} from "../../sdk/src/helpers/blockchain"

// type CreateTuple<
// 	Length extends number,
// 	ElementType,
// 	Accumulator extends unknown[] = []
// > = Accumulator["length"] extends Length
// 	? Accumulator
// 	: CreateTuple<Length, ElementType, [...Accumulator, ElementType]>

export const processSettledPromises = <T>(settledPromises: PromiseSettledResult<T>[]) => {
	return settledPromises.flatMap((result) => {
		if (result.status === "rejected") throw new Error(result.reason)
		return result.value
	})
}
const generateTokens = async (network: Networks) => {
	const tokens = await internal_fetchAllPoolTokens(network)
	const tokens2 = await internal_fetchAllTokensFromPoolFactory({ network })
	const success = processSettledPromises(tokens)
	console.log(success)
	const success2 = processSettledPromises(tokens2)
	console.log(success2)
	console.log(success.length, success2.length)

	// const __dirname = path.dirname(new URL(import.meta.url).pathname)
	// const genDir = path.resolve(__dirname, "../generated")
	// await fs.mkdir(genDir, { recursive: true })

	// await fs.writeFile(
	// 	path.resolve(genDir, `${network}.ts`),
	// 	`export const data = ${JSON.stringify(success, null, 2)}`,
	// 	"utf8"
	// )
}

await generateTokens("mina:devnet")
