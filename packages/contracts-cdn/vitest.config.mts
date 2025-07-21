import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config"

//TODO: Containers are breaking the tests https://github.com/cloudflare/workers-sdk/issues/9793
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
				wrangler: { configPath: "./wrangler.jsonc" }
			}
		}
	}
})
