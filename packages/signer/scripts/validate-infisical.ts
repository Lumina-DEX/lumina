import { InfisicalSDK } from "@infisical/sdk"
import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

function loadAndNormalizeEnvFile(path: string): Record<string, string> {
	const content = readFileSync(path, "utf8")
	const result: Record<string, string> = {}
	const normalizedLines: string[] = []
	let fixed = false

	for (const line of content.split("\n")) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith("#")) {
			normalizedLines.push(line)
			continue
		}
		const eq = trimmed.indexOf("=")
		if (eq === -1) {
			normalizedLines.push(line)
			continue
		}
		const key = trimmed.slice(0, eq)
		const raw = trimmed.slice(eq + 1)
		const unquoted = raw.replace(/^["']|["']$/g, "")
		if (unquoted !== raw) {
			console.warn(`  fixed: ${key} had quoted value`)
			fixed = true
		}
		result[key] = unquoted
		normalizedLines.push(`${key}=${unquoted}`)
	}

	if (fixed) {
		writeFileSync(path, normalizedLines.join("\n"))
		console.log(`Stripped quotes from ${path}`)
	}

	return result
}

const envPath = resolve(process.argv[2] ?? "infra/secrets/zeko-testnet-signer.env")
const env = loadAndNormalizeEnvFile(envPath)

const { INFISICAL_CLIENT_ID, INFISICAL_CLIENT_SECRET, INFISICAL_ENVIRONMENT, INFISICAL_PROJECT_ID } = env

if (!INFISICAL_CLIENT_ID || !INFISICAL_CLIENT_SECRET || !INFISICAL_ENVIRONMENT || !INFISICAL_PROJECT_ID) {
	console.error("Missing required vars:", {
		INFISICAL_CLIENT_ID: !!INFISICAL_CLIENT_ID,
		INFISICAL_CLIENT_SECRET: !!INFISICAL_CLIENT_SECRET,
		INFISICAL_ENVIRONMENT,
		INFISICAL_PROJECT_ID
	})
	process.exit(1)
}

console.log("Config:", { INFISICAL_CLIENT_ID, INFISICAL_ENVIRONMENT, INFISICAL_PROJECT_ID })

const client = new InfisicalSDK()
await client.auth().universalAuth.login({ clientId: INFISICAL_CLIENT_ID, clientSecret: INFISICAL_CLIENT_SECRET })
console.log("✓ Authenticated")

for (const secretName of ["POOL_SIGNER_PRIVATE_KEY", "SIGNER_API_KEY"]) {
	const { secretValue } = await client
		.secrets()
		.getSecret({ environment: INFISICAL_ENVIRONMENT, projectId: INFISICAL_PROJECT_ID, secretName })
	console.log(`✓ ${secretName} = ${secretValue ? `${secretValue.slice(0, 6)}...` : "(empty)"}`)
}
