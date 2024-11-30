import { esbuildDecorators } from "esbuild-decorators"
import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["cjs", "esm"],
  splitting: true,
  sourcemap: true,
  dts: true,
  clean: true,
  treeshake: true,
  esbuildPlugins: [
    esbuildDecorators({ force: true })
  ]
})
