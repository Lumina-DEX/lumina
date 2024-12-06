import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config"

export default defineWorkersConfig({
	test: {
		fileParallelism: false,
		poolOptions: {
			workers: {
				singleWorker: true,
				wrangler: { configPath: "./wrangler.toml" }
			}
		}
	}
})
