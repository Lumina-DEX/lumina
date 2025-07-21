import { App } from "uWebSockets.js"
import { drizzle } from "drizzle-orm/postgres-js"
import { createYoga } from "graphql-yoga"
import * as v from "valibot"
import { relations } from "../drizzle/relations"
import { schema } from "./graphql"
import { queues } from "./queue"

import "dotenv/config"

const Schema = v.object({
	DATABASE_URL: v.string(),
	INFISICAL_ENVIRONMENT: v.string(),
	INFISICAL_PROJECT_ID: v.string(),
	INFISICAL_SECRET_NAME: v.string(),
	INFISICAL_CLIENT_ID: v.string(),
	INFISICAL_CLIENT_SECRET: v.string()
})
const env = v.parse(Schema, process.env)

const db = drizzle(env.DATABASE_URL, { relations })

export type Database = typeof db
export type Queues = typeof queues
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
	context: async () => {
		return { env, db, queues } satisfies Context
	}
})

App()
	.any("/*", yoga)
	.listen("localhost", 3001, () => {
		console.log("Server is running on http://localhost:3001")
	})
