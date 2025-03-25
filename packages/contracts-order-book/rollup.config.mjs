import fs from "node:fs/promises"
import path from "node:path"

import typescript from "@rollup/plugin-typescript"
import { defineConfig } from "rollup"
import dts from "rollup-plugin-dts"

export default defineConfig([
  {
    input: "src/index.ts",
    output: [{ sourcemap: true, dir: "dist", format: "es" }],
    plugins: [typescript({ tsconfig: "tsconfig.build.esm.json" })]
  },
  {
    input: "dist/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [dts(), {
      // Clean up the dist folder after build
      buildEnd: async () => {
        const __dirname = new URL(".", import.meta.url).pathname

        const distPath = path.join(__dirname, "dist")
        const files = await fs.readdir(distPath, { recursive: true })

        const filesToKeep = ["index.js", "index.js.map", "index.d.ts"]

        // const removed = []
        for (const file of files) {
          const fullPath = path.join(distPath, file)
          const shouldKeep = filesToKeep.some(keep => file.endsWith(keep))
          if (!shouldKeep) {
            await fs.rm(fullPath, { recursive: true, force: true })
            // removed.push(fullPath)
            // console.log(`Removing: ${file}`)
          }
        }
        // console.log("Removed Files", removed)
      }
    }]
  }
])
