import type { Networks } from "@lumina-dex/sdk"
import { internal_fetchAllTokensFromPoolFactory } from "../../sdk/src/helpers/blockchain"

// type CreateTuple<
// 	Length extends number,
// 	ElementType,
// 	Accumulator extends unknown[] = []
// > = Accumulator["length"] extends Length
// 	? Accumulator
// 	: CreateTuple<Length, ElementType, [...Accumulator, ElementType]>

const generateTokens = async (network: Networks) => {
	const result = await internal_fetchAllTokensFromPoolFactory({ network: "zeko:testnet" })
	// const { tokens: tokens2 } = await internal_fetchAllTokensFromPoolFactory({ network })
	console.log(result)
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
