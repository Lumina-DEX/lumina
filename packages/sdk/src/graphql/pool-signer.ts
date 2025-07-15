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
      poolPublicKey
      status
      transactionJson
    }
  }
`)

export const ConfirmTransactionMutation = graphql(`
    mutation ConfirmTransaction($jobId: String!) {
        confirmJob(jobId: $jobId)
    }
`)

export const GetJobStatusQuery = graphql(`
  query GetJobStatus($jobId: String!) {
    poolCreationJob(jobId: $jobId) {
      status
      poolPublicKey
      transactionJson
    }
  }
`)
