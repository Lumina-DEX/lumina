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
