import fs from "node:fs"
import { join } from "node:path"
import { defineNuxtModule, updateRuntimeConfig } from "@nuxt/kit"

export default defineNuxtModule({
	meta: {
		name: "sdk-version",
		configKey: "sdkVersion"
	},
	setup(options, nuxt) {
		try {
			const packageJsonPath = join(nuxt.options.rootDir, "../sdk/package.json")
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
			const version = packageJson.version

			// Inject version into runtime config
			updateRuntimeConfig({ public: { sdkVersion: version } })
			console.log("SDK version:", version)
		} catch (error) {
			console.warn("Could not read package.json:", error)
			nuxt.options.runtimeConfig.public.sdkVersion = "unknown"
		}
	}
})
