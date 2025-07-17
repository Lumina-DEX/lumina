Bun.serve({
	fetch: async (request) => {
		console.log("Request received:", request.method, request.url)
		return new Response("Hello from the container!")
	}
})
