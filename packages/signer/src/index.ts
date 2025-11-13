import { createPubSub, createYoga } from "graphql-yoga"
import * as v from "valibot"
import { getDb } from "./db"
import { type JobResult, schema } from "./graphql"
import { getJobQueue } from "./queue"

const Schema = v.object({
	DATABASE_URL: v.string(),
	INFISICAL_ENVIRONMENT: v.string(),
	INFISICAL_PROJECT_ID: v.string(),
	INFISICAL_CLIENT_ID: v.string(),
	INFISICAL_CLIENT_SECRET: v.string(),
	API_KEY: v.string()
})
export const env = v.parse(Schema, process.env)

export type Database = typeof getDb
export type JobQueue = () => ReturnType<typeof getJobQueue>
export type Env = typeof env
export type Context = {
	isAdmin: boolean
	database: Database
	jobQueue: JobQueue
	pubsub: ReturnType<typeof createPubSub<Record<string, [job: JobResult]>>>
	env: Env
	shouldUpdateCDN?: boolean
}

export const commitHash = process.env.GIT_REV || "development" // This is injected by Dokku.

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
	context: async ({ env, request }) => {
		const authToken = request.headers.get("Authorization") || ""
		const isAdmin = authToken === `Bearer ${env.API_KEY}`
		return {
			isAdmin,
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
