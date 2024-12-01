import { retryExchange } from "@urql/exchange-retry"
import { initGraphQLTada } from "gql.tada"
import type { introspection } from "./sequencer-env"

export type { FragmentOf, ResultOf, VariablesOf } from "gql.tada"
export { readFragment } from "gql.tada"

// GraphQL Tada initialization
export const graphql = initGraphQLTada<{
	introspection: introspection
	scalars: { UInt64: string; PublicKey: string; TokenID: string }
}>()

export const getRetryExchange = () =>
	retryExchange({
		maxDelayMs: 5000,
		initialDelayMs: 1000,
		maxNumberAttempts: 5,
		randomDelay: true,
		retryIf: (err) => !!err?.networkError
	})
