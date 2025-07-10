import { drizzle } from "drizzle-orm/libsql"
import { createYoga } from "graphql-yoga"
import * as v from "valibot"
import { relations } from "../drizzle/relations"
import { schema } from "./graphql"
import { getQueues } from "./queue"

const Schema = v.object({
	DB_FILE_NAME: v.string(),
	INFISICAL_ENVIRONMENT: v.string(),
	INFISICAL_PROJECT_ID: v.string(),
	INFISICAL_SECRET_NAME: v.string(),
	INFISICAL_CLIENT_ID: v.string(),
	INFISICAL_CLIENT_SECRET: v.string()
})
const env = v.parse(Schema, process.env)

const db = drizzle(env.DB_FILE_NAME, { relations })
const queues = getQueues()

export type Database = typeof db
export type Queues = ReturnType<typeof getQueues>
export type Env = typeof env
export type Context = {
	db: Database
	queues: Queues
	env: Env
}

export const yoga = createYoga<{ env: typeof env }>({
	schema,
	maskedErrors: false,
	cors: (request) => ({
		origin: request.headers.get("Origin") ?? "localhost:4000",
		credentials: true,
		allowedHeaders: [request.headers.get("Access-Control-Request-Headers") ?? "Content-Type"],
		methods: ["*"],
		exposedHeaders: ["*"]
	}),
	context: async ({ env }) => {
		return { env, db, queues } satisfies Context
	}
})

const main = async () => {
	const server = Bun.serve({
		fetch: async (request) => {
			const response = await yoga(request, { env })
			return response
		}
	})

	console.info(
		`Server is running on ${new URL(
			yoga.graphqlEndpoint,
			`http://${server.hostname}:${server.port}`
		)}`
	)
}

main()
