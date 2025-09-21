// dprint-ignore-file
/* eslint-disable */
/* prettier-ignore */

export type introspection_types = {
	Boolean: unknown
	CreatePoolInput: {
		kind: "INPUT_OBJECT"
		name: "CreatePoolInput"
		isOneOf: false
		inputFields: [
			{
				name: "network"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "Network"; ofType: null } }
				defaultValue: null
			},
			{
				name: "tokenA"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
				defaultValue: null
			},
			{
				name: "tokenB"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
				defaultValue: null
			},
			{
				name: "user"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
				defaultValue: null
			}
		]
	}
	Job: {
		kind: "OBJECT"
		name: "Job"
		fields: {
			id: { name: "id"; type: { kind: "SCALAR"; name: "String"; ofType: null } }
			status: { name: "status"; type: { kind: "SCALAR"; name: "String"; ofType: null } }
		}
	}
	JobResult: {
		kind: "OBJECT"
		name: "JobResult"
		fields: {
			poolPublicKey: {
				name: "poolPublicKey"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			status: {
				name: "status"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			transactionJson: {
				name: "transactionJson"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
		}
	}
	Mutation: {
		kind: "OBJECT"
		name: "Mutation"
		fields: {
			confirmJob: { name: "confirmJob"; type: { kind: "SCALAR"; name: "String"; ofType: null } }
			createPool: { name: "createPool"; type: { kind: "OBJECT"; name: "Job"; ofType: null } }
		}
	}
	Network: { name: "Network"; enumValues: "mina_devnet" | "mina_mainnet" | "zeko_mainnet" | "zeko_testnet" }
	Query: {
		kind: "OBJECT"
		name: "Query"
		fields: { poolCreationJob: { name: "poolCreationJob"; type: { kind: "OBJECT"; name: "JobResult"; ofType: null } } }
	}
	String: unknown
	Subscription: {
		kind: "OBJECT"
		name: "Subscription"
		fields: { poolCreation: { name: "poolCreation"; type: { kind: "OBJECT"; name: "JobResult"; ofType: null } } }
	}
}

/** An IntrospectionQuery representation of your schema.
 *
 * @remarks
 * This is an introspection of your schema saved as a file by GraphQLSP.
 * It will automatically be used by `gql.tada` to infer the types of your GraphQL documents.
 * If you need to reuse this data or update your `scalars`, update `tadaOutputLocation` to
 * instead save to a .ts instead of a .d.ts file.
 */
export type introspection = {
	name: "pool-signer"
	query: "Query"
	mutation: "Mutation"
	subscription: "Subscription"
	types: introspection_types
}

import * as gqlTada from "gql.tada"
