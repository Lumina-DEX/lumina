import { createPubSub, createYoga } from "graphql-yoga"
import * as v from "valibot"
import { getDb } from "./db"
import { type JobResult, schema } from "./graphql"
import { logger } from "./helpers/utils"
import { getJobQueue } from "./queue"
import { createServer } from "http"

const Schema = v.object({
	DATABASE_URL: v.string(),
	INFISICAL_ENVIRONMENT: v.string(),
	INFISICAL_PROJECT_ID: v.string(),
	INFISICAL_CLIENT_ID: v.string(),
	INFISICAL_CLIENT_SECRET: v.string()
})
const env = v.parse(Schema, process.env)

export type Database = typeof getDb
export type JobQueue = () => ReturnType<typeof getJobQueue>
export type Env = typeof env
export type Context = {
	database: Database
	jobQueue: JobQueue
	pubsub: ReturnType<typeof createPubSub<Record<string, [job: JobResult]>>>
	env: Env
	shouldUpdateCDN?: boolean
}

const commitHash = process.env.GIT_REV || "development" // This is injected by Dokku.

const pubsub = createPubSub<Record<string, [JobResult]>>()
const jobQueue = () => getJobQueue(pubsub)

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
			jobQueue,
			pubsub,
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

// --- Server configuration (Dokku provides PORT automatically) ---
const port = Number(process.env.PORT || 3001)
const hostname = "0.0.0.0"

// --- Create the HTTP server ---
const server = createServer((req, res) => {
	// Simple health check endpoint for Dokku and NGINX
	if (req.url === "/health") {
		res.statusCode = 200
		res.setHeader("Content-Type", "application/json; charset=utf-8")
		res.end(JSON.stringify({ status: "ok", revision: commitHash }))
		return
	}

	// Optional: log every request (you can disable this if too verbose)
	logger.log("Received request:", req.method, req.url)

	// Pass all other requests to GraphQL Yoga
	yoga(req, res, { env })
})

// --- Start the server ---
server.listen(port, hostname, () => {
	logger.info(`🚀 Server running at http://localhost:${port}${yoga.graphqlEndpoint} (rev: ${commitHash})`)
})

// --- Graceful shutdown (Dokku sends SIGTERM before stopping the container) ---
const shutdown = (signal: string) => {
	logger.info(`Received ${signal}, shutting down...`)
	server.close((err) => {
		if (err) {
			logger.error("Error during server close:", err)
			process.exit(1)
		}
		process.exit(0)
	})
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))
