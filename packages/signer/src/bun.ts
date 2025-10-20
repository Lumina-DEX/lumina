import { env, yoga } from "."
import { logger } from "./helpers/utils"

const main = async () => {
	const server = Bun.serve({
		idleTimeout: 0, // Wait indefinitely for SSE
		port: 3001,
		fetch: async (request) => {
			logger.log("Received request:", request.method, request.url)
			return yoga(request, { env })
		}
	})
	logger.info(`Server is running on ${new URL(yoga.graphqlEndpoint, `http://${server.hostname}:${server.port}`)}`)
}

main()
