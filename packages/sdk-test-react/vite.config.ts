import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"

const webWorkerHeaders = {
	"Cross-Origin-Opener-Policy": "same-origin",
	"Cross-Origin-Resource-Policy": "same-site",
	"Cross-Origin-Embedder-Policy": "require-corp"
}

// https://vitejs.dev/config/
export default defineConfig({
	build: { minify: false },
	server: { headers: webWorkerHeaders },
	optimizeDeps: {
		include: ["@lumina-dex/sdk > react", "@lumina-dex/sdk > @xstate/react"],
		exclude: ["@lumina-dex/sdk"]
	},
	plugins: [TanStackRouterVite({}), react()]
})
