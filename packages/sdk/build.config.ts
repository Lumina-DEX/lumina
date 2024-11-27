import OMT from "@surma/rollup-plugin-off-main-thread"
import { defineBuildConfig } from "unbuild"

export default defineBuildConfig({
	sourcemap: true,
	declaration: true,
	rollup: {
		output: { format: "esm" }
	},
	hooks: {
		// "rollup:build": (context, build) => {
		// 	console.log("rollup:build", build)
		// },
		"rollup:options"(context, options) {
			// console.log("rollup:options", options.plugins)
			const plugin = OMT()
			if (options.plugins === undefined || options.plugins === null || options.plugins === false) {
				//@ts-expect-error options.plugins
				options.plugins = [plugin]
			} else if (Array.isArray(options.plugins)) {
				//@ts-expect-error options.plugins
				options.plugins.push(plugin)
			} else {
				//@ts-expect-error options.plugins
				options.plugins = [options.plugins, plugin]
			}
		}
	}
})
