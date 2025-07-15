export const typeDefs = `"""Input type for creating a new pool"""
input CreatePoolInput {
  network: Network!
  tokenA: String!
  tokenB: String!
  user: String!
}

"""A job representing a pool creation task"""
type Job {
  id: String
}

"""A job result represented in JSON format"""
type JobResult {
  poolPublicKey: String!
  status: String!
  transactionJson: String!
}

type Mutation {
  """Confirm a job with a given jobId"""
  confirmJob(jobId: String!): String

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
  """Get the pool creation job"""
  poolCreationJob(jobId: String!): JobResult
}

type Subscription {
  """Subscribe to pool creation events"""
  poolCreation(jobId: String!): JobResult
}`
