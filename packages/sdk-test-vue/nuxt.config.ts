// https://nuxt.com/docs/api/configuration/nuxt-config

const minify = false
const webWorkerHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-site",
  "Cross-Origin-Embedder-Policy": "require-corp"
}

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  future: {
    compatibilityVersion: 4
  },
  ssr: false,
  routeRules: {
    "/**": { headers: webWorkerHeaders }
  },
  hooks: {
    "vite:serverCreated": (server) => {
      server.middlewares.use((_req, res, next) => {
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
        res.setHeader("Cross-Origin-Resource-Policy", "same-site")
        res.setHeader("Cross-Origin-Embedder-Policy", "require-corp")
        next()
      })
    }
  },
  devServer: { port: 3100 },
  vite: {
    build: { minify },
    server: { headers: webWorkerHeaders },
    optimizeDeps: {
      include: ["@lumina-dex/sdk > react"],
      exclude: ["@lumina-dex/sdk"]
    }
  },
  devtools: { enabled: true }
})
