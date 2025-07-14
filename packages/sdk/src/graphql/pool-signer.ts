import { poolSigner as graphql } from "./helpers"

export const CreatePoolMutation = graphql(`
  mutation CreatePool($input: CreatePoolInput!) {
    createPool(input: $input) {
      id
    }
  }
`)

export const PoolCreationSubscription = graphql(`
  subscription PoolCreation($jobId: String!) {
    poolCreation(jobId: $jobId) {
      pool
      transactionJson
    }
  }
`)

export const ConfirmTransactionMutation = graphql(`
    mutation ConfirmTransaction($jobId: String!) {
        confirmJob(jobId: $jobId)
    }
`)
