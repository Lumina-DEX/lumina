import { createYoga } from "graphql-yoga"
import * as v from "valibot"
import { getDb } from "./db"
import { schema } from "./graphql"
import { logger } from "./helpers"
import { queues } from "./queue"

const Schema = v.object({
	DATABASE_URL: v.string(),
	INFISICAL_ENVIRONMENT: v.string(),
	INFISICAL_PROJECT_ID: v.string(),
	INFISICAL_CLIENT_ID: v.string(),
	INFISICAL_CLIENT_SECRET: v.string()
})
const env = v.parse(Schema, process.env)

export type Database = typeof getDb
export type Queues = typeof queues
export type Env = typeof env
export type Context = {
	database: Database
	queues: Queues
	env: Env
	shouldUpdateCDN?: boolean
}

const commitHash = process.env.GIT_REV || "development" // This is injected by Dokku.

export const yoga = createYoga<{ env: typeof env }>({
	schema,
	cors: (request) => ({
		origin: request.headers.get("Origin") ?? "localhost:4000",
		credentials: true,
		allowedHeaders: [request.headers.get("Access-Control-Request-Headers") ?? "Content-Type"],
		methods: ["*"],
		exposedHeaders: ["*"]
	}),
	context: async ({ env }) => {
		return {
			env,
			database: getDb,
			queues,
			shouldUpdateCDN: commitHash !== "development"
		} satisfies Context
	},
	plugins: [
		{
			onResponse({ response }) {
				response.headers.set("Revision", commitHash)
			}
		}
	]
})

const main = async () => {
	const server = Bun.serve({
		idleTimeout: 0, // Wait indefinitely for SSE
		port: 3001,
		fetch: async (request) => {
			logger.log("Received request:", request.method, request.url)
			return yoga(request, { env })
		}
	})
	logger.info(`Server is running on ${new URL(yoga.graphqlEndpoint, `http://${server.hostname}:${server.port}`)}`)
}

main()
