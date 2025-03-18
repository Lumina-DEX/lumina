import type { ExportedHandler, fetch } from "@cloudflare/workers-types"

interface Env {
	ASSETS: { fetch: typeof fetch }
}

export default {
	async fetch(request, env) {
		return env.ASSETS.fetch(request)
	}
} satisfies ExportedHandler<Env>
