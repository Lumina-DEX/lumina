import { Container } from "@cloudflare/containers"

export class FetchToken extends Container<Env> {
	defaultPort = 3000
	sleepAfter = "5m"

	override onStart() {
		console.log("Container successfully started")
	}

	override onStop() {
		console.log("Container successfully shut down")
	}

	override onError(error: unknown) {
		console.log("Container error:", error)
	}
}
