import { createConsola } from "consola"
import * as v from "valibot"

export const logger = createConsola().withTag("SIGNER")

export const getEnv = () => {
	const Schema = v.object({
		DATABASE_URL: v.string(),
		INFISICAL_ENVIRONMENT: v.string(),
		INFISICAL_PROJECT_ID: v.string(),
		INFISICAL_CLIENT_ID: v.string(),
		INFISICAL_CLIENT_SECRET: v.string()
	})
	const env = v.parse(Schema, process.env)
	return env
}
