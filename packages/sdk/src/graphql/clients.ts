import { createClient as createSSEClient } from "graphql-sse"
import { Client, type ClientOptions, fetchExchange, subscriptionExchange } from "urql"
import { poolCreationUrls } from "../constants"
import { getRetryExchange } from "../graphql/helpers"
import type { Networks } from "../machines/wallet/types"

const clientCache = new Map<string, Client>()

export const createClientOptions = (url: string) =>
	({
		url,
		requestPolicy: "network-only",
		exchanges: [getRetryExchange(), fetchExchange],
		preferGetMethod: false
	}) as ClientOptions

export const createMinaClient = (url: string) => {
	const cached = clientCache.get(url)
	if (cached) return cached
	const client = new Client(createClientOptions(url))
	clientCache.set(url, client)
	return client
}

const sseClientCache = new Map<string, ReturnType<typeof createSSEClient>>()

export const createPoolSignerClient = (network: Networks) => {
	const url = poolCreationUrls[network]
	if (url === "NOT_IMPLEMENTED") {
		throw new Error(`Network "${network}" is not supported for pool creation.`)
	}
	const cached = clientCache.get(url)
	if (cached) return cached

	let sseClient = sseClientCache.get(url)
	if (!sseClient) {
		sseClient = createSSEClient({ url })
		sseClientCache.set(url, sseClient)
	}

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
							const dispose = sseClient!.subscribe(newOperation, sink)
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
