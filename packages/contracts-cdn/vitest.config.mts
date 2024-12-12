import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config"

export default defineWorkersConfig({
	test: {
		fileParallelism: false,
		poolOptions: {
			workers: {
				singleWorker: true,
				miniflare: {
					// This is necessary to use scheduled with vitest
					compatibilityFlags: ["service_binding_extra_handlers"]
				},
				wrangler: { configPath: "./wrangler.toml" }
			}
		}
	}
})
