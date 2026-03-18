import type { Networks } from "@lumina-dex/sdk"
import { createPubSub, createYoga, useReadinessCheck } from "graphql-yoga"
import * as v from "valibot"
import { getDb } from "./db"
import { schema } from "./graphql"
import { getApiKey } from "./helpers/job"
import { resolveAllowedNetworks } from "./helpers/network"
import { type AnyJobResult, getJobQueue } from "./queue"

const Schema = v.object({
	DATABASE_URL: v.string(),
	INFISICAL_ENVIRONMENT: v.string(),
	INFISICAL_PROJECT_ID: v.string(),
	INFISICAL_CLIENT_ID: v.string(),
	INFISICAL_CLIENT_SECRET: v.string()
})
export const env = v.parse(Schema, process.env)

export type Database = typeof getDb
export type JobQueue = () => ReturnType<typeof getJobQueue>
export type Env = typeof env
export type Context = {
	isAdmin: boolean
	allowedNetworks: Networks[]
	database: Database
	jobQueue: JobQueue
	pubsub: ReturnType<typeof createPubSub<Record<string, [job: AnyJobResult]>>>
	env: Env
	shouldUpdateCDN?: boolean
}

export const commitHash = process.env.GIT_REV || "development"
const signerEnvironment = process.env.ENVIRONMENT

const pubsub = createPubSub<Record<string, [AnyJobResult]>>()
const jobQueue = () => getJobQueue(pubsub)
const allowedNetworks = resolveAllowedNetworks(signerEnvironment)

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
		const apiKey = await getApiKey()
		const isAdmin = authToken === `Bearer ${apiKey}`
		return {
			isAdmin,
			allowedNetworks,
			env,
			database: getDb,
			jobQueue,
			pubsub,
			shouldUpdateCDN: commitHash !== "development"
		} satisfies Context
	},
	plugins: [
		// biome-ignore lint/correctness/useHookAtTopLevel: not a React hook, it's a GraphQL Yoga plugin
		useReadinessCheck({
			endpoint: "/health",
			check: () => {
				if (allowedNetworks.length === 0) {
					throw new Error(
						`No allowed networks resolved for ENVIRONMENT="${signerEnvironment ?? ""}". Server cannot accept requests.`
					)
				}
			}
		}),
		{
			onResponse({ response }) {
				response.headers.set("Revision", commitHash)
				response.headers.set("X-Environment", signerEnvironment ?? "local")
				response.headers.set("X-Allowed-Networks", allowedNetworks.join(","))
			}
		}
	]
})
