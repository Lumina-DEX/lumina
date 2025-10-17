import { defineConfig } from "tsup"

export default defineConfig({
	entry: ["src/index.ts"],
	outDir: "dist",
	format: ["esm"],
	target: "node20",
	sourcemap: true,
	clean: true,
	splitting: false,
	bundle: true,
	dts: false
})
