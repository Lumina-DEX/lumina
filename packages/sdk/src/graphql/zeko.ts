import { zeko as graphql } from "./helpers"

export const ProveTransferRequestMutation = graphql(`
  mutation ProveTransferRequest($transferRequestInput: TransferRequestInput!) {
    proveTransferRequest(input: $transferRequestInput) {
      accountUpdateKey
    }
  }
`)

export const ProveTransferClaimMutation = graphql(`
  mutation ProveTransferClaim($transferClaimInput: TransferClaimInput!) {
    proveTransferClaim(input: $transferClaimInput) {
      accountUpdateKey
    }
  }`)

export const GetTransferAccountUpdateQuery = graphql(`
  query GetTransferAccountUpdate($key: String!) {
    transferAccountUpdate(key: $key)
  }
`)

export const FetchZekoEvents = graphql(
	`query FetchZekoEvents($eventInput: EventFilterOptionsInput!) {
    events(input: $eventInput) {
      eventData {
        data
      }
    }
}`
)
