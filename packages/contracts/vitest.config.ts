import swc from "unplugin-swc"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    hookTimeout: 50_000,
  },
  plugins: [swc.vite()],
})
