import { defineConfig } from "tsdown"

export default defineConfig({
	entry: ["./container/index.ts"],
	format: "esm",
	noExternal: ["graphql-request"],
	outDir: "output",
	platform: "browser"
})
