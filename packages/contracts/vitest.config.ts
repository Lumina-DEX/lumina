import swc from "unplugin-swc"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    hookTimeout: 120_000,
    isolate: process.env.CI ? true : false,
    pool: "forks"
  },
  plugins: [swc.vite()]
})
