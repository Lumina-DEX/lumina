module.exports = {
	pipeline: {
		build: ["^build"],
		test: ["build"],
		lint: ["^lint"]
	},
	npmClient: "pnpm"
}
