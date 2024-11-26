import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    hookTimeout: 50_000,
  },
  plugins: [swc.vite()],
})