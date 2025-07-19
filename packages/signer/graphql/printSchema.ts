import { lexicographicSortSchema, printSchema } from "graphql"

import { schema } from "../src/graphql"

const schemaToPrint = printSchema(lexicographicSortSchema(schema))

await Bun.write(`${import.meta.dir}/schema.graphql`, schemaToPrint)
await Bun.write(
	`${import.meta.dir}/schema.graphql.ts`,
	`export const typeDefs = \`${schemaToPrint.replaceAll("`", "'")}\`;`
)
