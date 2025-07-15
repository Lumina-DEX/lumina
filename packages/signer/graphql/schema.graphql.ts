export const typeDefs = `"""Input type for creating a new pool"""
input CreatePoolInput {
  network: Network!
  tokenA: String!
  tokenB: String!
  user: String!
}

"""
The 'JSONObject' scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).
"""
scalar JSONObject

"""A job representing a pool creation task"""
type Job {
  id: String
}

"""A job result represented in JSON format"""
type JobResult {
  poolPublicKey: String!
  transactionJson: JSONObject!
}

type Mutation {
  """Confirm a job for a given pool"""
  confirmJob(poolPublicKey: String!): String

  """Create a new pool"""
  createPool(input: CreatePoolInput!): Job
}

enum Network {
  mina_devnet
  mina_mainnet
  zeko_mainnet
  zeko_testnet
}

type Query {
  """Get the status of a pool creation job"""
  poolCreationJob(jobId: String!): JobResult
}

type Subscription {
  """Subscribe to pool creation events"""
  poolCreation(jobId: String!): JobResult
}`
