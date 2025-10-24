import { defineConfig } from "tsdown"

export default defineConfig({
	entry: { index: "src/node.ts" },
	outDir: "dist",
	format: ["esm"]
})
