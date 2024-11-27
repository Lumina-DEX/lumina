/* eslint-disable */
/* prettier-ignore */

export type introspection_types = {
	Account: {
		kind: "OBJECT"
		name: "Account"
		fields: {
			actionState: {
				name: "actionState"
				type: {
					kind: "LIST"
					name: never
					ofType: {
						kind: "NON_NULL"
						name: never
						ofType: { kind: "SCALAR"; name: "Action"; ofType: null }
					}
				}
			}
			balance: {
				name: "balance"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "AnnotatedBalance"; ofType: null }
				}
			}
			delegate: { name: "delegate"; type: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			delegateAccount: {
				name: "delegateAccount"
				type: { kind: "OBJECT"; name: "Account"; ofType: null }
			}
			delegators: {
				name: "delegators"
				type: {
					kind: "LIST"
					name: never
					ofType: {
						kind: "NON_NULL"
						name: never
						ofType: { kind: "OBJECT"; name: "Account"; ofType: null }
					}
				}
			}
			epochDelegateAccount: {
				name: "epochDelegateAccount"
				type: { kind: "OBJECT"; name: "Account"; ofType: null }
			}
			index: { name: "index"; type: { kind: "SCALAR"; name: "Int"; ofType: null } }
			inferredNonce: {
				name: "inferredNonce"
				type: { kind: "SCALAR"; name: "AccountNonce"; ofType: null }
			}
			lastEpochDelegators: {
				name: "lastEpochDelegators"
				type: {
					kind: "LIST"
					name: never
					ofType: {
						kind: "NON_NULL"
						name: never
						ofType: { kind: "OBJECT"; name: "Account"; ofType: null }
					}
				}
			}
			leafHash: { name: "leafHash"; type: { kind: "SCALAR"; name: "FieldElem"; ofType: null } }
			locked: { name: "locked"; type: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			merklePath: {
				name: "merklePath"
				type: {
					kind: "LIST"
					name: never
					ofType: {
						kind: "NON_NULL"
						name: never
						ofType: { kind: "OBJECT"; name: "MerklePathElement"; ofType: null }
					}
				}
			}
			nonce: { name: "nonce"; type: { kind: "SCALAR"; name: "AccountNonce"; ofType: null } }
			permissions: {
				name: "permissions"
				type: { kind: "OBJECT"; name: "AccountPermissions"; ofType: null }
			}
			privateKeyPath: {
				name: "privateKeyPath"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "String"; ofType: null }
				}
			}
			provedState: { name: "provedState"; type: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			publicKey: {
				name: "publicKey"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null }
				}
			}
			receiptChainHash: {
				name: "receiptChainHash"
				type: { kind: "SCALAR"; name: "ChainHash"; ofType: null }
			}
			stakingActive: {
				name: "stakingActive"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null }
				}
			}
			timing: {
				name: "timing"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "AccountTiming"; ofType: null }
				}
			}
			token: {
				name: "token"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null }
				}
			}
			tokenId: {
				name: "tokenId"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null }
				}
			}
			tokenSymbol: { name: "tokenSymbol"; type: { kind: "SCALAR"; name: "String"; ofType: null } }
			verificationKey: {
				name: "verificationKey"
				type: { kind: "OBJECT"; name: "AccountVerificationKeyWithHash"; ofType: null }
			}
			votingFor: { name: "votingFor"; type: { kind: "SCALAR"; name: "ChainHash"; ofType: null } }
			zkappState: {
				name: "zkappState"
				type: {
					kind: "LIST"
					name: never
					ofType: {
						kind: "NON_NULL"
						name: never
						ofType: { kind: "SCALAR"; name: "FieldElem"; ofType: null }
					}
				}
			}
			zkappUri: { name: "zkappUri"; type: { kind: "SCALAR"; name: "String"; ofType: null } }
		}
	}
	AccountAuthRequired: {
		name: "AccountAuthRequired"
		enumValues: "None" | "Either" | "Proof" | "Signature" | "Impossible"
	}
	AccountNonce: unknown
	AccountPermissions: {
		kind: "OBJECT"
		name: "AccountPermissions"
		fields: {
			access: {
				name: "access"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null }
				}
			}
			editActionState: {
				name: "editActionState"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null }
				}
			}
			editState: {
				name: "editState"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null }
				}
			}
			incrementNonce: {
				name: "incrementNonce"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null }
				}
			}
			receive: {
				name: "receive"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null }
				}
			}
			send: {
				name: "send"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null }
				}
			}
			setDelegate: {
				name: "setDelegate"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null }
				}
			}
			setPermissions: {
				name: "setPermissions"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null }
				}
			}
			setTiming: {
				name: "setTiming"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null }
				}
			}
			setTokenSymbol: {
				name: "setTokenSymbol"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null }
				}
			}
			setVerificationKey: {
				name: "setVerificationKey"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "VerificationKeyPermission"; ofType: null }
				}
			}
			setVotingFor: {
				name: "setVotingFor"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null }
				}
			}
			setZkappUri: {
				name: "setZkappUri"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null }
				}
			}
		}
	}
	AccountPrecondition: {
		kind: "OBJECT"
		name: "AccountPrecondition"
		fields: {
			actionState: { name: "actionState"; type: { kind: "SCALAR"; name: "Field"; ofType: null } }
			balance: { name: "balance"; type: { kind: "OBJECT"; name: "BalanceInterval"; ofType: null } }
			delegate: { name: "delegate"; type: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			isNew: { name: "isNew"; type: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			nonce: { name: "nonce"; type: { kind: "OBJECT"; name: "NonceInterval"; ofType: null } }
			provedState: { name: "provedState"; type: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			receiptChainHash: {
				name: "receiptChainHash"
				type: { kind: "SCALAR"; name: "Field"; ofType: null }
			}
			state: {
				name: "state"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "SCALAR"; name: "Field"; ofType: null }
					}
				}
			}
		}
	}
	AccountPreconditionInput: {
		kind: "INPUT_OBJECT"
		name: "AccountPreconditionInput"
		isOneOf: false
		inputFields: [
			{
				name: "balance"
				type: { kind: "INPUT_OBJECT"; name: "BalanceIntervalInput"; ofType: null }
				defaultValue: null
			},
			{
				name: "nonce"
				type: { kind: "INPUT_OBJECT"; name: "NonceIntervalInput"; ofType: null }
				defaultValue: null
			},
			{
				name: "receiptChainHash"
				type: { kind: "SCALAR"; name: "Field"; ofType: null }
				defaultValue: null
			},
			{
				name: "delegate"
				type: { kind: "SCALAR"; name: "PublicKey"; ofType: null }
				defaultValue: null
			},
			{
				name: "state"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "SCALAR"; name: "Field"; ofType: null }
					}
				}
				defaultValue: null
			},
			{
				name: "actionState"
				type: { kind: "SCALAR"; name: "Field"; ofType: null }
				defaultValue: null
			},
			{
				name: "provedState"
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null }
				defaultValue: null
			},
			{ name: "isNew"; type: { kind: "SCALAR"; name: "Boolean"; ofType: null }; defaultValue: null }
		]
	}
	AccountTiming: {
		kind: "OBJECT"
		name: "AccountTiming"
		fields: {
			cliffAmount: { name: "cliffAmount"; type: { kind: "SCALAR"; name: "Amount"; ofType: null } }
			cliffTime: { name: "cliffTime"; type: { kind: "SCALAR"; name: "Globalslot"; ofType: null } }
			initialMinimumBalance: {
				name: "initialMinimumBalance"
				type: { kind: "SCALAR"; name: "Balance"; ofType: null }
			}
			vestingIncrement: {
				name: "vestingIncrement"
				type: { kind: "SCALAR"; name: "Amount"; ofType: null }
			}
			vestingPeriod: {
				name: "vestingPeriod"
				type: { kind: "SCALAR"; name: "GlobalSlotSpan"; ofType: null }
			}
		}
	}
	AccountUpdateBody: {
		kind: "OBJECT"
		name: "AccountUpdateBody"
		fields: {
			actions: {
				name: "actions"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: {
								kind: "LIST"
								name: never
								ofType: {
									kind: "NON_NULL"
									name: never
									ofType: { kind: "SCALAR"; name: "Field"; ofType: null }
								}
							}
						}
					}
				}
			}
			authorizationKind: {
				name: "authorizationKind"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "AuthorizationKindStructured"; ofType: null }
				}
			}
			balanceChange: {
				name: "balanceChange"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "BalanceChange"; ofType: null }
				}
			}
			callData: {
				name: "callData"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Field"; ofType: null }
				}
			}
			callDepth: {
				name: "callDepth"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Int"; ofType: null }
				}
			}
			events: {
				name: "events"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: {
								kind: "LIST"
								name: never
								ofType: {
									kind: "NON_NULL"
									name: never
									ofType: { kind: "SCALAR"; name: "Field"; ofType: null }
								}
							}
						}
					}
				}
			}
			implicitAccountCreationFee: {
				name: "implicitAccountCreationFee"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null }
				}
			}
			incrementNonce: {
				name: "incrementNonce"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null }
				}
			}
			mayUseToken: {
				name: "mayUseToken"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "MayUseToken"; ofType: null }
				}
			}
			preconditions: {
				name: "preconditions"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "Preconditions"; ofType: null }
				}
			}
			publicKey: {
				name: "publicKey"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null }
				}
			}
			tokenId: {
				name: "tokenId"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null }
				}
			}
			update: {
				name: "update"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "AccountUpdateModification"; ofType: null }
				}
			}
			useFullCommitment: {
				name: "useFullCommitment"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null }
				}
			}
		}
	}
	AccountUpdateBodyInput: {
		kind: "INPUT_OBJECT"
		name: "AccountUpdateBodyInput"
		isOneOf: false
		inputFields: [
			{
				name: "publicKey"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "tokenId"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "update"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "INPUT_OBJECT"; name: "AccountUpdateModificationInput"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "balanceChange"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "INPUT_OBJECT"; name: "BalanceChangeInput"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "incrementNonce"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "events"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: {
								kind: "LIST"
								name: never
								ofType: {
									kind: "NON_NULL"
									name: never
									ofType: { kind: "SCALAR"; name: "Field"; ofType: null }
								}
							}
						}
					}
				}
				defaultValue: null
			},
			{
				name: "actions"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: {
								kind: "LIST"
								name: never
								ofType: {
									kind: "NON_NULL"
									name: never
									ofType: { kind: "SCALAR"; name: "Field"; ofType: null }
								}
							}
						}
					}
				}
				defaultValue: null
			},
			{
				name: "callData"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Field"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "callDepth"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Int"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "preconditions"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "INPUT_OBJECT"; name: "PreconditionsInput"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "useFullCommitment"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "implicitAccountCreationFee"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "mayUseToken"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "INPUT_OBJECT"; name: "MayUseTokenInput"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "authorizationKind"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "INPUT_OBJECT"; name: "AuthorizationKindStructuredInput"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	AccountUpdateModification: {
		kind: "OBJECT"
		name: "AccountUpdateModification"
		fields: {
			appState: {
				name: "appState"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "SCALAR"; name: "Field"; ofType: null }
					}
				}
			}
			delegate: { name: "delegate"; type: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			permissions: {
				name: "permissions"
				type: { kind: "OBJECT"; name: "Permissions"; ofType: null }
			}
			timing: { name: "timing"; type: { kind: "OBJECT"; name: "Timing"; ofType: null } }
			tokenSymbol: { name: "tokenSymbol"; type: { kind: "SCALAR"; name: "String"; ofType: null } }
			verificationKey: {
				name: "verificationKey"
				type: { kind: "OBJECT"; name: "VerificationKeyWithHash"; ofType: null }
			}
			votingFor: { name: "votingFor"; type: { kind: "SCALAR"; name: "StateHash"; ofType: null } }
			zkappUri: { name: "zkappUri"; type: { kind: "SCALAR"; name: "String"; ofType: null } }
		}
	}
	AccountUpdateModificationInput: {
		kind: "INPUT_OBJECT"
		name: "AccountUpdateModificationInput"
		isOneOf: false
		inputFields: [
			{
				name: "appState"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "SCALAR"; name: "Field"; ofType: null }
					}
				}
				defaultValue: null
			},
			{
				name: "delegate"
				type: { kind: "SCALAR"; name: "PublicKey"; ofType: null }
				defaultValue: null
			},
			{
				name: "verificationKey"
				type: { kind: "INPUT_OBJECT"; name: "VerificationKeyWithHashInput"; ofType: null }
				defaultValue: null
			},
			{
				name: "permissions"
				type: { kind: "INPUT_OBJECT"; name: "PermissionsInput"; ofType: null }
				defaultValue: null
			},
			{
				name: "zkappUri"
				type: { kind: "SCALAR"; name: "String"; ofType: null }
				defaultValue: null
			},
			{
				name: "tokenSymbol"
				type: { kind: "SCALAR"; name: "String"; ofType: null }
				defaultValue: null
			},
			{
				name: "timing"
				type: { kind: "INPUT_OBJECT"; name: "TimingInput"; ofType: null }
				defaultValue: null
			},
			{
				name: "votingFor"
				type: { kind: "SCALAR"; name: "StateHash"; ofType: null }
				defaultValue: null
			}
		]
	}
	AccountVerificationKeyWithHash: {
		kind: "OBJECT"
		name: "AccountVerificationKeyWithHash"
		fields: {
			hash: {
				name: "hash"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "VerificationKeyHash"; ofType: null }
				}
			}
			verificationKey: {
				name: "verificationKey"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "VerificationKey"; ofType: null }
				}
			}
		}
	}
	Action: unknown
	ActionData: {
		kind: "OBJECT"
		name: "ActionData"
		fields: {
			accountUpdateId: {
				name: "accountUpdateId"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "String"; ofType: null }
				}
			}
			data: {
				name: "data"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "SCALAR"; name: "String"; ofType: null }
						}
					}
				}
			}
			transactionInfo: {
				name: "transactionInfo"
				type: { kind: "OBJECT"; name: "TransactionInfo"; ofType: null }
			}
		}
	}
	ActionFilterOptionsInput: {
		kind: "INPUT_OBJECT"
		name: "ActionFilterOptionsInput"
		isOneOf: false
		inputFields: [
			{
				name: "endActionState"
				type: { kind: "SCALAR"; name: "String"; ofType: null }
				defaultValue: null
			},
			{
				name: "fromActionState"
				type: { kind: "SCALAR"; name: "String"; ofType: null }
				defaultValue: null
			},
			{
				name: "tokenId"
				type: { kind: "SCALAR"; name: "TokenId"; ofType: null }
				defaultValue: null
			},
			{
				name: "address"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	ActionOutput: {
		kind: "OBJECT"
		name: "ActionOutput"
		fields: {
			actionData: {
				name: "actionData"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "OBJECT"; name: "ActionData"; ofType: null }
						}
					}
				}
			}
			actionState: {
				name: "actionState"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "ActionStates"; ofType: null }
				}
			}
			blockInfo: { name: "blockInfo"; type: { kind: "OBJECT"; name: "BlockInfo"; ofType: null } }
			transactionInfo: {
				name: "transactionInfo"
				type: { kind: "OBJECT"; name: "TransactionInfo"; ofType: null }
			}
		}
	}
	ActionStates: {
		kind: "OBJECT"
		name: "ActionStates"
		fields: {
			actionStateFive: {
				name: "actionStateFive"
				type: { kind: "SCALAR"; name: "String"; ofType: null }
			}
			actionStateFour: {
				name: "actionStateFour"
				type: { kind: "SCALAR"; name: "String"; ofType: null }
			}
			actionStateOne: {
				name: "actionStateOne"
				type: { kind: "SCALAR"; name: "String"; ofType: null }
			}
			actionStateThree: {
				name: "actionStateThree"
				type: { kind: "SCALAR"; name: "String"; ofType: null }
			}
			actionStateTwo: {
				name: "actionStateTwo"
				type: { kind: "SCALAR"; name: "String"; ofType: null }
			}
		}
	}
	Amount: unknown
	AnnotatedBalance: {
		kind: "OBJECT"
		name: "AnnotatedBalance"
		fields: {
			blockHeight: {
				name: "blockHeight"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Length"; ofType: null }
				}
			}
			liquid: { name: "liquid"; type: { kind: "SCALAR"; name: "Balance"; ofType: null } }
			locked: { name: "locked"; type: { kind: "SCALAR"; name: "Balance"; ofType: null } }
			stateHash: { name: "stateHash"; type: { kind: "SCALAR"; name: "StateHash"; ofType: null } }
			total: {
				name: "total"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Balance"; ofType: null }
				}
			}
			unknown: {
				name: "unknown"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Balance"; ofType: null }
				}
			}
		}
	}
	AuthRequired: unknown
	AuthorizationKindStructured: {
		kind: "OBJECT"
		name: "AuthorizationKindStructured"
		fields: {
			isProved: {
				name: "isProved"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null }
				}
			}
			isSigned: {
				name: "isSigned"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null }
				}
			}
			verificationKeyHash: {
				name: "verificationKeyHash"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Field"; ofType: null }
				}
			}
		}
	}
	AuthorizationKindStructuredInput: {
		kind: "INPUT_OBJECT"
		name: "AuthorizationKindStructuredInput"
		isOneOf: false
		inputFields: [
			{
				name: "isSigned"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "isProved"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "verificationKeyHash"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Field"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	Balance: unknown
	BalanceChange: {
		kind: "OBJECT"
		name: "BalanceChange"
		fields: {
			magnitude: {
				name: "magnitude"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null }
				}
			}
			sgn: {
				name: "sgn"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Sign"; ofType: null }
				}
			}
		}
	}
	BalanceChangeInput: {
		kind: "INPUT_OBJECT"
		name: "BalanceChangeInput"
		isOneOf: false
		inputFields: [
			{
				name: "magnitude"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "sgn"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Sign"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	BalanceInterval: {
		kind: "OBJECT"
		name: "BalanceInterval"
		fields: {
			lower: {
				name: "lower"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Balance"; ofType: null }
				}
			}
			upper: {
				name: "upper"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Balance"; ofType: null }
				}
			}
		}
	}
	BalanceIntervalInput: {
		kind: "INPUT_OBJECT"
		name: "BalanceIntervalInput"
		isOneOf: false
		inputFields: [
			{
				name: "lower"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Balance"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "upper"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Balance"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	BlockInfo: {
		kind: "OBJECT"
		name: "BlockInfo"
		fields: {
			chainStatus: {
				name: "chainStatus"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "String"; ofType: null }
				}
			}
			distanceFromMaxBlockHeight: {
				name: "distanceFromMaxBlockHeight"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Int"; ofType: null }
				}
			}
			globalSlotSinceGenesis: {
				name: "globalSlotSinceGenesis"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Int"; ofType: null }
				}
			}
			globalSlotSinceHardfork: {
				name: "globalSlotSinceHardfork"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Int"; ofType: null }
				}
			}
			height: {
				name: "height"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Int"; ofType: null }
				}
			}
			ledgerHash: {
				name: "ledgerHash"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "String"; ofType: null }
				}
			}
			parentHash: {
				name: "parentHash"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "String"; ofType: null }
				}
			}
			stateHash: {
				name: "stateHash"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "String"; ofType: null }
				}
			}
			timestamp: {
				name: "timestamp"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Int"; ofType: null }
				}
			}
		}
	}
	Boolean: unknown
	ChainHash: unknown
	Control: {
		kind: "OBJECT"
		name: "Control"
		fields: {
			proof: { name: "proof"; type: { kind: "SCALAR"; name: "ZkappProof"; ofType: null } }
			signature: { name: "signature"; type: { kind: "SCALAR"; name: "Signature"; ofType: null } }
		}
	}
	ControlInput: {
		kind: "INPUT_OBJECT"
		name: "ControlInput"
		isOneOf: false
		inputFields: [
			{
				name: "proof"
				type: { kind: "SCALAR"; name: "ZkappProof"; ofType: null }
				defaultValue: null
			},
			{
				name: "signature"
				type: { kind: "SCALAR"; name: "Signature"; ofType: null }
				defaultValue: null
			}
		]
	}
	CurrencyAmount: unknown
	CurrencyAmountInterval: {
		kind: "OBJECT"
		name: "CurrencyAmountInterval"
		fields: {
			lower: {
				name: "lower"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null }
				}
			}
			upper: {
				name: "upper"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null }
				}
			}
		}
	}
	CurrencyAmountIntervalInput: {
		kind: "INPUT_OBJECT"
		name: "CurrencyAmountIntervalInput"
		isOneOf: false
		inputFields: [
			{
				name: "lower"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "upper"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	DaemonStatus: {
		kind: "OBJECT"
		name: "DaemonStatus"
		fields: {
			chainId: {
				name: "chainId"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "String"; ofType: null }
				}
			}
		}
	}
	EpochDataPrecondition: {
		kind: "OBJECT"
		name: "EpochDataPrecondition"
		fields: {
			epochLength: {
				name: "epochLength"
				type: { kind: "OBJECT"; name: "LengthInterval"; ofType: null }
			}
			ledger: {
				name: "ledger"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "EpochLedgerPrecondition"; ofType: null }
				}
			}
			lockCheckpoint: {
				name: "lockCheckpoint"
				type: { kind: "SCALAR"; name: "Field"; ofType: null }
			}
			seed: { name: "seed"; type: { kind: "SCALAR"; name: "Field"; ofType: null } }
			startCheckpoint: {
				name: "startCheckpoint"
				type: { kind: "SCALAR"; name: "Field"; ofType: null }
			}
		}
	}
	EpochDataPreconditionInput: {
		kind: "INPUT_OBJECT"
		name: "EpochDataPreconditionInput"
		isOneOf: false
		inputFields: [
			{
				name: "ledger"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "INPUT_OBJECT"; name: "EpochLedgerPreconditionInput"; ofType: null }
				}
				defaultValue: null
			},
			{ name: "seed"; type: { kind: "SCALAR"; name: "Field"; ofType: null }; defaultValue: null },
			{
				name: "startCheckpoint"
				type: { kind: "SCALAR"; name: "Field"; ofType: null }
				defaultValue: null
			},
			{
				name: "lockCheckpoint"
				type: { kind: "SCALAR"; name: "Field"; ofType: null }
				defaultValue: null
			},
			{
				name: "epochLength"
				type: { kind: "INPUT_OBJECT"; name: "LengthIntervalInput"; ofType: null }
				defaultValue: null
			}
		]
	}
	EpochLedgerPrecondition: {
		kind: "OBJECT"
		name: "EpochLedgerPrecondition"
		fields: {
			hash: { name: "hash"; type: { kind: "SCALAR"; name: "Field"; ofType: null } }
			totalCurrency: {
				name: "totalCurrency"
				type: { kind: "OBJECT"; name: "CurrencyAmountInterval"; ofType: null }
			}
		}
	}
	EpochLedgerPreconditionInput: {
		kind: "INPUT_OBJECT"
		name: "EpochLedgerPreconditionInput"
		isOneOf: false
		inputFields: [
			{ name: "hash"; type: { kind: "SCALAR"; name: "Field"; ofType: null }; defaultValue: null },
			{
				name: "totalCurrency"
				type: { kind: "INPUT_OBJECT"; name: "CurrencyAmountIntervalInput"; ofType: null }
				defaultValue: null
			}
		]
	}
	EventData: {
		kind: "OBJECT"
		name: "EventData"
		fields: {
			data: {
				name: "data"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "SCALAR"; name: "String"; ofType: null }
						}
					}
				}
			}
			transactionInfo: {
				name: "transactionInfo"
				type: { kind: "OBJECT"; name: "TransactionInfo"; ofType: null }
			}
		}
	}
	EventFilterOptionsInput: {
		kind: "INPUT_OBJECT"
		name: "EventFilterOptionsInput"
		isOneOf: false
		inputFields: [
			{
				name: "tokenId"
				type: { kind: "SCALAR"; name: "TokenId"; ofType: null }
				defaultValue: null
			},
			{
				name: "address"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	EventOutput: {
		kind: "OBJECT"
		name: "EventOutput"
		fields: {
			blockInfo: { name: "blockInfo"; type: { kind: "OBJECT"; name: "BlockInfo"; ofType: null } }
			eventData: {
				name: "eventData"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "OBJECT"; name: "EventData"; ofType: null }
						}
					}
				}
			}
		}
	}
	Fee: unknown
	FeePayerBody: {
		kind: "OBJECT"
		name: "FeePayerBody"
		fields: {
			fee: {
				name: "fee"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Fee"; ofType: null }
				}
			}
			nonce: {
				name: "nonce"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null }
				}
			}
			publicKey: {
				name: "publicKey"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null }
				}
			}
			validUntil: {
				name: "validUntil"
				type: { kind: "SCALAR"; name: "GlobalSlotSinceGenesis"; ofType: null }
			}
		}
	}
	FeePayerBodyInput: {
		kind: "INPUT_OBJECT"
		name: "FeePayerBodyInput"
		isOneOf: false
		inputFields: [
			{
				name: "publicKey"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "fee"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Fee"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "validUntil"
				type: { kind: "SCALAR"; name: "GlobalSlotSinceGenesis"; ofType: null }
				defaultValue: null
			},
			{
				name: "nonce"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	Field: unknown
	FieldElem: unknown
	GenesisConstants: {
		kind: "OBJECT"
		name: "GenesisConstants"
		fields: {
			accountCreationFee: {
				name: "accountCreationFee"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Fee"; ofType: null }
				}
			}
		}
	}
	GlobalSlotSinceGenesis: unknown
	GlobalSlotSinceGenesisInterval: {
		kind: "OBJECT"
		name: "GlobalSlotSinceGenesisInterval"
		fields: {
			lower: {
				name: "lower"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "GlobalSlotSinceGenesis"; ofType: null }
				}
			}
			upper: {
				name: "upper"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "GlobalSlotSinceGenesis"; ofType: null }
				}
			}
		}
	}
	GlobalSlotSinceGenesisIntervalInput: {
		kind: "INPUT_OBJECT"
		name: "GlobalSlotSinceGenesisIntervalInput"
		isOneOf: false
		inputFields: [
			{
				name: "lower"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "GlobalSlotSinceGenesis"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "upper"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "GlobalSlotSinceGenesis"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	GlobalSlotSpan: unknown
	Globalslot: unknown
	Index: unknown
	Int: unknown
	Length: unknown
	LengthInterval: {
		kind: "OBJECT"
		name: "LengthInterval"
		fields: {
			lower: {
				name: "lower"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null }
				}
			}
			upper: {
				name: "upper"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null }
				}
			}
		}
	}
	LengthIntervalInput: {
		kind: "INPUT_OBJECT"
		name: "LengthIntervalInput"
		isOneOf: false
		inputFields: [
			{
				name: "lower"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "upper"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	MayUseToken: {
		kind: "OBJECT"
		name: "MayUseToken"
		fields: {
			inheritFromParent: {
				name: "inheritFromParent"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null }
				}
			}
			parentsOwnToken: {
				name: "parentsOwnToken"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null }
				}
			}
		}
	}
	MayUseTokenInput: {
		kind: "INPUT_OBJECT"
		name: "MayUseTokenInput"
		isOneOf: false
		inputFields: [
			{
				name: "parentsOwnToken"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "inheritFromParent"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	Memo: unknown
	MerklePathElement: {
		kind: "OBJECT"
		name: "MerklePathElement"
		fields: {
			left: { name: "left"; type: { kind: "SCALAR"; name: "FieldElem"; ofType: null } }
			right: { name: "right"; type: { kind: "SCALAR"; name: "FieldElem"; ofType: null } }
		}
	}
	NetworkPrecondition: {
		kind: "OBJECT"
		name: "NetworkPrecondition"
		fields: {
			blockchainLength: {
				name: "blockchainLength"
				type: { kind: "OBJECT"; name: "LengthInterval"; ofType: null }
			}
			globalSlotSinceGenesis: {
				name: "globalSlotSinceGenesis"
				type: { kind: "OBJECT"; name: "GlobalSlotSinceGenesisInterval"; ofType: null }
			}
			minWindowDensity: {
				name: "minWindowDensity"
				type: { kind: "OBJECT"; name: "LengthInterval"; ofType: null }
			}
			nextEpochData: {
				name: "nextEpochData"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "EpochDataPrecondition"; ofType: null }
				}
			}
			snarkedLedgerHash: {
				name: "snarkedLedgerHash"
				type: { kind: "SCALAR"; name: "Field"; ofType: null }
			}
			stakingEpochData: {
				name: "stakingEpochData"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "EpochDataPrecondition"; ofType: null }
				}
			}
			totalCurrency: {
				name: "totalCurrency"
				type: { kind: "OBJECT"; name: "CurrencyAmountInterval"; ofType: null }
			}
		}
	}
	NetworkPreconditionInput: {
		kind: "INPUT_OBJECT"
		name: "NetworkPreconditionInput"
		isOneOf: false
		inputFields: [
			{
				name: "snarkedLedgerHash"
				type: { kind: "SCALAR"; name: "Field"; ofType: null }
				defaultValue: null
			},
			{
				name: "blockchainLength"
				type: { kind: "INPUT_OBJECT"; name: "LengthIntervalInput"; ofType: null }
				defaultValue: null
			},
			{
				name: "minWindowDensity"
				type: { kind: "INPUT_OBJECT"; name: "LengthIntervalInput"; ofType: null }
				defaultValue: null
			},
			{
				name: "totalCurrency"
				type: { kind: "INPUT_OBJECT"; name: "CurrencyAmountIntervalInput"; ofType: null }
				defaultValue: null
			},
			{
				name: "globalSlotSinceGenesis"
				type: { kind: "INPUT_OBJECT"; name: "GlobalSlotSinceGenesisIntervalInput"; ofType: null }
				defaultValue: null
			},
			{
				name: "stakingEpochData"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "INPUT_OBJECT"; name: "EpochDataPreconditionInput"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "nextEpochData"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "INPUT_OBJECT"; name: "EpochDataPreconditionInput"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	NonceInterval: {
		kind: "OBJECT"
		name: "NonceInterval"
		fields: {
			lower: {
				name: "lower"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null }
				}
			}
			upper: {
				name: "upper"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null }
				}
			}
		}
	}
	NonceIntervalInput: {
		kind: "INPUT_OBJECT"
		name: "NonceIntervalInput"
		isOneOf: false
		inputFields: [
			{
				name: "lower"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "upper"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	Permissions: {
		kind: "OBJECT"
		name: "Permissions"
		fields: {
			access: {
				name: "access"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
			}
			editActionState: {
				name: "editActionState"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
			}
			editState: {
				name: "editState"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
			}
			incrementNonce: {
				name: "incrementNonce"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
			}
			receive: {
				name: "receive"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
			}
			send: {
				name: "send"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
			}
			setDelegate: {
				name: "setDelegate"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
			}
			setPermissions: {
				name: "setPermissions"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
			}
			setTiming: {
				name: "setTiming"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
			}
			setTokenSymbol: {
				name: "setTokenSymbol"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
			}
			setVerificationKey: {
				name: "setVerificationKey"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "VerificationKeyPermission"; ofType: null }
				}
			}
			setVotingFor: {
				name: "setVotingFor"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
			}
			setZkappUri: {
				name: "setZkappUri"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
			}
		}
	}
	PermissionsInput: {
		kind: "INPUT_OBJECT"
		name: "PermissionsInput"
		isOneOf: false
		inputFields: [
			{
				name: "editState"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "access"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "send"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "receive"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "setDelegate"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "setPermissions"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "setVerificationKey"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "INPUT_OBJECT"; name: "VerificationKeyPermissionInput"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "setZkappUri"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "editActionState"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "setTokenSymbol"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "incrementNonce"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "setVotingFor"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "setTiming"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	Preconditions: {
		kind: "OBJECT"
		name: "Preconditions"
		fields: {
			account: {
				name: "account"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "AccountPrecondition"; ofType: null }
				}
			}
			network: {
				name: "network"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "NetworkPrecondition"; ofType: null }
				}
			}
			validWhile: {
				name: "validWhile"
				type: { kind: "OBJECT"; name: "GlobalSlotSinceGenesisInterval"; ofType: null }
			}
		}
	}
	PreconditionsInput: {
		kind: "INPUT_OBJECT"
		name: "PreconditionsInput"
		isOneOf: false
		inputFields: [
			{
				name: "network"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "INPUT_OBJECT"; name: "NetworkPreconditionInput"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "account"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "INPUT_OBJECT"; name: "AccountPreconditionInput"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "validWhile"
				type: { kind: "INPUT_OBJECT"; name: "GlobalSlotSinceGenesisIntervalInput"; ofType: null }
				defaultValue: null
			}
		]
	}
	ProveTransferPayload: {
		kind: "OBJECT"
		name: "ProveTransferPayload"
		fields: {
			accountUpdateKey: {
				name: "accountUpdateKey"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "String"; ofType: null }
				}
			}
		}
	}
	PublicKey: unknown
	SendPaymentInput: {
		kind: "INPUT_OBJECT"
		name: "SendPaymentInput"
		isOneOf: false
		inputFields: [
			{ name: "nonce"; type: { kind: "SCALAR"; name: "UInt32"; ofType: null }; defaultValue: null },
			{ name: "memo"; type: { kind: "SCALAR"; name: "String"; ofType: null }; defaultValue: null },
			{
				name: "validUntil"
				type: { kind: "SCALAR"; name: "UInt32"; ofType: null }
				defaultValue: null
			},
			{
				name: "fee"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "UInt64"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "amount"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "UInt64"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "to"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "from"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	SendPaymentPayload: {
		kind: "OBJECT"
		name: "SendPaymentPayload"
		fields: {
			payment: {
				name: "payment"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "INTERFACE"; name: "UserCommand"; ofType: null }
				}
			}
		}
	}
	SendZkappInput: {
		kind: "INPUT_OBJECT"
		name: "SendZkappInput"
		isOneOf: false
		inputFields: [
			{
				name: "zkappCommand"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "INPUT_OBJECT"; name: "ZkappCommandInput"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	SendZkappPayload: {
		kind: "OBJECT"
		name: "SendZkappPayload"
		fields: {
			zkapp: {
				name: "zkapp"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "ZkappCommandResult"; ofType: null }
				}
			}
		}
	}
	Sign: unknown
	Signature: unknown
	SignatureInput: {
		kind: "INPUT_OBJECT"
		name: "SignatureInput"
		isOneOf: false
		inputFields: [
			{
				name: "rawSignature"
				type: { kind: "SCALAR"; name: "String"; ofType: null }
				defaultValue: null
			},
			{
				name: "scalar"
				type: { kind: "SCALAR"; name: "String"; ofType: null }
				defaultValue: null
			},
			{ name: "field"; type: { kind: "SCALAR"; name: "String"; ofType: null }; defaultValue: null }
		]
	}
	StateHash: unknown
	StateHashes: {
		kind: "OBJECT"
		name: "StateHashes"
		fields: {
			committedLedgerHash: {
				name: "committedLedgerHash"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "String"; ofType: null }
				}
			}
			provedLedgerHash: {
				name: "provedLedgerHash"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "String"; ofType: null }
				}
			}
			unprovedLedgerHash: {
				name: "unprovedLedgerHash"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "String"; ofType: null }
				}
			}
		}
	}
	Statistics: {
		kind: "OBJECT"
		name: "Statistics"
		fields: {
			deposits: {
				name: "deposits"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Int"; ofType: null }
				}
			}
			luminaLiquidityPools: {
				name: "luminaLiquidityPools"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Int"; ofType: null }
				}
			}
			luminaSwaps: {
				name: "luminaSwaps"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Int"; ofType: null }
				}
			}
			transactions: {
				name: "transactions"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Int"; ofType: null }
				}
			}
		}
	}
	String: unknown
	SyncStatus: {
		name: "SyncStatus"
		enumValues: "CONNECTING" | "LISTENING" | "OFFLINE" | "BOOTSTRAP" | "SYNCED" | "CATCHUP"
	}
	Timing: {
		kind: "OBJECT"
		name: "Timing"
		fields: {
			cliffAmount: {
				name: "cliffAmount"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null }
				}
			}
			cliffTime: {
				name: "cliffTime"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "GlobalSlotSinceGenesis"; ofType: null }
				}
			}
			initialMinimumBalance: {
				name: "initialMinimumBalance"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Balance"; ofType: null }
				}
			}
			vestingIncrement: {
				name: "vestingIncrement"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null }
				}
			}
			vestingPeriod: {
				name: "vestingPeriod"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "GlobalSlotSpan"; ofType: null }
				}
			}
		}
	}
	TimingInput: {
		kind: "INPUT_OBJECT"
		name: "TimingInput"
		isOneOf: false
		inputFields: [
			{
				name: "initialMinimumBalance"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Balance"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "cliffTime"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "GlobalSlotSinceGenesis"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "cliffAmount"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "vestingPeriod"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "GlobalSlotSpan"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "vestingIncrement"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	TokenId: unknown
	TransactionHash: unknown
	TransactionId: unknown
	TransactionInfo: {
		kind: "OBJECT"
		name: "TransactionInfo"
		fields: {
			authorizationKind: {
				name: "authorizationKind"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "String"; ofType: null }
				}
			}
			hash: {
				name: "hash"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "TransactionHash"; ofType: null }
				}
			}
			memo: {
				name: "memo"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "String"; ofType: null }
				}
			}
			status: {
				name: "status"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "String"; ofType: null }
				}
			}
		}
	}
	TransactionStatusFailure: unknown
	TransferClaimInput: {
		kind: "INPUT_OBJECT"
		name: "TransferClaimInput"
		isOneOf: false
		inputFields: [
			{
				name: "transfer"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "INPUT_OBJECT"; name: "TransferRequestInput"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "after"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "INPUT_OBJECT"; name: "TransferInput"; ofType: null }
						}
					}
				}
				defaultValue: null
			},
			{
				name: "before"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "INPUT_OBJECT"; name: "TransferInput"; ofType: null }
						}
					}
				}
				defaultValue: null
			},
			{
				name: "pointer"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "String"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "isNew"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	TransferDirection: { name: "TransferDirection"; enumValues: "DEPOSIT" | "WITHDRAW" }
	TransferInput: {
		kind: "INPUT_OBJECT"
		name: "TransferInput"
		isOneOf: false
		inputFields: [
			{
				name: "recipient"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "amount"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "UInt64"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	TransferRequestInput: {
		kind: "INPUT_OBJECT"
		name: "TransferRequestInput"
		isOneOf: false
		inputFields: [
			{
				name: "direction"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "ENUM"; name: "TransferDirection"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "transfer"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "INPUT_OBJECT"; name: "TransferInput"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	UInt32: unknown
	UInt64: unknown
	UserCommand: {
		kind: "INTERFACE"
		name: "UserCommand"
		fields: {
			amount: {
				name: "amount"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Amount"; ofType: null }
				}
			}
			failureReason: {
				name: "failureReason"
				type: { kind: "SCALAR"; name: "TransactionStatusFailure"; ofType: null }
			}
			fee: {
				name: "fee"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Fee"; ofType: null }
				}
			}
			feePayer: {
				name: "feePayer"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "Account"; ofType: null }
				}
			}
			feeToken: {
				name: "feeToken"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null }
				}
			}
			from: {
				name: "from"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null }
				}
			}
			fromAccount: {
				name: "fromAccount"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "Account"; ofType: null }
				}
			}
			hash: {
				name: "hash"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "TransactionHash"; ofType: null }
				}
			}
			id: {
				name: "id"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "TransactionId"; ofType: null }
				}
			}
			isDelegation: {
				name: "isDelegation"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null }
				}
			}
			kind: {
				name: "kind"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "UserCommandKind"; ofType: null }
				}
			}
			memo: {
				name: "memo"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "String"; ofType: null }
				}
			}
			nonce: {
				name: "nonce"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Int"; ofType: null }
				}
			}
			receiver: {
				name: "receiver"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "Account"; ofType: null }
				}
			}
			source: {
				name: "source"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "Account"; ofType: null }
				}
			}
			to: {
				name: "to"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null }
				}
			}
			toAccount: {
				name: "toAccount"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "Account"; ofType: null }
				}
			}
			token: {
				name: "token"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null }
				}
			}
			validUntil: {
				name: "validUntil"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Globalslot"; ofType: null }
				}
			}
		}
		possibleTypes: "UserCommandPayment"
	}
	UserCommandKind: unknown
	UserCommandPayment: {
		kind: "OBJECT"
		name: "UserCommandPayment"
		fields: {
			amount: {
				name: "amount"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Amount"; ofType: null }
				}
			}
			failureReason: {
				name: "failureReason"
				type: { kind: "SCALAR"; name: "TransactionStatusFailure"; ofType: null }
			}
			fee: {
				name: "fee"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Fee"; ofType: null }
				}
			}
			feePayer: {
				name: "feePayer"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "Account"; ofType: null }
				}
			}
			feeToken: {
				name: "feeToken"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null }
				}
			}
			from: {
				name: "from"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null }
				}
			}
			fromAccount: {
				name: "fromAccount"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "Account"; ofType: null }
				}
			}
			hash: {
				name: "hash"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "TransactionHash"; ofType: null }
				}
			}
			id: {
				name: "id"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "TransactionId"; ofType: null }
				}
			}
			isDelegation: {
				name: "isDelegation"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null }
				}
			}
			kind: {
				name: "kind"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "UserCommandKind"; ofType: null }
				}
			}
			memo: {
				name: "memo"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "String"; ofType: null }
				}
			}
			nonce: {
				name: "nonce"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Int"; ofType: null }
				}
			}
			receiver: {
				name: "receiver"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "Account"; ofType: null }
				}
			}
			source: {
				name: "source"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "Account"; ofType: null }
				}
			}
			to: {
				name: "to"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null }
				}
			}
			toAccount: {
				name: "toAccount"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "Account"; ofType: null }
				}
			}
			token: {
				name: "token"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null }
				}
			}
			validUntil: {
				name: "validUntil"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Globalslot"; ofType: null }
				}
			}
		}
	}
	VerificationKey: unknown
	VerificationKeyHash: unknown
	VerificationKeyPermission: {
		kind: "OBJECT"
		name: "VerificationKeyPermission"
		fields: {
			auth: {
				name: "auth"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null }
				}
			}
			txnVersion: {
				name: "txnVersion"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "String"; ofType: null }
				}
			}
		}
	}
	VerificationKeyPermissionInput: {
		kind: "INPUT_OBJECT"
		name: "VerificationKeyPermissionInput"
		isOneOf: false
		inputFields: [
			{
				name: "auth"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "txnVersion"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	VerificationKeyWithHash: {
		kind: "OBJECT"
		name: "VerificationKeyWithHash"
		fields: {
			data: {
				name: "data"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "VerificationKey"; ofType: null }
				}
			}
			hash: {
				name: "hash"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Field"; ofType: null }
				}
			}
		}
	}
	VerificationKeyWithHashInput: {
		kind: "INPUT_OBJECT"
		name: "VerificationKeyWithHashInput"
		isOneOf: false
		inputFields: [
			{
				name: "data"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "VerificationKey"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "hash"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Field"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	ZkappAccountUpdate: {
		kind: "OBJECT"
		name: "ZkappAccountUpdate"
		fields: {
			authorization: {
				name: "authorization"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "Control"; ofType: null }
				}
			}
			body: {
				name: "body"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "AccountUpdateBody"; ofType: null }
				}
			}
		}
	}
	ZkappAccountUpdateInput: {
		kind: "INPUT_OBJECT"
		name: "ZkappAccountUpdateInput"
		isOneOf: false
		inputFields: [
			{
				name: "body"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "INPUT_OBJECT"; name: "AccountUpdateBodyInput"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "authorization"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "INPUT_OBJECT"; name: "ControlInput"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	ZkappCommand: {
		kind: "OBJECT"
		name: "ZkappCommand"
		fields: {
			accountUpdates: {
				name: "accountUpdates"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "OBJECT"; name: "ZkappAccountUpdate"; ofType: null }
						}
					}
				}
			}
			feePayer: {
				name: "feePayer"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "ZkappFeePayer"; ofType: null }
				}
			}
			memo: {
				name: "memo"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Memo"; ofType: null }
				}
			}
		}
	}
	ZkappCommandFailureReason: {
		kind: "OBJECT"
		name: "ZkappCommandFailureReason"
		fields: {
			failures: {
				name: "failures"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "SCALAR"; name: "TransactionStatusFailure"; ofType: null }
						}
					}
				}
			}
			index: { name: "index"; type: { kind: "SCALAR"; name: "Index"; ofType: null } }
		}
	}
	ZkappCommandInput: {
		kind: "INPUT_OBJECT"
		name: "ZkappCommandInput"
		isOneOf: false
		inputFields: [
			{
				name: "feePayer"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "INPUT_OBJECT"; name: "ZkappFeePayerInput"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "accountUpdates"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "INPUT_OBJECT"; name: "ZkappAccountUpdateInput"; ofType: null }
						}
					}
				}
				defaultValue: null
			},
			{
				name: "memo"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Memo"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	ZkappCommandResult: {
		kind: "OBJECT"
		name: "ZkappCommandResult"
		fields: {
			failureReason: {
				name: "failureReason"
				type: {
					kind: "LIST"
					name: never
					ofType: { kind: "OBJECT"; name: "ZkappCommandFailureReason"; ofType: null }
				}
			}
			hash: {
				name: "hash"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "TransactionHash"; ofType: null }
				}
			}
			id: {
				name: "id"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "TransactionId"; ofType: null }
				}
			}
			zkappCommand: {
				name: "zkappCommand"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "ZkappCommand"; ofType: null }
				}
			}
		}
	}
	ZkappFeePayer: {
		kind: "OBJECT"
		name: "ZkappFeePayer"
		fields: {
			authorization: {
				name: "authorization"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Signature"; ofType: null }
				}
			}
			body: {
				name: "body"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "FeePayerBody"; ofType: null }
				}
			}
		}
	}
	ZkappFeePayerInput: {
		kind: "INPUT_OBJECT"
		name: "ZkappFeePayerInput"
		isOneOf: false
		inputFields: [
			{
				name: "body"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "INPUT_OBJECT"; name: "FeePayerBodyInput"; ofType: null }
				}
				defaultValue: null
			},
			{
				name: "authorization"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "Signature"; ofType: null }
				}
				defaultValue: null
			}
		]
	}
	ZkappProof: unknown
	mutation: {
		kind: "OBJECT"
		name: "mutation"
		fields: {
			proveTransferClaim: {
				name: "proveTransferClaim"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "ProveTransferPayload"; ofType: null }
				}
			}
			proveTransferRequest: {
				name: "proveTransferRequest"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "ProveTransferPayload"; ofType: null }
				}
			}
			sendPayment: {
				name: "sendPayment"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "SendPaymentPayload"; ofType: null }
				}
			}
			sendZkapp: {
				name: "sendZkapp"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "SendZkappPayload"; ofType: null }
				}
			}
		}
	}
	query: {
		kind: "OBJECT"
		name: "query"
		fields: {
			account: { name: "account"; type: { kind: "OBJECT"; name: "Account"; ofType: null } }
			accounts: {
				name: "accounts"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "OBJECT"; name: "Account"; ofType: null }
						}
					}
				}
			}
			actions: {
				name: "actions"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "OBJECT"; name: "ActionOutput"; ofType: null }
						}
					}
				}
			}
			daemonStatus: {
				name: "daemonStatus"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "DaemonStatus"; ofType: null }
				}
			}
			events: {
				name: "events"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "OBJECT"; name: "EventOutput"; ofType: null }
						}
					}
				}
			}
			genesisConstants: {
				name: "genesisConstants"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "GenesisConstants"; ofType: null }
				}
			}
			networkID: {
				name: "networkID"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "String"; ofType: null }
				}
			}
			stateHashes: {
				name: "stateHashes"
				type: { kind: "OBJECT"; name: "StateHashes"; ofType: null }
			}
			statistics: {
				name: "statistics"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "Statistics"; ofType: null }
				}
			}
			syncStatus: {
				name: "syncStatus"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "ENUM"; name: "SyncStatus"; ofType: null }
				}
			}
			tokenAccounts: {
				name: "tokenAccounts"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "OBJECT"; name: "Account"; ofType: null }
						}
					}
				}
			}
			tokenOwner: { name: "tokenOwner"; type: { kind: "OBJECT"; name: "Account"; ofType: null } }
			transferAccountUpdate: {
				name: "transferAccountUpdate"
				type: { kind: "SCALAR"; name: "String"; ofType: null }
			}
		}
	}
	subscription: {
		kind: "OBJECT"
		name: "subscription"
		fields: {
			stateHashesChanged: {
				name: "stateHashesChanged"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "StateHashes"; ofType: null }
				}
			}
		}
	}
}

/** An IntrospectionQuery representation of your schema.
 *
 * @remarks
 * This is an introspection of your schema saved as a file by GraphQLSP.
 * It will automatically be used by `gql.tada` to infer the types of your GraphQL documents.
 * If you need to reuse this data or update your `scalars`, update `tadaOutputLocation` to
 * instead save to a .ts instead of a .d.ts file.
 */
export type introspection = {
	name: "zeko-sequencer"
	query: "query"
	mutation: "mutation"
	subscription: "subscription"
	types: introspection_types
}

import * as gqlTada from "gql.tada"
