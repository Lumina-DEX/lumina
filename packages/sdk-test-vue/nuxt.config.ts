// https://nuxt.com/docs/api/configuration/nuxt-config

const minify = false
const headers = {
  "Cross-Origin-Resource-Policy": "same-site",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin"
} as const

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  future: {
    compatibilityVersion: 4
  },
  nitro: { static: true },
  ssr: false,
  routeRules: {
    "/**": { headers }
  },
  hooks: {
    "vite:serverCreated": (server) => {
      server.middlewares.use((_request, response, next) => {
        response.setHeaders(new Headers(headers))
        next()
      })
    }
  },
  devServer: { port: 3100 },
  vite: {
    build: { minify },
    server: { headers },
    optimizeDeps: {
      include: ["@lumina-dex/sdk > react"],
      exclude: ["@lumina-dex/sdk"]
    }
  },
  devtools: { enabled: true }
})
