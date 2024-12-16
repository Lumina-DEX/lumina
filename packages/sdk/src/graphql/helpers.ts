import { retryExchange } from "@urql/exchange-retry"
import { initGraphQLTada } from "gql.tada"
import type { introspection as minaArchiveSchema } from "./mina-archive-env"
import type { introspection as minaSchema } from "./mina-env"
import type { introspection as zekoSchema } from "./zeko-env"

export type { FragmentOf, ResultOf, VariablesOf } from "gql.tada"
export { readFragment } from "gql.tada"

type Scalars = { UInt64: string; PublicKey: string; TokenID: string }

export const zeko = initGraphQLTada<{ introspection: zekoSchema; scalars: Scalars }>()
export const mina = initGraphQLTada<{ introspection: minaSchema; scalars: Scalars }>()
export const minaArchive = initGraphQLTada<{ introspection: minaArchiveSchema; scalars: Scalars }>()

export const getRetryExchange = () =>
	retryExchange({
		maxDelayMs: 5000,
		initialDelayMs: 1000,
		maxNumberAttempts: 5,
		randomDelay: true,
		retryIf: (err) => !!err?.networkError
	})
