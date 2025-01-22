import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import { writeFileSync } from "node:fs"

const webWorkerHeaders = {
	"Cross-Origin-Opener-Policy": "same-origin",
	"Cross-Origin-Resource-Policy": "same-site",
	"Cross-Origin-Embedder-Policy": "require-corp"
}

function CfHeaders(): Plugin {
	return {
		name: "CfHeaders",
		closeBundle() {
			writeFileSync(
				"dist/_headers",
				`/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-site
  Cross-Origin-Embedder-Policy: require-corp`
			)
		}
	}
}

// https://vitejs.dev/config/
export default defineConfig({
	build: { minify: false },
	server: { headers: webWorkerHeaders },
	optimizeDeps: {
		include: ["@lumina-dex/sdk > react", "@lumina-dex/sdk > @xstate/react"],
		exclude: ["@lumina-dex/sdk"]
	},
	plugins: [TanStackRouterVite({}), react(), CfHeaders()]
})
