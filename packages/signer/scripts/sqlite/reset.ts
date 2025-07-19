import { $ } from "bun"

await $`rm -rf local.db && touch local.db`
