import { $ } from "bun"

const checkDatabaseConnectionString = (P = process) => {
	const args = P.argv.slice(2)
	const connectionString = P.env.DATABASE_URL
	if (!connectionString) {
		console.error("DATABASE_URL is not set. Aborting...")
		P.exit(1)
		return
	}
	if (connectionString.includes("supabase")) {
		if (args.includes("--force")) {
			console.log(
				"/!\\ You are connected to a Supabase url ! Be very careful, this could be live data ! /!\\"
			)
			return
		}
		console.error(
			"Running dangerous commands against a Supabase URL requires the --force flag. Aborting..."
		)
		P.exit(1)
	}
}

const main = async () => {
	checkDatabaseConnectionString()
	const stdout = await $`drizzle-kit migrate`
	console.log(`\n db:migrate:apply exited with code ${stdout.exitCode}`)
}

await main()
