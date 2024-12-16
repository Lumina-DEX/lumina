import { mina as graphql } from "./helpers"

/**
 * This will return null for a new account.
 */
export const FetchAccountBalanceQuery = graphql(`
    query FetchAccountBalance($tokenId: TokenId, $publicKey: PublicKey!,){
        account(token: $tokenId, publicKey: $publicKey ){
            balance {
                total
            }
        }
    }`)

export const LastBlockQuery = graphql(`
    query LastBlock {
        bestChain(maxLength: 1) {
            protocolState {
                blockchainState {
                    snarkedLedgerHash
                    stagedLedgerHash
                    date
                    utcDate
                    stagedLedgerProofEmitted
                }
                previousStateHash
                consensusState {
                    blockHeight
                    slotSinceGenesis
                    slot
                    nextEpochData {
                        ledger {
                            hash 
                            totalCurrency
                        }
                        seed
                        startCheckpoint
                        lockCheckpoint
                        epochLength
                    }
                    stakingEpochData {
                        ledger {
                            hash 
                            totalCurrency
                        }
                        seed
                        startCheckpoint
                        lockCheckpoint
                        epochLength
                    }
                    epochCount
                    minWindowDensity
                    totalCurrency
                    epoch
                }
            }
        }
    }`)
