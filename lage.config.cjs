module.exports = {
	pipeline: {
		build: ["^build"],
		test: ["build"],
		"cache:create": ["build"],
		lint: []
	},
	npmClient: "bun"
}
