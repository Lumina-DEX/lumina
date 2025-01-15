// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  future: {
    compatibilityVersion: 4
  },
  ssr: false,
  routeRules: {
    "/": {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp"
      }
    }
  },
  hooks: {
    "vite:serverCreated": (server) => {
      server.middlewares.use((_req, res, next) => {
        res.setHeader("Cross-Origin-Embedder-Policy", "require-corp")
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
        next()
      })
    }
  },
  vite: {
    optimizeDeps: {
      include: ["react"],
      exclude: ["@lumina-dex/sdk"]
    }
  },
  devtools: { enabled: true }
})
