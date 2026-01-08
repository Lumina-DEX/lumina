import { $ } from "bun"

// Run changeset version
console.log("Running changeset version...")
await $`changeset version`

// Run format:all:fix
console.log("Running format:all:fix...")
await $`moon run format-all-fix`
