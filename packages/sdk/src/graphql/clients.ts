import { createClient as createSSEClient } from "graphql-sse"
import { Client, type ClientOptions, fetchExchange, subscriptionExchange } from "urql"
import { poolCreationUrl } from "../constants"
import { getRetryExchange } from "../graphql/helpers"

const clientCache = new Map<string, Client>()

export const createClientOptions = (url: string) =>
	({
		url,
		requestPolicy: "network-only",
		exchanges: [
			getRetryExchange(),
			fetchExchange
		]
	}) as ClientOptions

export const createMinaClient = (url: string) => {
	const cached = clientCache.get(url)
	if (cached) return cached
	const client = new Client(createClientOptions(url))
	clientCache.set(url, client)
	return client
}

const sseClient = createSSEClient({
	url: `${poolCreationUrl}/stream`
})

export const createPoolSignerClient = () => {
	const url = poolCreationUrl
	const cached = clientCache.get(url)
	if (cached) return cached
	const client = new Client({
		url,
		requestPolicy: "network-only",
		exchanges: [
			getRetryExchange(),
			fetchExchange,
			subscriptionExchange({
				forwardSubscription(operation) {
					return {
						subscribe: (sink) => {
							const newOperation = Object.assign({}, operation, { query: operation.query ?? "" })
							const dispose = sseClient.subscribe(newOperation, sink)
							return { unsubscribe: dispose }
						}
					}
				}
			})
		]
	})
	clientCache.set(url, client)
	return client
}
