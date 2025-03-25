import { minaArchive as graphql } from "./helpers"

export const EventsQuery = graphql(`
    query Events($options: EventFilterOptionsInput!) {
        events(input: $options) {
            blockInfo {
                distanceFromMaxBlockHeight
                height
                globalSlotSinceGenesis
                stateHash
                parentHash
                chainStatus
            }
            eventData {
                transactionInfo {
                    hash
                    memo
                    status
                }
                data
            }
        }
    }
`)

export const NetworkStateQuery = graphql(`
    query NetworkState {
        networkState {
            maxBlockHeight {
                canonicalMaxBlockHeight
                pendingMaxBlockHeight
            }
        }
    }
`)
