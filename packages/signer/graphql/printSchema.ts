import { writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { lexicographicSortSchema, printSchema } from "graphql"
import { schema } from "../src/graphql"

// Resolve the current directory (Node equivalent of import.meta.dir)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Generate the schema text
const schemaToPrint = printSchema(lexicographicSortSchema(schema))

// Write to ./schema.graphql
await writeFile(join(__dirname, "schema.graphql"), schemaToPrint)
