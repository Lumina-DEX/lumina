import { spawn } from "node:child_process"
import process from "node:process"

// Utility to execute a shell command (replacement for Bun `$`)
async function exec(command: string, args: string[] = []) {
	return new Promise<{ exitCode: number }>((resolve, reject) => {
		const child = spawn(command, args, { stdio: "inherit", shell: true })
		child.on("exit", (code) => resolve({ exitCode: code ?? 0 }))
		child.on("error", reject)
	})
}

// Verify the database connection before running migrations
function checkDatabaseConnectionString(P = process) {
	const args = P.argv.slice(2)
	const connectionString = P.env.DATABASE_URL

	if (!connectionString) {
		console.error("❌ DATABASE_URL is not set. Aborting...")
		P.exit(1)
		return
	}

	if (connectionString.includes("supabase")) {
		if (args.includes("--force")) {
			console.warn("⚠️ You are connected to a Supabase URL! Be careful — this could be live data!")
			return
		}
		console.error("❌ Running dangerous commands against a Supabase URL requires the --force flag. Aborting...")
		P.exit(1)
	}
}

async function main() {
	checkDatabaseConnectionString()

	// Run drizzle-kit migrate
	const result = await exec("drizzle-kit", ["migrate"])

	console.log(`\n✅ db:migrate:apply exited with code ${result.exitCode}`)
}

await main()
