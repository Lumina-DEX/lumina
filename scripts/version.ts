import { $ } from "bun"

// Run changeset version
console.log("Running changeset version...")
await $`changeset version`

// Check if packages/contracts/package.json has changed, if yes create the cache and to add the content to the changeset PR
console.log("Checking for changes in packages/contracts/package.json...")
try {
	const gitDiff = await $`git diff --name-only HEAD`.text()
	const changedFiles = gitDiff.split("\n")
	console.log("Changed files:", changedFiles)

	if (changedFiles.includes("packages/contracts/package.json")) {
		console.log("Changes detected in packages/contracts/package.json")
		console.log("Running cache:create...")
		await $`moon contracts-cdn:build-cache`
	} else {
		console.log("No changes detected in packages/contracts/package.json, skipping cache:create")
	}
} catch (error) {
	console.error("Error checking git changes:", error)
	process.exit(1)
}

// Run format:all:fix
console.log("Running format:all:fix...")
await $`moon run format-all`
