import { createServer } from "node:http"
import { commitHash, env, yoga } from "."
import { logger } from "./helpers/utils"

const port = 3001
const hostname = "0.0.0.0"

const server = createServer((req, res) => {
	logger.log("Received request:", req.method, req.url)
	yoga(req, res, { env })
})

server.setTimeout(30 * 60 * 1000) // 30 minutes timeout for Subscriptions

server.listen(port, hostname, () => {
	logger.info(`🚀 Server running at http://localhost:${port}${yoga.graphqlEndpoint} (rev: ${commitHash})`)
})

const shutdown = (signal: string) => {
	logger.info(`Received ${signal}, shutting down...`)
	server.close((err) => {
		if (err) {
			logger.error("Error during server close:", err)
			process.exit(1)
		}
		process.exit(0)
	})
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))
