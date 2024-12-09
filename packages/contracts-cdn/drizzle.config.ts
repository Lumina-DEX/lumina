import { defineConfig } from "drizzle-kit"

export default defineConfig({
	out: "./drizzle/generated",
	schema: "./drizzle/schema.ts",
	dialect: "sqlite",
	driver: "durable-sqlite"
})
