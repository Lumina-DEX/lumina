export class GraphQLClient {
	constructor(
		private endpoint: string,
		private apiKey: string
	) {}

	async query<T>(query: string, variables?: Record<string, any>): Promise<T> {
		const response = await fetch(this.endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.apiKey}`
			},
			body: JSON.stringify({ query, variables })
		})

		const result = await response.json()
		if (result.errors) {
			throw new Error(result.errors)
		}
		return result.data
	}
}
