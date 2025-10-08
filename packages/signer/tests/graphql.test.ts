import { like, or } from "drizzle-orm"
import { graphql, type TadaDocumentNode } from "gql.tada"
import { print } from "graphql"
import { createPubSub, createYoga } from "graphql-yoga"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { pool } from "../drizzle/schema"
import type { Context } from "../src"
import { getDb } from "../src/db"
import type { CreatePoolInputType, JobResult } from "../src/graphql"
import { schema } from "../src/graphql"
import { getJobQueue } from "../src/queue"
import { readSSEStream, streamContainsError } from "./sse"

const TEST_RUN_ID = `test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
const POOL_PREFIX = `pool-${TEST_RUN_ID}`
const USER_PREFIX = `B62test-${TEST_RUN_ID}`

vi.mock("../src/helpers/utils", () => ({
	logger: console
}))

vi.mock("../src/helpers/contracts", () => ({
	ensureCompiled: vi.fn(async () => true),
	compileContracts: vi.fn(async () => {})
}))

vi.mock("../src/helpers/job", () => ({
	updateStatusAndCDN: vi.fn(async () => "CDN updated")
}))

vi.mock("../src/helpers/pool", () => ({
	createPoolAndTransaction: vi.fn(
		async ({ jobId, user, tokenA, tokenB, network }: CreatePoolInputType & { jobId: string }) => {
			console.log(`Mock called for job ${jobId} at ${new Date().toISOString()}`)
			if (user.includes("fail")) throw new Error("Simulated failure")
			await new Promise((resolve) => setTimeout(resolve, 100))

			const poolPublicKey = `${POOL_PREFIX}-${jobId}`

			// Insert into actual database like the real worker does
			console.log("Using real database to insert pool record")
			using db = getDb()
			await db.drizzle.insert(pool).values({
				publicKey: poolPublicKey,
				tokenA,
				tokenB,
				user,
				network,
				jobId,
				status: "pending"
			})
			console.log("Inserted pool record into database")
			return {
				poolPublicKey,
				transactionJson: JSON.stringify({ hash: `tx-${jobId}` })
			}
		}
	)
}))

describe("GraphQL API", () => {
	let yoga: ReturnType<typeof createYoga<Context>>
	let jobQueue: () => ReturnType<typeof getJobQueue>
	let pubsub: ReturnType<typeof createPubSub<Record<string, [JobResult]>>>

	const query = async <TResult, TVariables>(
		document: TadaDocumentNode<TResult, TVariables>,
		variables?: TVariables
	): Promise<{ data?: TResult; errors?: Array<{ message: string }> }> => {
		const response = await yoga.fetch("http://localhost:4000/graphql", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ query: print(document), variables })
		})
		return response.json()
	}

	const subscribe = async <TResult, TVariables>(
		document: TadaDocumentNode<TResult, TVariables>,
		variables?: TVariables
	) => {
		const response = await yoga.fetch("http://localhost:4000/graphql", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "text/event-stream"
			},
			body: JSON.stringify({ query: print(document), variables })
		})
		return response
	}

	beforeAll(() => {
		pubsub = createPubSub<Record<string, [JobResult]>>()

		jobQueue = () => getJobQueue(pubsub)

		yoga = createYoga<Context>({
			schema,
			logging: true,
			maskedErrors: false, // Show detailed errors in tests
			context: {
				jobQueue,
				pubsub,
				database: getDb,
				env: {
					DATABASE_URL: process.env.DATABASE_URL || "postgresql://localhost/lumina_test",
					INFISICAL_ENVIRONMENT: "test",
					INFISICAL_PROJECT_ID: "test",
					INFISICAL_CLIENT_ID: "test",
					INFISICAL_CLIENT_SECRET: "test"
				},
				shouldUpdateCDN: false
			}
		})
	})

	afterAll(async () => {
		// Clean up test data from database using the unique test run prefixes
		using db = getDb()
		await db.drizzle.delete(pool).where(or(like(pool.publicKey, `${POOL_PREFIX}%`), like(pool.user, `${USER_PREFIX}%`)))
	})

	describe("createPool mutation", () => {
		it("creates new pool job", async () => {
			const result = await query(
				graphql(`mutation CreatePool($input: CreatePoolInput!) {
					createPool(input: $input) { 
						id,
						status
					 }
				}`),
				{
					input: {
						user: `${USER_PREFIX}-test123`,
						tokenA: "B62tokenA",
						tokenB: "B62tokenB",
						network: "mina_devnet"
					}
				}
			)
			expect(result.errors).toBeUndefined()
			expect(result?.data?.createPool?.status).toBe("created")
			expect(result?.data?.createPool?.id).toBeTruthy()
		})

		it("creates separate jobs for each request", async () => {
			const input = {
				user: `${USER_PREFIX}-duplicate`,
				tokenA: "B62tokenA",
				tokenB: "B62tokenB",
				network: "mina_devnet" as const
			}

			const result1 = await query(
				graphql(`mutation CreatePool($input: CreatePoolInput!) {
					createPool(input: $input) { id status }
				}`),
				{ input }
			)

			const jobId1 = result1.data?.createPool?.id

			const result2 = await query(
				graphql(`mutation CreatePool($input: CreatePoolInput!) {
					createPool(input: $input) { 
						id
						status 
					}
				}`),
				{ input }
			)

			const jobId2 = result2.data?.createPool?.id

			// Each request creates a new job with a unique ID
			expect(jobId1).toBeTruthy()
			expect(jobId2).toBeTruthy()
			expect(jobId1).not.toBe(jobId2)
			expect(result2.data?.createPool?.status).toBe("created")
		})
	})

	describe("poolCreationJob query", () => {
		it("returns error for non-existent job", async () => {
			const result = await query(
				graphql(`query GetJob($jobId: String!) {
					poolCreationJob(jobId: $jobId) { status }
				}`),
				{ jobId: "nonexistent" }
			)

			expect(result.errors).toBeDefined()
			expect(result.errors?.[0].message).toContain("not found")
		})

		it("returns completed job with transaction", async () => {
			const createResult = await query(
				graphql(`mutation CreatePool($input: CreatePoolInput!) {
					createPool(input: $input) { 
						id
						status
					}
				}`),
				{
					input: {
						user: `${USER_PREFIX}-completed`,
						tokenA: "B62tokenA",
						tokenB: "B62tokenB",
						network: "mina_devnet"
					}
				}
			)

			const jobId = createResult.data?.createPool?.id as string
			expect(jobId).toBeTruthy()
			await new Promise((resolve) => setTimeout(resolve, 1000))

			const result = await query(
				graphql(`query GetJob($jobId: String!) {
					poolCreationJob(jobId: $jobId) {
						status
						transactionJson
						poolPublicKey
					}
				}`),
				{ jobId }
			)

			expect(result.data?.poolCreationJob?.status).toBe("completed")
			expect(result.data?.poolCreationJob?.transactionJson).toBeDefined()
			expect(result.data?.poolCreationJob?.poolPublicKey).toContain(POOL_PREFIX)
		})
	})

	describe("confirmJob mutation", () => {
		it("confirms job and removes from cache", async () => {
			const createResult = await query(
				graphql(`mutation CreatePool($input: CreatePoolInput!) {
					createPool(input: $input) { id status }
				}`),
				{
					input: {
						user: `${USER_PREFIX}-confirm`,
						tokenA: "B62tokenA",
						tokenB: "B62tokenB",
						network: "mina_devnet"
					}
				}
			)

			const jobId = createResult.data?.createPool?.id as string
			expect(jobId).toBeTruthy()
			await new Promise((resolve) => setTimeout(resolve, 300))

			using q = jobQueue()
			expect(q.hasJob(jobId)).toBe(true)

			const confirmResult = await query(graphql("mutation ConfirmJob($jobId: String!) { confirmJob(jobId: $jobId) }"), {
				jobId
			})

			expect(confirmResult.data?.confirmJob).toBeTruthy()
			expect(typeof confirmResult.data?.confirmJob).toBe("string")
			expect(q.hasJob(jobId)).toBe(false)
		})

		it("returns error for non-existent job", async () => {
			const result = await query(graphql("mutation ConfirmJob($jobId: String!) { confirmJob(jobId: $jobId) }"), {
				jobId: "nonexistent"
			})

			expect(result.errors).toBeDefined()
			expect(result.errors?.[0].message).toContain("No pool found")
		})
	})

	describe("full workflow", () => {
		it("handles create → wait → confirm", async () => {
			const createResult = await query(
				graphql(`mutation CreatePool($input: CreatePoolInput!) {
					createPool(input: $input) { id status }
				}`),
				{
					input: {
						user: `${USER_PREFIX}-workflow`,
						tokenA: "B62tokenA",
						tokenB: "B62tokenB",
						network: "mina_devnet"
					}
				}
			)

			const jobId = createResult.data?.createPool?.id as string
			expect(jobId).toBeTruthy()

			// Wait for job to complete
			await new Promise((resolve) => setTimeout(resolve, 300))

			// Check job completed
			const jobResult = await query(
				graphql(`query GetJob($jobId: String!) {
					poolCreationJob(jobId: $jobId) {
						status
					}
				}`),
				{ jobId }
			)

			expect(jobResult.data?.poolCreationJob?.status).toBe("completed")

			// Verify in cache
			using q = jobQueue()
			expect(q.hasJob(jobId)).toBe(true)

			// Confirm job
			const confirmResult = await query(
				graphql(`mutation ConfirmJob($jobId: String!) 
			{ confirmJob(jobId: $jobId) }`),
				{ jobId }
			)

			expect(confirmResult.data?.confirmJob).toBeTruthy()
			expect(typeof confirmResult.data?.confirmJob).toBe("string")
			expect(q.hasJob(jobId)).toBe(false)

			// Confirming again should fail
			const confirmAgain = await query(
				graphql(`mutation ConfirmJob($jobId: String!)
				 { confirmJob(jobId: $jobId) }`),
				{ jobId }
			)

			expect(confirmAgain.errors).toBeUndefined()
			expect(confirmAgain.data?.confirmJob).toContain("already confirmed")
		})
	})

	describe("poolCreation subscription", () => {
		it("processes jobs sequentially one by one", async () => {
			const results: JobResult[] = []

			// Create 3 jobs and subscribe to each simultaneously
			await Promise.all(
				[1, 2, 3].map(async (i) => {
					// Fire the mutation
					const createResult = await query(
						graphql(`mutation CreatePool($input: CreatePoolInput!) {
							createPool(input: $input) { id status }
						}`),
						{
							input: {
								user: `${USER_PREFIX}-sequential-${i}`,
								tokenA: "B62tokenA",
								tokenB: "B62tokenB",
								network: "mina_devnet"
							}
						}
					)

					const jobId = createResult.data?.createPool?.id
					expect(jobId).toBeTruthy()

					// Fire the subscription
					const subscriptionQuery = graphql(`
						subscription PoolCreation($jobId: String!) {
							poolCreation(jobId: $jobId) {
								status
								poolPublicKey
								transactionJson
								completedAt
							}
						}
					`)
					if (!jobId) throw new Error("jobId is undefined")
					const response = await subscribe(subscriptionQuery, { jobId })

					// Read the result
					const result = await readSSEStream<JobResult>(response, "poolCreation")
					console.log({ result })
					expect(result?.status).toBe("completed")

					if (result) {
						const revived = { ...result, completedAt: new Date(result.completedAt) }
						results.push(revived)
					}
				})
			)

			// Verify we got all 3 results
			expect(results).toHaveLength(3)

			// Sort by completedAt timestamp
			results.sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())
			// Check that each completion is ~100ms apart (allowing for some variance)
			for (let i = 1; i < results.length; i++) {
				const timeDiff = results[i].completedAt.getTime() - results[i - 1].completedAt.getTime()
				// Allow 150-300ms range to account for execution overhead
				expect(timeDiff).toBeGreaterThanOrEqual(100)
				expect(timeDiff).toBeLessThanOrEqual(200)
			}
		})

		it("subscribes to pool creation and receives completion event", async () => {
			// Create a pool job first
			const createResult = await query(
				graphql(`mutation CreatePool($input: CreatePoolInput!) {
					createPool(input: $input) { id status }
				}`),
				{
					input: {
						user: `${USER_PREFIX}-subscription`,
						tokenA: "B62tokenA",
						tokenB: "B62tokenB",
						network: "mina_devnet"
					}
				}
			)

			const jobId = createResult.data?.createPool?.id as string
			expect(jobId).toBeTruthy()

			// Subscribe to the job
			const subscriptionQuery = graphql(`
				subscription PoolCreation($jobId: String!) {
					poolCreation(jobId: $jobId) {
						status
						poolPublicKey
						transactionJson
					}
				}
			`)

			const response = await subscribe(subscriptionQuery, { jobId })

			expect(response.ok).toBe(true)
			expect(response.headers.get("content-type")).toContain("text/event-stream")

			// Read the SSE stream and get the result
			const result = await readSSEStream<JobResult>(response, "poolCreation")

			// Verify the subscription result
			expect(result).toBeTruthy()
			expect(result?.status).toBe("completed")
			expect(result?.poolPublicKey).toContain(POOL_PREFIX)
			expect(result?.transactionJson).toBeDefined()
		})

		it("returns error for non-existent job subscription", async () => {
			const subscriptionQuery = graphql(`
				subscription PoolCreation($jobId: String!) {
					poolCreation(jobId: $jobId) {
						status
						poolPublicKey
						transactionJson
					}
				}
			`)

			const response = await subscribe(subscriptionQuery, { jobId: "nonexistent-subscription" })

			expect(response.ok).toBe(true)

			// Read the SSE stream and check for error
			const errorFound = await streamContainsError(response, "not found")

			expect(errorFound).toBe(true)
		})

		it("immediately returns completed job when subscribing to already completed job", async () => {
			// Create and wait for job to complete
			const createResult = await query(
				graphql(`mutation CreatePool($input: CreatePoolInput!) {
					createPool(input: $input) { id status }
				}`),
				{
					input: {
						user: `${USER_PREFIX}-subscription-completed`,
						tokenA: "B62tokenA",
						tokenB: "B62tokenB",
						network: "mina_devnet"
					}
				}
			)

			const jobId = createResult.data?.createPool?.id as string
			expect(jobId).toBeTruthy()
			await new Promise((resolve) => setTimeout(resolve, 300))

			// Verify job is completed
			using q = jobQueue()
			const job = q.getJob(jobId)
			expect(job?.status).toBe("completed")

			// Now subscribe to the already completed job
			const subscriptionQuery = graphql(`
				subscription PoolCreation($jobId: String!) {
					poolCreation(jobId: $jobId) {
						status
						poolPublicKey
						transactionJson
					}
				}
			`)

			const response = await subscribe(subscriptionQuery, { jobId })

			expect(response.ok).toBe(true)

			// Read the SSE stream - should get immediate result
			const result = await readSSEStream<JobResult>(response, "poolCreation")

			expect(result).toBeTruthy()
			expect(result?.status).toBe("completed")
			expect(result?.poolPublicKey).toContain(POOL_PREFIX)
		})
	})
})
