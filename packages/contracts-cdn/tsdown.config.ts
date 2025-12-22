import { defineConfig } from "tsdown"

export default defineConfig({
	entry: ["./container/index.ts"],
	noExternal: ["graphql-request"],
	outDir: "output",
	platform: "browser"
})
