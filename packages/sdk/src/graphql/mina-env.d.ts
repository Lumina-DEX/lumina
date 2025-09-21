// dprint-ignore-file
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
					ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Action"; ofType: null } }
				}
			}
			balance: {
				name: "balance"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "AnnotatedBalance"; ofType: null } }
			}
			delegate: { name: "delegate"; type: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			delegateAccount: { name: "delegateAccount"; type: { kind: "OBJECT"; name: "Account"; ofType: null } }
			delegators: {
				name: "delegators"
				type: {
					kind: "LIST"
					name: never
					ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
				}
			}
			epochDelegateAccount: { name: "epochDelegateAccount"; type: { kind: "OBJECT"; name: "Account"; ofType: null } }
			index: { name: "index"; type: { kind: "SCALAR"; name: "Int"; ofType: null } }
			inferredNonce: { name: "inferredNonce"; type: { kind: "SCALAR"; name: "AccountNonce"; ofType: null } }
			lastEpochDelegators: {
				name: "lastEpochDelegators"
				type: {
					kind: "LIST"
					name: never
					ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
				}
			}
			leafHash: { name: "leafHash"; type: { kind: "SCALAR"; name: "FieldElem"; ofType: null } }
			locked: { name: "locked"; type: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			merklePath: {
				name: "merklePath"
				type: {
					kind: "LIST"
					name: never
					ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "MerklePathElement"; ofType: null } }
				}
			}
			nonce: { name: "nonce"; type: { kind: "SCALAR"; name: "AccountNonce"; ofType: null } }
			permissions: { name: "permissions"; type: { kind: "OBJECT"; name: "AccountPermissions"; ofType: null } }
			privateKeyPath: {
				name: "privateKeyPath"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			provedState: { name: "provedState"; type: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			publicKey: {
				name: "publicKey"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
			receiptChainHash: { name: "receiptChainHash"; type: { kind: "SCALAR"; name: "ChainHash"; ofType: null } }
			stakingActive: {
				name: "stakingActive"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
			timing: {
				name: "timing"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "AccountTiming"; ofType: null } }
			}
			token: {
				name: "token"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null } }
			}
			tokenId: {
				name: "tokenId"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null } }
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
					ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "FieldElem"; ofType: null } }
				}
			}
			zkappUri: { name: "zkappUri"; type: { kind: "SCALAR"; name: "String"; ofType: null } }
		}
	}
	AccountAuthRequired: {
		name: "AccountAuthRequired"
		enumValues: "None" | "Either" | "Proof" | "Signature" | "Impossible"
	}
	AccountInput: {
		kind: "INPUT_OBJECT"
		name: "AccountInput"
		isOneOf: false
		inputFields: [
			{ name: "token"; type: { kind: "SCALAR"; name: "TokenId"; ofType: null }; defaultValue: null },
			{
				name: "publicKey"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
				defaultValue: null
			}
		]
	}
	AccountNonce: unknown
	AccountPermissions: {
		kind: "OBJECT"
		name: "AccountPermissions"
		fields: {
			access: {
				name: "access"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null } }
			}
			editActionState: {
				name: "editActionState"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null } }
			}
			editState: {
				name: "editState"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null } }
			}
			incrementNonce: {
				name: "incrementNonce"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null } }
			}
			receive: {
				name: "receive"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null } }
			}
			send: {
				name: "send"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null } }
			}
			setDelegate: {
				name: "setDelegate"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null } }
			}
			setPermissions: {
				name: "setPermissions"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null } }
			}
			setTiming: {
				name: "setTiming"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null } }
			}
			setTokenSymbol: {
				name: "setTokenSymbol"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null } }
			}
			setZkappUri: {
				name: "setZkappUri"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null } }
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
			receiptChainHash: { name: "receiptChainHash"; type: { kind: "SCALAR"; name: "Field"; ofType: null } }
			state: {
				name: "state"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "LIST"; name: never; ofType: { kind: "SCALAR"; name: "Field"; ofType: null } }
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
			{ name: "nonce"; type: { kind: "INPUT_OBJECT"; name: "NonceIntervalInput"; ofType: null }; defaultValue: null },
			{ name: "receiptChainHash"; type: { kind: "SCALAR"; name: "Field"; ofType: null }; defaultValue: null },
			{ name: "delegate"; type: { kind: "SCALAR"; name: "PublicKey"; ofType: null }; defaultValue: null },
			{
				name: "state"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "LIST"; name: never; ofType: { kind: "SCALAR"; name: "Field"; ofType: null } }
				}
				defaultValue: null
			},
			{ name: "actionState"; type: { kind: "SCALAR"; name: "Field"; ofType: null }; defaultValue: null },
			{ name: "provedState"; type: { kind: "SCALAR"; name: "Boolean"; ofType: null }; defaultValue: null },
			{ name: "isNew"; type: { kind: "SCALAR"; name: "Boolean"; ofType: null }; defaultValue: null }
		]
	}
	AccountTiming: {
		kind: "OBJECT"
		name: "AccountTiming"
		fields: {
			cliffAmount: { name: "cliffAmount"; type: { kind: "SCALAR"; name: "Amount"; ofType: null } }
			cliffTime: { name: "cliffTime"; type: { kind: "SCALAR"; name: "Globalslot"; ofType: null } }
			initialMinimumBalance: { name: "initialMinimumBalance"; type: { kind: "SCALAR"; name: "Balance"; ofType: null } }
			vestingIncrement: { name: "vestingIncrement"; type: { kind: "SCALAR"; name: "Amount"; ofType: null } }
			vestingPeriod: { name: "vestingPeriod"; type: { kind: "SCALAR"; name: "GlobalSlotSpan"; ofType: null } }
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
								ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Field"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "BalanceChange"; ofType: null } }
			}
			callData: {
				name: "callData"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Field"; ofType: null } }
			}
			callDepth: {
				name: "callDepth"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
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
								ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Field"; ofType: null } }
							}
						}
					}
				}
			}
			implicitAccountCreationFee: {
				name: "implicitAccountCreationFee"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
			incrementNonce: {
				name: "incrementNonce"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
			mayUseToken: {
				name: "mayUseToken"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "MayUseToken"; ofType: null } }
			}
			preconditions: {
				name: "preconditions"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Preconditions"; ofType: null } }
			}
			publicKey: {
				name: "publicKey"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
			tokenId: {
				name: "tokenId"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
				defaultValue: null
			},
			{
				name: "tokenId"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
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
								ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Field"; ofType: null } }
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
								ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Field"; ofType: null } }
							}
						}
					}
				}
				defaultValue: null
			},
			{
				name: "callData"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Field"; ofType: null } }
				defaultValue: null
			},
			{
				name: "callDepth"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
				defaultValue: null
			},
			{
				name: "implicitAccountCreationFee"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
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
					ofType: { kind: "LIST"; name: never; ofType: { kind: "SCALAR"; name: "Field"; ofType: null } }
				}
			}
			delegate: { name: "delegate"; type: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			permissions: { name: "permissions"; type: { kind: "OBJECT"; name: "Permissions"; ofType: null } }
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
					ofType: { kind: "LIST"; name: never; ofType: { kind: "SCALAR"; name: "Field"; ofType: null } }
				}
				defaultValue: null
			},
			{ name: "delegate"; type: { kind: "SCALAR"; name: "PublicKey"; ofType: null }; defaultValue: null },
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
			{ name: "zkappUri"; type: { kind: "SCALAR"; name: "String"; ofType: null }; defaultValue: null },
			{ name: "tokenSymbol"; type: { kind: "SCALAR"; name: "String"; ofType: null }; defaultValue: null },
			{ name: "timing"; type: { kind: "INPUT_OBJECT"; name: "TimingInput"; ofType: null }; defaultValue: null },
			{ name: "votingFor"; type: { kind: "SCALAR"; name: "StateHash"; ofType: null }; defaultValue: null }
		]
	}
	AccountVerificationKeyWithHash: {
		kind: "OBJECT"
		name: "AccountVerificationKeyWithHash"
		fields: {
			hash: {
				name: "hash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "VerificationKeyHash"; ofType: null } }
			}
			verificationKey: {
				name: "verificationKey"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "VerificationKey"; ofType: null } }
			}
		}
	}
	Action: unknown
	AddAccountInput: {
		kind: "INPUT_OBJECT"
		name: "AddAccountInput"
		isOneOf: false
		inputFields: [
			{
				name: "password"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
				defaultValue: null
			}
		]
	}
	AddAccountPayload: {
		kind: "OBJECT"
		name: "AddAccountPayload"
		fields: {
			account: {
				name: "account"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			publicKey: {
				name: "publicKey"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
		}
	}
	AddrsAndPorts: {
		kind: "OBJECT"
		name: "AddrsAndPorts"
		fields: {
			bindIp: {
				name: "bindIp"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			clientPort: {
				name: "clientPort"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			externalIp: {
				name: "externalIp"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			libp2pPort: {
				name: "libp2pPort"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			peer: { name: "peer"; type: { kind: "OBJECT"; name: "Peer"; ofType: null } }
		}
	}
	Amount: unknown
	AnnotatedBalance: {
		kind: "OBJECT"
		name: "AnnotatedBalance"
		fields: {
			blockHeight: {
				name: "blockHeight"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Length"; ofType: null } }
			}
			liquid: { name: "liquid"; type: { kind: "SCALAR"; name: "Balance"; ofType: null } }
			locked: { name: "locked"; type: { kind: "SCALAR"; name: "Balance"; ofType: null } }
			stateHash: { name: "stateHash"; type: { kind: "SCALAR"; name: "StateHash"; ofType: null } }
			total: {
				name: "total"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Balance"; ofType: null } }
			}
			unknown: {
				name: "unknown"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Balance"; ofType: null } }
			}
		}
	}
	Applied: {
		kind: "OBJECT"
		name: "Applied"
		fields: {
			applied: {
				name: "applied"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
			isSigned: {
				name: "isSigned"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
			verificationKeyHash: {
				name: "verificationKeyHash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Field"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
				defaultValue: null
			},
			{
				name: "isProved"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
				defaultValue: null
			},
			{
				name: "verificationKeyHash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Field"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null } }
			}
			sgn: {
				name: "sgn"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Sign"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null } }
				defaultValue: null
			},
			{
				name: "sgn"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Sign"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Balance"; ofType: null } }
			}
			upper: {
				name: "upper"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Balance"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Balance"; ofType: null } }
				defaultValue: null
			},
			{
				name: "upper"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Balance"; ofType: null } }
				defaultValue: null
			}
		]
	}
	Block: {
		kind: "OBJECT"
		name: "Block"
		fields: {
			commandTransactionCount: {
				name: "commandTransactionCount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			creator: {
				name: "creator"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
			creatorAccount: {
				name: "creatorAccount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			protocolState: {
				name: "protocolState"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "ProtocolState"; ofType: null } }
			}
			protocolStateProof: {
				name: "protocolStateProof"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "protocolStateProof"; ofType: null } }
			}
			snarkJobs: {
				name: "snarkJobs"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "CompletedWork"; ofType: null } }
					}
				}
			}
			stateHash: {
				name: "stateHash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "StateHash"; ofType: null } }
			}
			stateHashField: {
				name: "stateHashField"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "StateHashAsDecimal"; ofType: null } }
			}
			transactions: {
				name: "transactions"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Transactions"; ofType: null } }
			}
			winnerAccount: {
				name: "winnerAccount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
		}
	}
	BlockProducerTimings: {
		kind: "OBJECT"
		name: "BlockProducerTimings"
		fields: {
			generatedFromConsensusAt: {
				name: "generatedFromConsensusAt"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "ConsensusTimeGlobalSlot"; ofType: null }
				}
			}
			globalSlotSinceGenesis: {
				name: "globalSlotSinceGenesis"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Globalslot"; ofType: null } }
					}
				}
			}
			times: {
				name: "times"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "ConsensusTime"; ofType: null } }
					}
				}
			}
		}
	}
	BlockTime: unknown
	BlockchainState: {
		kind: "OBJECT"
		name: "BlockchainState"
		fields: {
			bodyReference: {
				name: "bodyReference"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "BodyReference"; ofType: null } }
			}
			date: {
				name: "date"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "BlockTime"; ofType: null } }
			}
			ledgerProofStatement: {
				name: "ledgerProofStatement"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "SnarkedLedgerState"; ofType: null } }
			}
			snarkedLedgerHash: {
				name: "snarkedLedgerHash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "LedgerHash"; ofType: null } }
			}
			stagedLedgerAuxHash: {
				name: "stagedLedgerAuxHash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "StagedLedgerAuxHash"; ofType: null } }
			}
			stagedLedgerHash: {
				name: "stagedLedgerHash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "LedgerHash"; ofType: null } }
			}
			stagedLedgerPendingCoinbaseAux: {
				name: "stagedLedgerPendingCoinbaseAux"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "PendingCoinbaseAuxHash"; ofType: null }
				}
			}
			stagedLedgerPendingCoinbaseHash: {
				name: "stagedLedgerPendingCoinbaseHash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PendingCoinbaseHash"; ofType: null } }
			}
			stagedLedgerProofEmitted: {
				name: "stagedLedgerProofEmitted"
				type: { kind: "SCALAR"; name: "Boolean"; ofType: null }
			}
			utcDate: {
				name: "utcDate"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "BlockTime"; ofType: null } }
			}
		}
	}
	BodyReference: unknown
	Boolean: unknown
	ChainHash: unknown
	ChainReorganizationStatus: { name: "ChainReorganizationStatus"; enumValues: "CHANGED" }
	CompletedWork: {
		kind: "OBJECT"
		name: "CompletedWork"
		fields: {
			fee: {
				name: "fee"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Fee"; ofType: null } }
			}
			prover: {
				name: "prover"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
			workIds: {
				name: "workIds"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
					}
				}
			}
		}
	}
	ConsensusConfiguration: {
		kind: "OBJECT"
		name: "ConsensusConfiguration"
		fields: {
			acceptableNetworkDelay: {
				name: "acceptableNetworkDelay"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			delta: {
				name: "delta"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			epochDuration: {
				name: "epochDuration"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			genesisStateTimestamp: {
				name: "genesisStateTimestamp"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Time"; ofType: null } }
			}
			k: { name: "k"; type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } } }
			slotDuration: {
				name: "slotDuration"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			slotsPerEpoch: {
				name: "slotsPerEpoch"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
		}
	}
	ConsensusState: {
		kind: "OBJECT"
		name: "ConsensusState"
		fields: {
			blockCreator: {
				name: "blockCreator"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
			blockHeight: {
				name: "blockHeight"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Length"; ofType: null } }
			}
			blockStakeWinner: {
				name: "blockStakeWinner"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
			blockchainLength: {
				name: "blockchainLength"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Length"; ofType: null } }
			}
			coinbaseReceiever: {
				name: "coinbaseReceiever"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
			epoch: {
				name: "epoch"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Epoch"; ofType: null } }
			}
			epochCount: {
				name: "epochCount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Length"; ofType: null } }
			}
			hasAncestorInSameCheckpointWindow: {
				name: "hasAncestorInSameCheckpointWindow"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
			lastVrfOutput: {
				name: "lastVrfOutput"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			minWindowDensity: {
				name: "minWindowDensity"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Length"; ofType: null } }
			}
			nextEpochData: {
				name: "nextEpochData"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "NextEpochData"; ofType: null } }
			}
			slot: {
				name: "slot"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Slot"; ofType: null } }
			}
			slotSinceGenesis: {
				name: "slotSinceGenesis"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Globalslot"; ofType: null } }
			}
			stakingEpochData: {
				name: "stakingEpochData"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "StakingEpochData"; ofType: null } }
			}
			superchargedCoinbase: {
				name: "superchargedCoinbase"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
			totalCurrency: {
				name: "totalCurrency"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Amount"; ofType: null } }
			}
		}
	}
	ConsensusTime: {
		kind: "OBJECT"
		name: "ConsensusTime"
		fields: {
			endTime: {
				name: "endTime"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "BlockTime"; ofType: null } }
			}
			epoch: {
				name: "epoch"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null } }
			}
			globalSlot: {
				name: "globalSlot"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "GlobalSlotSinceHardFork"; ofType: null }
				}
			}
			slot: {
				name: "slot"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null } }
			}
			startTime: {
				name: "startTime"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "BlockTime"; ofType: null } }
			}
		}
	}
	ConsensusTimeGlobalSlot: {
		kind: "OBJECT"
		name: "ConsensusTimeGlobalSlot"
		fields: {
			consensusTime: {
				name: "consensusTime"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "ConsensusTime"; ofType: null } }
			}
			globalSlotSinceGenesis: {
				name: "globalSlotSinceGenesis"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Globalslot"; ofType: null } }
			}
		}
	}
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
			{ name: "proof"; type: { kind: "SCALAR"; name: "ZkappProof"; ofType: null }; defaultValue: null },
			{ name: "signature"; type: { kind: "SCALAR"; name: "Signature"; ofType: null }; defaultValue: null }
		]
	}
	CreateHDAccountInput: {
		kind: "INPUT_OBJECT"
		name: "CreateHDAccountInput"
		isOneOf: false
		inputFields: [
			{
				name: "index"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null } }
			}
			upper: {
				name: "upper"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null } }
				defaultValue: null
			},
			{
				name: "upper"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null } }
				defaultValue: null
			}
		]
	}
	DaemonStatus: {
		kind: "OBJECT"
		name: "DaemonStatus"
		fields: {
			addrsAndPorts: {
				name: "addrsAndPorts"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "AddrsAndPorts"; ofType: null } }
			}
			blockProductionKeys: {
				name: "blockProductionKeys"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
					}
				}
			}
			blockchainLength: { name: "blockchainLength"; type: { kind: "SCALAR"; name: "Int"; ofType: null } }
			catchupStatus: {
				name: "catchupStatus"
				type: {
					kind: "LIST"
					name: never
					ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
				}
			}
			chainId: {
				name: "chainId"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			coinbaseReceiver: { name: "coinbaseReceiver"; type: { kind: "SCALAR"; name: "String"; ofType: null } }
			commitId: {
				name: "commitId"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			confDir: {
				name: "confDir"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			consensusConfiguration: {
				name: "consensusConfiguration"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "ConsensusConfiguration"; ofType: null }
				}
			}
			consensusMechanism: {
				name: "consensusMechanism"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			consensusTimeBestTip: {
				name: "consensusTimeBestTip"
				type: { kind: "OBJECT"; name: "ConsensusTime"; ofType: null }
			}
			consensusTimeNow: {
				name: "consensusTimeNow"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "ConsensusTime"; ofType: null } }
			}
			globalSlotSinceGenesisBestTip: {
				name: "globalSlotSinceGenesisBestTip"
				type: { kind: "SCALAR"; name: "Int"; ofType: null }
			}
			highestBlockLengthReceived: {
				name: "highestBlockLengthReceived"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			highestUnvalidatedBlockLengthReceived: {
				name: "highestUnvalidatedBlockLengthReceived"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			histograms: { name: "histograms"; type: { kind: "OBJECT"; name: "Histograms"; ofType: null } }
			ledgerMerkleRoot: { name: "ledgerMerkleRoot"; type: { kind: "SCALAR"; name: "String"; ofType: null } }
			metrics: {
				name: "metrics"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Metrics"; ofType: null } }
			}
			nextBlockProduction: {
				name: "nextBlockProduction"
				type: { kind: "OBJECT"; name: "BlockProducerTimings"; ofType: null }
			}
			numAccounts: { name: "numAccounts"; type: { kind: "SCALAR"; name: "Int"; ofType: null } }
			peers: {
				name: "peers"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Peer"; ofType: null } }
					}
				}
			}
			snarkWorkFee: {
				name: "snarkWorkFee"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			snarkWorker: { name: "snarkWorker"; type: { kind: "SCALAR"; name: "String"; ofType: null } }
			stateHash: { name: "stateHash"; type: { kind: "SCALAR"; name: "String"; ofType: null } }
			syncStatus: {
				name: "syncStatus"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "SyncStatus"; ofType: null } }
			}
			uptimeSecs: {
				name: "uptimeSecs"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			userCommandsSent: {
				name: "userCommandsSent"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
		}
	}
	DeleteAccountInput: {
		kind: "INPUT_OBJECT"
		name: "DeleteAccountInput"
		isOneOf: false
		inputFields: [
			{
				name: "publicKey"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
				defaultValue: null
			}
		]
	}
	DeleteAccountPayload: {
		kind: "OBJECT"
		name: "DeleteAccountPayload"
		fields: {
			publicKey: {
				name: "publicKey"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
		}
	}
	EncodedAccount: {
		kind: "OBJECT"
		name: "EncodedAccount"
		fields: {
			account: {
				name: "account"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			merklePath: {
				name: "merklePath"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "OBJECT"; name: "MerklePathElement"; ofType: null }
						}
					}
				}
			}
		}
	}
	Encoding: { name: "Encoding"; enumValues: "JSON" | "BASE64" }
	Epoch: unknown
	EpochDataPrecondition: {
		kind: "OBJECT"
		name: "EpochDataPrecondition"
		fields: {
			epochLength: { name: "epochLength"; type: { kind: "OBJECT"; name: "LengthInterval"; ofType: null } }
			ledger: {
				name: "ledger"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "EpochLedgerPrecondition"; ofType: null }
				}
			}
			lockCheckpoint: { name: "lockCheckpoint"; type: { kind: "SCALAR"; name: "Field"; ofType: null } }
			seed: { name: "seed"; type: { kind: "SCALAR"; name: "Field"; ofType: null } }
			startCheckpoint: { name: "startCheckpoint"; type: { kind: "SCALAR"; name: "Field"; ofType: null } }
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
			{ name: "startCheckpoint"; type: { kind: "SCALAR"; name: "Field"; ofType: null }; defaultValue: null },
			{ name: "lockCheckpoint"; type: { kind: "SCALAR"; name: "Field"; ofType: null }; defaultValue: null },
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
			totalCurrency: { name: "totalCurrency"; type: { kind: "OBJECT"; name: "CurrencyAmountInterval"; ofType: null } }
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
	EpochSeed: unknown
	ExportLogsPayload: {
		kind: "OBJECT"
		name: "ExportLogsPayload"
		fields: {
			exportLogs: {
				name: "exportLogs"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "TarFile"; ofType: null } }
			}
		}
	}
	ExtensionalBlock: unknown
	Fee: unknown
	FeeExcess: {
		kind: "OBJECT"
		name: "FeeExcess"
		fields: {
			feeExcessLeft: {
				name: "feeExcessLeft"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "SignedFee"; ofType: null } }
			}
			feeExcessRight: {
				name: "feeExcessRight"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "SignedFee"; ofType: null } }
			}
			feeTokenLeft: {
				name: "feeTokenLeft"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null } }
			}
			feeTokenRight: {
				name: "feeTokenRight"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null } }
			}
		}
	}
	FeePayerBody: {
		kind: "OBJECT"
		name: "FeePayerBody"
		fields: {
			fee: {
				name: "fee"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Fee"; ofType: null } }
			}
			nonce: {
				name: "nonce"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null } }
			}
			publicKey: {
				name: "publicKey"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
			validUntil: { name: "validUntil"; type: { kind: "SCALAR"; name: "GlobalSlotSinceGenesis"; ofType: null } }
		}
	}
	FeePayerBodyInput: {
		kind: "INPUT_OBJECT"
		name: "FeePayerBodyInput"
		isOneOf: false
		inputFields: [
			{
				name: "publicKey"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
				defaultValue: null
			},
			{
				name: "fee"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Fee"; ofType: null } }
				defaultValue: null
			},
			{
				name: "validUntil"
				type: { kind: "SCALAR"; name: "GlobalSlotSinceGenesis"; ofType: null }
				defaultValue: null
			},
			{
				name: "nonce"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null } }
				defaultValue: null
			}
		]
	}
	FeeTransfer: {
		kind: "OBJECT"
		name: "FeeTransfer"
		fields: {
			fee: {
				name: "fee"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Fee"; ofType: null } }
			}
			recipient: {
				name: "recipient"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
			type: {
				name: "type"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "FeeTransferType"; ofType: null } }
			}
		}
	}
	FeeTransferType: unknown
	Field: unknown
	FieldElem: unknown
	Float: unknown
	GenesisConstants: {
		kind: "OBJECT"
		name: "GenesisConstants"
		fields: {
			accountCreationFee: {
				name: "accountCreationFee"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Fee"; ofType: null } }
			}
			coinbase: {
				name: "coinbase"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Amount"; ofType: null } }
			}
			genesisTimestamp: {
				name: "genesisTimestamp"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
		}
	}
	GetFilteredLogEntries: {
		kind: "OBJECT"
		name: "GetFilteredLogEntries"
		fields: {
			isCapturing: {
				name: "isCapturing"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
			logMessages: {
				name: "logMessages"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
					}
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
	GlobalSlotSinceHardFork: unknown
	GlobalSlotSpan: unknown
	Globalslot: unknown
	Histogram: {
		kind: "OBJECT"
		name: "Histogram"
		fields: {
			intervals: {
				name: "intervals"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Interval"; ofType: null } }
					}
				}
			}
			overflow: {
				name: "overflow"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			underflow: {
				name: "underflow"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			values: {
				name: "values"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
					}
				}
			}
		}
	}
	Histograms: {
		kind: "OBJECT"
		name: "Histograms"
		fields: {
			acceptedTransitionLocalLatency: {
				name: "acceptedTransitionLocalLatency"
				type: { kind: "OBJECT"; name: "Histogram"; ofType: null }
			}
			acceptedTransitionRemoteLatency: {
				name: "acceptedTransitionRemoteLatency"
				type: { kind: "OBJECT"; name: "Histogram"; ofType: null }
			}
			externalTransitionLatency: {
				name: "externalTransitionLatency"
				type: { kind: "OBJECT"; name: "Histogram"; ofType: null }
			}
			rpcTimings: {
				name: "rpcTimings"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "RpcTimings"; ofType: null } }
			}
			snarkWorkerMergeTime: { name: "snarkWorkerMergeTime"; type: { kind: "OBJECT"; name: "Histogram"; ofType: null } }
			snarkWorkerTransitionTime: {
				name: "snarkWorkerTransitionTime"
				type: { kind: "OBJECT"; name: "Histogram"; ofType: null }
			}
		}
	}
	ID: unknown
	ImportAccountPayload: {
		kind: "OBJECT"
		name: "ImportAccountPayload"
		fields: {
			alreadyImported: {
				name: "alreadyImported"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
			publicKey: {
				name: "publicKey"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
			success: {
				name: "success"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
		}
	}
	Index: unknown
	InetAddr: unknown
	Int: unknown
	Interval: {
		kind: "OBJECT"
		name: "Interval"
		fields: {
			start: {
				name: "start"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Span"; ofType: null } }
			}
			stop: {
				name: "stop"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Span"; ofType: null } }
			}
		}
	}
	JSON: unknown
	LedgerHash: unknown
	Length: unknown
	LengthInterval: {
		kind: "OBJECT"
		name: "LengthInterval"
		fields: {
			lower: {
				name: "lower"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null } }
			}
			upper: {
				name: "upper"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null } }
				defaultValue: null
			},
			{
				name: "upper"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null } }
				defaultValue: null
			}
		]
	}
	LocalState: {
		kind: "OBJECT"
		name: "LocalState"
		fields: {
			accountUpdateIndex: {
				name: "accountUpdateIndex"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null } }
			}
			callStack: {
				name: "callStack"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "FieldElem"; ofType: null } }
			}
			excess: {
				name: "excess"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "SignedAmount"; ofType: null } }
			}
			failureStatusTable: {
				name: "failureStatusTable"
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
								ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
							}
						}
					}
				}
			}
			fullTransactionCommitment: {
				name: "fullTransactionCommitment"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "FieldElem"; ofType: null } }
			}
			ledger: {
				name: "ledger"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "LedgerHash"; ofType: null } }
			}
			stackFrame: {
				name: "stackFrame"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "FieldElem"; ofType: null } }
			}
			success: {
				name: "success"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
			supplyIncrease: {
				name: "supplyIncrease"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "SignedAmount"; ofType: null } }
			}
			transactionCommitment: {
				name: "transactionCommitment"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "FieldElem"; ofType: null } }
			}
			willSucceed: {
				name: "willSucceed"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
		}
	}
	LockInput: {
		kind: "INPUT_OBJECT"
		name: "LockInput"
		isOneOf: false
		inputFields: [
			{
				name: "publicKey"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
				defaultValue: null
			}
		]
	}
	LockPayload: {
		kind: "OBJECT"
		name: "LockPayload"
		fields: {
			account: {
				name: "account"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			publicKey: {
				name: "publicKey"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
		}
	}
	MayUseToken: {
		kind: "OBJECT"
		name: "MayUseToken"
		fields: {
			inheritFromParent: {
				name: "inheritFromParent"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
			parentsOwnToken: {
				name: "parentsOwnToken"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
				defaultValue: null
			},
			{
				name: "inheritFromParent"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
				defaultValue: null
			}
		]
	}
	MembershipInfo: {
		kind: "OBJECT"
		name: "MembershipInfo"
		fields: {
			accountBalance: {
				name: "accountBalance"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Balance"; ofType: null } }
			}
			merklePath: {
				name: "merklePath"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "OBJECT"; name: "MerklePathElement"; ofType: null }
						}
					}
				}
			}
			nonce: {
				name: "nonce"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null } }
			}
			timingInfo: {
				name: "timingInfo"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "AccountTiming"; ofType: null } }
			}
		}
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
	Metrics: {
		kind: "OBJECT"
		name: "Metrics"
		fields: {
			blockProductionDelay: {
				name: "blockProductionDelay"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
					}
				}
			}
			pendingSnarkWork: {
				name: "pendingSnarkWork"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			snarkPoolDiffBroadcasted: {
				name: "snarkPoolDiffBroadcasted"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			snarkPoolDiffReceived: {
				name: "snarkPoolDiffReceived"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			snarkPoolSize: {
				name: "snarkPoolSize"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			transactionPoolDiffBroadcasted: {
				name: "transactionPoolDiffBroadcasted"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			transactionPoolDiffReceived: {
				name: "transactionPoolDiffReceived"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			transactionPoolSize: {
				name: "transactionPoolSize"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			transactionsAddedToPool: {
				name: "transactionsAddedToPool"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
		}
	}
	NetworkPeer: {
		kind: "INPUT_OBJECT"
		name: "NetworkPeer"
		isOneOf: false
		inputFields: [
			{
				name: "libp2pPort"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
				defaultValue: null
			},
			{
				name: "host"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
				defaultValue: null
			},
			{
				name: "peerId"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
				defaultValue: null
			}
		]
	}
	NetworkPeerPayload: {
		kind: "OBJECT"
		name: "NetworkPeerPayload"
		fields: {
			host: {
				name: "host"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "InetAddr"; ofType: null } }
			}
			libp2pPort: {
				name: "libp2pPort"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			peerId: {
				name: "peerId"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
		}
	}
	NetworkPrecondition: {
		kind: "OBJECT"
		name: "NetworkPrecondition"
		fields: {
			blockchainLength: { name: "blockchainLength"; type: { kind: "OBJECT"; name: "LengthInterval"; ofType: null } }
			globalSlotSinceGenesis: {
				name: "globalSlotSinceGenesis"
				type: { kind: "OBJECT"; name: "GlobalSlotSinceGenesisInterval"; ofType: null }
			}
			minWindowDensity: { name: "minWindowDensity"; type: { kind: "OBJECT"; name: "LengthInterval"; ofType: null } }
			nextEpochData: {
				name: "nextEpochData"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "EpochDataPrecondition"; ofType: null } }
			}
			snarkedLedgerHash: { name: "snarkedLedgerHash"; type: { kind: "SCALAR"; name: "Field"; ofType: null } }
			stakingEpochData: {
				name: "stakingEpochData"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "EpochDataPrecondition"; ofType: null } }
			}
			totalCurrency: { name: "totalCurrency"; type: { kind: "OBJECT"; name: "CurrencyAmountInterval"; ofType: null } }
		}
	}
	NetworkPreconditionInput: {
		kind: "INPUT_OBJECT"
		name: "NetworkPreconditionInput"
		isOneOf: false
		inputFields: [
			{ name: "snarkedLedgerHash"; type: { kind: "SCALAR"; name: "Field"; ofType: null }; defaultValue: null },
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
	NextEpochData: {
		kind: "OBJECT"
		name: "NextEpochData"
		fields: {
			epochLength: {
				name: "epochLength"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Length"; ofType: null } }
			}
			ledger: {
				name: "ledger"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "epochLedger"; ofType: null } }
			}
			lockCheckpoint: {
				name: "lockCheckpoint"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			seed: {
				name: "seed"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "EpochSeed"; ofType: null } }
			}
			startCheckpoint: {
				name: "startCheckpoint"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "StateHash"; ofType: null } }
			}
		}
	}
	NonceInterval: {
		kind: "OBJECT"
		name: "NonceInterval"
		fields: {
			lower: {
				name: "lower"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null } }
			}
			upper: {
				name: "upper"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null } }
				defaultValue: null
			},
			{
				name: "upper"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null } }
				defaultValue: null
			}
		]
	}
	Peer: {
		kind: "OBJECT"
		name: "Peer"
		fields: {
			host: {
				name: "host"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			libp2pPort: {
				name: "libp2pPort"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			peerId: {
				name: "peerId"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
		}
	}
	PendingCoinbaseAuxHash: unknown
	PendingCoinbaseHash: unknown
	PendingCoinbaseStack: {
		kind: "OBJECT"
		name: "PendingCoinbaseStack"
		fields: {
			dataStack: {
				name: "dataStack"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "FieldElem"; ofType: null } }
			}
			stateStack: {
				name: "stateStack"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "StateStack"; ofType: null } }
			}
		}
	}
	PendingSnarkWork: {
		kind: "OBJECT"
		name: "PendingSnarkWork"
		fields: {
			workBundle: {
				name: "workBundle"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "WorkDescription"; ofType: null } }
					}
				}
			}
		}
	}
	PendingSnarkWorkSpec: {
		kind: "OBJECT"
		name: "PendingSnarkWorkSpec"
		fields: {
			workBundleSpec: {
				name: "workBundleSpec"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "WorkBundleSpec"; ofType: null } }
			}
		}
	}
	Permissions: {
		kind: "OBJECT"
		name: "Permissions"
		fields: {
			access: {
				name: "access"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
			}
			editActionState: {
				name: "editActionState"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
			}
			editState: {
				name: "editState"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
			}
			incrementNonce: {
				name: "incrementNonce"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
			}
			receive: {
				name: "receive"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
			}
			send: {
				name: "send"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
			}
			setDelegate: {
				name: "setDelegate"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
			}
			setPermissions: {
				name: "setPermissions"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
			}
			setTiming: {
				name: "setTiming"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
			}
			setTokenSymbol: {
				name: "setTokenSymbol"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
			}
			setZkappUri: {
				name: "setZkappUri"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
				defaultValue: null
			},
			{
				name: "access"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
				defaultValue: null
			},
			{
				name: "send"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
				defaultValue: null
			},
			{
				name: "receive"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
				defaultValue: null
			},
			{
				name: "setDelegate"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
				defaultValue: null
			},
			{
				name: "setPermissions"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
				defaultValue: null
			},
			{
				name: "editActionState"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
				defaultValue: null
			},
			{
				name: "setTokenSymbol"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
				defaultValue: null
			},
			{
				name: "incrementNonce"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
				defaultValue: null
			},
			{
				name: "setVotingFor"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
				defaultValue: null
			},
			{
				name: "setTiming"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
				defaultValue: null
			}
		]
	}
	PrecomputedBlock: unknown
	PrecomputedBlockProof: unknown
	Preconditions: {
		kind: "OBJECT"
		name: "Preconditions"
		fields: {
			account: {
				name: "account"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "AccountPrecondition"; ofType: null } }
			}
			network: {
				name: "network"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "NetworkPrecondition"; ofType: null } }
			}
			validWhile: { name: "validWhile"; type: { kind: "OBJECT"; name: "GlobalSlotSinceGenesisInterval"; ofType: null } }
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
	PrivateKey: unknown
	ProofBundleInput: unknown
	ProtocolState: {
		kind: "OBJECT"
		name: "ProtocolState"
		fields: {
			blockchainState: {
				name: "blockchainState"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "BlockchainState"; ofType: null } }
			}
			consensusState: {
				name: "consensusState"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "ConsensusState"; ofType: null } }
			}
			previousStateHash: {
				name: "previousStateHash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "StateHash"; ofType: null } }
			}
		}
	}
	PublicKey: unknown
	Registers: {
		kind: "OBJECT"
		name: "Registers"
		fields: {
			firstPassLedger: {
				name: "firstPassLedger"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "LedgerHash"; ofType: null } }
			}
			localState: {
				name: "localState"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "LocalState"; ofType: null } }
			}
			pendingCoinbaseStack: {
				name: "pendingCoinbaseStack"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "PendingCoinbaseStack"; ofType: null } }
			}
			secondPassLedger: {
				name: "secondPassLedger"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "LedgerHash"; ofType: null } }
			}
		}
	}
	ReloadAccountsPayload: {
		kind: "OBJECT"
		name: "ReloadAccountsPayload"
		fields: {
			success: {
				name: "success"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
		}
	}
	RosettaTransaction: unknown
	RpcPair: {
		kind: "OBJECT"
		name: "RpcPair"
		fields: {
			dispatch: { name: "dispatch"; type: { kind: "OBJECT"; name: "Histogram"; ofType: null } }
			impl: { name: "impl"; type: { kind: "OBJECT"; name: "Histogram"; ofType: null } }
		}
	}
	RpcTimings: {
		kind: "OBJECT"
		name: "RpcTimings"
		fields: {
			answerSyncLedgerQuery: {
				name: "answerSyncLedgerQuery"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "RpcPair"; ofType: null } }
			}
			getAncestry: {
				name: "getAncestry"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "RpcPair"; ofType: null } }
			}
			getStagedLedgerAux: {
				name: "getStagedLedgerAux"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "RpcPair"; ofType: null } }
			}
			getTransitionChain: {
				name: "getTransitionChain"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "RpcPair"; ofType: null } }
			}
			getTransitionChainProof: {
				name: "getTransitionChainProof"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "RpcPair"; ofType: null } }
			}
		}
	}
	SendDelegationInput: {
		kind: "INPUT_OBJECT"
		name: "SendDelegationInput"
		isOneOf: false
		inputFields: [
			{ name: "nonce"; type: { kind: "SCALAR"; name: "UInt32"; ofType: null }; defaultValue: null },
			{ name: "memo"; type: { kind: "SCALAR"; name: "String"; ofType: null }; defaultValue: null },
			{ name: "validUntil"; type: { kind: "SCALAR"; name: "UInt32"; ofType: null }; defaultValue: null },
			{
				name: "fee"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt64"; ofType: null } }
				defaultValue: null
			},
			{
				name: "to"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
				defaultValue: null
			},
			{
				name: "from"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
				defaultValue: null
			}
		]
	}
	SendDelegationPayload: {
		kind: "OBJECT"
		name: "SendDelegationPayload"
		fields: {
			delegation: {
				name: "delegation"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "INTERFACE"; name: "UserCommand"; ofType: null } }
			}
		}
	}
	SendPaymentInput: {
		kind: "INPUT_OBJECT"
		name: "SendPaymentInput"
		isOneOf: false
		inputFields: [
			{ name: "nonce"; type: { kind: "SCALAR"; name: "UInt32"; ofType: null }; defaultValue: null },
			{ name: "memo"; type: { kind: "SCALAR"; name: "String"; ofType: null }; defaultValue: null },
			{ name: "validUntil"; type: { kind: "SCALAR"; name: "UInt32"; ofType: null }; defaultValue: null },
			{
				name: "fee"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt64"; ofType: null } }
				defaultValue: null
			},
			{
				name: "amount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt64"; ofType: null } }
				defaultValue: null
			},
			{
				name: "to"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
				defaultValue: null
			},
			{
				name: "from"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "INTERFACE"; name: "UserCommand"; ofType: null } }
			}
		}
	}
	SendRosettaTransactionPayload: {
		kind: "OBJECT"
		name: "SendRosettaTransactionPayload"
		fields: {
			userCommand: {
				name: "userCommand"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "INTERFACE"; name: "UserCommand"; ofType: null } }
			}
		}
	}
	SendTestZkappInput: unknown
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "ZkappCommandResult"; ofType: null } }
			}
		}
	}
	SetCoinbaseReceiverInput: {
		kind: "INPUT_OBJECT"
		name: "SetCoinbaseReceiverInput"
		isOneOf: false
		inputFields: [{ name: "publicKey"; type: { kind: "SCALAR"; name: "PublicKey"; ofType: null }; defaultValue: null }]
	}
	SetCoinbaseReceiverPayload: {
		kind: "OBJECT"
		name: "SetCoinbaseReceiverPayload"
		fields: {
			currentCoinbaseReceiver: {
				name: "currentCoinbaseReceiver"
				type: { kind: "SCALAR"; name: "PublicKey"; ofType: null }
			}
			lastCoinbaseReceiver: { name: "lastCoinbaseReceiver"; type: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
		}
	}
	SetConnectionGatingConfigInput: {
		kind: "INPUT_OBJECT"
		name: "SetConnectionGatingConfigInput"
		isOneOf: false
		inputFields: [
			{ name: "cleanAddedPeers"; type: { kind: "SCALAR"; name: "Boolean"; ofType: null }; defaultValue: null },
			{
				name: "isolate"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
				defaultValue: null
			},
			{
				name: "bannedPeers"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "INPUT_OBJECT"; name: "NetworkPeer"; ofType: null }
						}
					}
				}
				defaultValue: null
			},
			{
				name: "trustedPeers"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "INPUT_OBJECT"; name: "NetworkPeer"; ofType: null }
						}
					}
				}
				defaultValue: null
			}
		]
	}
	SetConnectionGatingConfigPayload: {
		kind: "OBJECT"
		name: "SetConnectionGatingConfigPayload"
		fields: {
			bannedPeers: {
				name: "bannedPeers"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "OBJECT"; name: "NetworkPeerPayload"; ofType: null }
						}
					}
				}
			}
			isolate: {
				name: "isolate"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
			trustedPeers: {
				name: "trustedPeers"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "OBJECT"; name: "NetworkPeerPayload"; ofType: null }
						}
					}
				}
			}
		}
	}
	SetSnarkWorkFee: {
		kind: "INPUT_OBJECT"
		name: "SetSnarkWorkFee"
		isOneOf: false
		inputFields: [
			{
				name: "fee"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt64"; ofType: null } }
				defaultValue: null
			}
		]
	}
	SetSnarkWorkFeePayload: {
		kind: "OBJECT"
		name: "SetSnarkWorkFeePayload"
		fields: {
			lastFee: {
				name: "lastFee"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Fee"; ofType: null } }
			}
		}
	}
	SetSnarkWorkerInput: {
		kind: "INPUT_OBJECT"
		name: "SetSnarkWorkerInput"
		isOneOf: false
		inputFields: [{ name: "publicKey"; type: { kind: "SCALAR"; name: "PublicKey"; ofType: null }; defaultValue: null }]
	}
	SetSnarkWorkerPayload: {
		kind: "OBJECT"
		name: "SetSnarkWorkerPayload"
		fields: { lastSnarkWorker: { name: "lastSnarkWorker"; type: { kind: "SCALAR"; name: "PublicKey"; ofType: null } } }
	}
	Sign: unknown
	Signature: unknown
	SignatureInput: {
		kind: "INPUT_OBJECT"
		name: "SignatureInput"
		isOneOf: false
		inputFields: [
			{ name: "rawSignature"; type: { kind: "SCALAR"; name: "String"; ofType: null }; defaultValue: null },
			{ name: "scalar"; type: { kind: "SCALAR"; name: "String"; ofType: null }; defaultValue: null },
			{ name: "field"; type: { kind: "SCALAR"; name: "String"; ofType: null }; defaultValue: null }
		]
	}
	SignedAmount: {
		kind: "OBJECT"
		name: "SignedAmount"
		fields: {
			amountMagnitude: {
				name: "amountMagnitude"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Amount"; ofType: null } }
			}
			sign: {
				name: "sign"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "sign"; ofType: null } }
			}
		}
	}
	SignedFee: {
		kind: "OBJECT"
		name: "SignedFee"
		fields: {
			feeMagnitude: {
				name: "feeMagnitude"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Fee"; ofType: null } }
			}
			sign: {
				name: "sign"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "sign"; ofType: null } }
			}
		}
	}
	Slot: unknown
	SnarkWorker: {
		kind: "OBJECT"
		name: "SnarkWorker"
		fields: {
			account: {
				name: "account"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			fee: {
				name: "fee"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Fee"; ofType: null } }
			}
			key: {
				name: "key"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
		}
	}
	SnarkedLedgerState: {
		kind: "OBJECT"
		name: "SnarkedLedgerState"
		fields: {
			connectingLedgerLeft: {
				name: "connectingLedgerLeft"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "LedgerHash"; ofType: null } }
			}
			connectingLedgerRight: {
				name: "connectingLedgerRight"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "LedgerHash"; ofType: null } }
			}
			feeExcess: {
				name: "feeExcess"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "FeeExcess"; ofType: null } }
			}
			sokDigest: { name: "sokDigest"; type: { kind: "SCALAR"; name: "String"; ofType: null } }
			sourceRegisters: {
				name: "sourceRegisters"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Registers"; ofType: null } }
			}
			supplyIncrease: {
				name: "supplyIncrease"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "SignedAmount"; ofType: null } }
			}
			targetRegisters: {
				name: "targetRegisters"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Registers"; ofType: null } }
			}
		}
	}
	Span: unknown
	StagedLedgerAuxHash: unknown
	StakingEpochData: {
		kind: "OBJECT"
		name: "StakingEpochData"
		fields: {
			epochLength: {
				name: "epochLength"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Length"; ofType: null } }
			}
			ledger: {
				name: "ledger"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "epochLedger"; ofType: null } }
			}
			lockCheckpoint: {
				name: "lockCheckpoint"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			seed: {
				name: "seed"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "EpochSeed"; ofType: null } }
			}
			startCheckpoint: {
				name: "startCheckpoint"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "StateHash"; ofType: null } }
			}
		}
	}
	StateHash: unknown
	StateHashAsDecimal: unknown
	StateStack: {
		kind: "OBJECT"
		name: "StateStack"
		fields: {
			current: {
				name: "current"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "FieldElem"; ofType: null } }
			}
			initial: {
				name: "initial"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "FieldElem"; ofType: null } }
			}
		}
	}
	String: unknown
	SyncStatus: {
		name: "SyncStatus"
		enumValues: "CONNECTING" | "LISTENING" | "OFFLINE" | "BOOTSTRAP" | "SYNCED" | "CATCHUP"
	}
	TarFile: {
		kind: "OBJECT"
		name: "TarFile"
		fields: {
			tarfile: {
				name: "tarfile"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
		}
	}
	Time: unknown
	Timing: {
		kind: "OBJECT"
		name: "Timing"
		fields: {
			cliffAmount: {
				name: "cliffAmount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Balance"; ofType: null } }
			}
			vestingIncrement: {
				name: "vestingIncrement"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null } }
			}
			vestingPeriod: {
				name: "vestingPeriod"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "GlobalSlotSpan"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Balance"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null } }
				defaultValue: null
			},
			{
				name: "vestingPeriod"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "GlobalSlotSpan"; ofType: null } }
				defaultValue: null
			},
			{
				name: "vestingIncrement"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "CurrencyAmount"; ofType: null } }
				defaultValue: null
			}
		]
	}
	TokenId: unknown
	TransactionHash: unknown
	TransactionId: unknown
	TransactionStatus: { name: "TransactionStatus"; enumValues: "INCLUDED" | "PENDING" | "UNKNOWN" }
	TransactionStatusFailure: unknown
	Transactions: {
		kind: "OBJECT"
		name: "Transactions"
		fields: {
			coinbase: {
				name: "coinbase"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Amount"; ofType: null } }
			}
			coinbaseReceiverAccount: {
				name: "coinbaseReceiverAccount"
				type: { kind: "OBJECT"; name: "Account"; ofType: null }
			}
			feeTransfer: {
				name: "feeTransfer"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "FeeTransfer"; ofType: null } }
					}
				}
			}
			userCommands: {
				name: "userCommands"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "INTERFACE"; name: "UserCommand"; ofType: null } }
					}
				}
			}
			zkappCommands: {
				name: "zkappCommands"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "OBJECT"; name: "ZkappCommandResult"; ofType: null }
						}
					}
				}
			}
		}
	}
	TrustStatusPayload: {
		kind: "OBJECT"
		name: "TrustStatusPayload"
		fields: {
			bannedStatus: { name: "bannedStatus"; type: { kind: "SCALAR"; name: "Time"; ofType: null } }
			ipAddr: {
				name: "ipAddr"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "InetAddr"; ofType: null } }
			}
			peerId: {
				name: "peerId"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			trust: {
				name: "trust"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Float"; ofType: null } }
			}
		}
	}
	UInt32: unknown
	UInt64: unknown
	UnlockInput: {
		kind: "INPUT_OBJECT"
		name: "UnlockInput"
		isOneOf: false
		inputFields: [
			{
				name: "publicKey"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
				defaultValue: null
			},
			{
				name: "password"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
				defaultValue: null
			}
		]
	}
	UnlockPayload: {
		kind: "OBJECT"
		name: "UnlockPayload"
		fields: {
			account: {
				name: "account"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			publicKey: {
				name: "publicKey"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
		}
	}
	UserCommand: {
		kind: "INTERFACE"
		name: "UserCommand"
		fields: {
			amount: {
				name: "amount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Amount"; ofType: null } }
			}
			failureReason: { name: "failureReason"; type: { kind: "SCALAR"; name: "TransactionStatusFailure"; ofType: null } }
			fee: {
				name: "fee"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Fee"; ofType: null } }
			}
			feePayer: {
				name: "feePayer"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			feeToken: {
				name: "feeToken"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null } }
			}
			from: {
				name: "from"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
			fromAccount: {
				name: "fromAccount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			hash: {
				name: "hash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TransactionHash"; ofType: null } }
			}
			id: {
				name: "id"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TransactionId"; ofType: null } }
			}
			isDelegation: {
				name: "isDelegation"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
			kind: {
				name: "kind"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UserCommandKind"; ofType: null } }
			}
			memo: {
				name: "memo"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			nonce: {
				name: "nonce"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			receiver: {
				name: "receiver"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			source: {
				name: "source"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			to: {
				name: "to"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
			toAccount: {
				name: "toAccount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			token: {
				name: "token"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null } }
			}
			validUntil: {
				name: "validUntil"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Globalslot"; ofType: null } }
			}
		}
		possibleTypes: "UserCommandDelegation" | "UserCommandPayment"
	}
	UserCommandDelegation: {
		kind: "OBJECT"
		name: "UserCommandDelegation"
		fields: {
			amount: {
				name: "amount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Amount"; ofType: null } }
			}
			delegatee: {
				name: "delegatee"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			delegator: {
				name: "delegator"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			failureReason: { name: "failureReason"; type: { kind: "SCALAR"; name: "TransactionStatusFailure"; ofType: null } }
			fee: {
				name: "fee"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Fee"; ofType: null } }
			}
			feePayer: {
				name: "feePayer"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			feeToken: {
				name: "feeToken"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null } }
			}
			from: {
				name: "from"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
			fromAccount: {
				name: "fromAccount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			hash: {
				name: "hash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TransactionHash"; ofType: null } }
			}
			id: {
				name: "id"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TransactionId"; ofType: null } }
			}
			isDelegation: {
				name: "isDelegation"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
			kind: {
				name: "kind"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UserCommandKind"; ofType: null } }
			}
			memo: {
				name: "memo"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			nonce: {
				name: "nonce"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			receiver: {
				name: "receiver"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			source: {
				name: "source"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			to: {
				name: "to"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
			toAccount: {
				name: "toAccount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			token: {
				name: "token"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null } }
			}
			validUntil: {
				name: "validUntil"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Globalslot"; ofType: null } }
			}
		}
	}
	UserCommandKind: unknown
	UserCommandPayment: {
		kind: "OBJECT"
		name: "UserCommandPayment"
		fields: {
			amount: {
				name: "amount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Amount"; ofType: null } }
			}
			failureReason: { name: "failureReason"; type: { kind: "SCALAR"; name: "TransactionStatusFailure"; ofType: null } }
			fee: {
				name: "fee"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Fee"; ofType: null } }
			}
			feePayer: {
				name: "feePayer"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			feeToken: {
				name: "feeToken"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null } }
			}
			from: {
				name: "from"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
			fromAccount: {
				name: "fromAccount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			hash: {
				name: "hash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TransactionHash"; ofType: null } }
			}
			id: {
				name: "id"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TransactionId"; ofType: null } }
			}
			isDelegation: {
				name: "isDelegation"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
			kind: {
				name: "kind"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UserCommandKind"; ofType: null } }
			}
			memo: {
				name: "memo"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			nonce: {
				name: "nonce"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			receiver: {
				name: "receiver"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			source: {
				name: "source"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			to: {
				name: "to"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
			toAccount: {
				name: "toAccount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
			}
			token: {
				name: "token"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TokenId"; ofType: null } }
			}
			validUntil: {
				name: "validUntil"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Globalslot"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "AccountAuthRequired"; ofType: null } }
			}
			txnVersion: {
				name: "txnVersion"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "AuthRequired"; ofType: null } }
				defaultValue: null
			},
			{
				name: "txnVersion"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "VerificationKey"; ofType: null } }
			}
			hash: {
				name: "hash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Field"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "VerificationKey"; ofType: null } }
				defaultValue: null
			},
			{
				name: "hash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Field"; ofType: null } }
				defaultValue: null
			}
		]
	}
	VrfEvaluation: {
		kind: "OBJECT"
		name: "VrfEvaluation"
		fields: {
			c: {
				name: "c"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "VrfScalar"; ofType: null } }
			}
			message: {
				name: "message"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "VrfMessage"; ofType: null } }
			}
			publicKey: {
				name: "publicKey"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			}
			s: {
				name: "s"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "VrfScalar"; ofType: null } }
			}
			scaledMessageHash: {
				name: "scaledMessageHash"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
					}
				}
			}
			thresholdMet: { name: "thresholdMet"; type: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			vrfOutput: { name: "vrfOutput"; type: { kind: "SCALAR"; name: "VrfOutputTruncated"; ofType: null } }
			vrfOutputFractional: { name: "vrfOutputFractional"; type: { kind: "SCALAR"; name: "Float"; ofType: null } }
			vrfThreshold: { name: "vrfThreshold"; type: { kind: "OBJECT"; name: "VrfThreshold"; ofType: null } }
		}
	}
	VrfEvaluationInput: {
		kind: "INPUT_OBJECT"
		name: "VrfEvaluationInput"
		isOneOf: false
		inputFields: [
			{
				name: "vrfThreshold"
				type: { kind: "INPUT_OBJECT"; name: "VrfThresholdInput"; ofType: null }
				defaultValue: null
			},
			{
				name: "scaledMessageHash"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
					}
				}
				defaultValue: null
			},
			{
				name: "s"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
				defaultValue: null
			},
			{
				name: "c"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
				defaultValue: null
			},
			{
				name: "publicKey"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
				defaultValue: null
			},
			{
				name: "message"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "INPUT_OBJECT"; name: "VrfMessageInput"; ofType: null } }
				defaultValue: null
			}
		]
	}
	VrfMessage: {
		kind: "OBJECT"
		name: "VrfMessage"
		fields: {
			delegatorIndex: {
				name: "delegatorIndex"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			epochSeed: {
				name: "epochSeed"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "EpochSeed"; ofType: null } }
			}
			globalSlot: {
				name: "globalSlot"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "SCALAR"; name: "GlobalSlotSinceHardFork"; ofType: null }
				}
			}
		}
	}
	VrfMessageInput: {
		kind: "INPUT_OBJECT"
		name: "VrfMessageInput"
		isOneOf: false
		inputFields: [
			{
				name: "delegatorIndex"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
				defaultValue: null
			},
			{
				name: "epochSeed"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
				defaultValue: null
			},
			{
				name: "globalSlot"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt32"; ofType: null } }
				defaultValue: null
			}
		]
	}
	VrfOutputTruncated: unknown
	VrfScalar: unknown
	VrfThreshold: {
		kind: "OBJECT"
		name: "VrfThreshold"
		fields: {
			delegatedStake: {
				name: "delegatedStake"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Balance"; ofType: null } }
			}
			totalStake: {
				name: "totalStake"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Amount"; ofType: null } }
			}
		}
	}
	VrfThresholdInput: {
		kind: "INPUT_OBJECT"
		name: "VrfThresholdInput"
		isOneOf: false
		inputFields: [
			{
				name: "totalStake"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt64"; ofType: null } }
				defaultValue: null
			},
			{
				name: "delegatedStake"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "UInt64"; ofType: null } }
				defaultValue: null
			}
		]
	}
	WorkBundleSpec: {
		kind: "OBJECT"
		name: "WorkBundleSpec"
		fields: {
			snarkFee: { name: "snarkFee"; type: { kind: "SCALAR"; name: "Fee"; ofType: null } }
			snarkProverKey: { name: "snarkProverKey"; type: { kind: "SCALAR"; name: "PublicKey"; ofType: null } }
			spec: {
				name: "spec"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			workIds: {
				name: "workIds"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
					}
				}
			}
		}
	}
	WorkDescription: {
		kind: "OBJECT"
		name: "WorkDescription"
		fields: {
			feeExcess: {
				name: "feeExcess"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "FeeExcess"; ofType: null } }
			}
			sourceFirstPassLedgerHash: {
				name: "sourceFirstPassLedgerHash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "LedgerHash"; ofType: null } }
			}
			sourceSecondPassLedgerHash: {
				name: "sourceSecondPassLedgerHash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "LedgerHash"; ofType: null } }
			}
			supplyChange: {
				name: "supplyChange"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "SignedAmount"; ofType: null } }
			}
			supplyIncrease: {
				name: "supplyIncrease"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Amount"; ofType: null } }
			}
			targetFirstPassLedgerHash: {
				name: "targetFirstPassLedgerHash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "LedgerHash"; ofType: null } }
			}
			targetSecondPassLedgerHash: {
				name: "targetSecondPassLedgerHash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "LedgerHash"; ofType: null } }
			}
			workId: {
				name: "workId"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
		}
	}
	ZkappAccountUpdate: {
		kind: "OBJECT"
		name: "ZkappAccountUpdate"
		fields: {
			authorization: {
				name: "authorization"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Control"; ofType: null } }
			}
			body: {
				name: "body"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "AccountUpdateBody"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "INPUT_OBJECT"; name: "ControlInput"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "ZkappFeePayer"; ofType: null } }
			}
			memo: {
				name: "memo"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Memo"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Memo"; ofType: null } }
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
				type: { kind: "LIST"; name: never; ofType: { kind: "OBJECT"; name: "ZkappCommandFailureReason"; ofType: null } }
			}
			hash: {
				name: "hash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TransactionHash"; ofType: null } }
			}
			id: {
				name: "id"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "TransactionId"; ofType: null } }
			}
			zkappCommand: {
				name: "zkappCommand"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "ZkappCommand"; ofType: null } }
			}
		}
	}
	ZkappFeePayer: {
		kind: "OBJECT"
		name: "ZkappFeePayer"
		fields: {
			authorization: {
				name: "authorization"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Signature"; ofType: null } }
			}
			body: {
				name: "body"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "FeePayerBody"; ofType: null } }
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
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Signature"; ofType: null } }
				defaultValue: null
			}
		]
	}
	ZkappProof: unknown
	epochLedger: {
		kind: "OBJECT"
		name: "epochLedger"
		fields: {
			hash: {
				name: "hash"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "LedgerHash"; ofType: null } }
			}
			totalCurrency: {
				name: "totalCurrency"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Amount"; ofType: null } }
			}
		}
	}
	mutation: {
		kind: "OBJECT"
		name: "mutation"
		fields: {
			addPeers: {
				name: "addPeers"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Peer"; ofType: null } }
					}
				}
			}
			addWallet: {
				name: "addWallet"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "AddAccountPayload"; ofType: null } }
			}
			archiveExtensionalBlock: {
				name: "archiveExtensionalBlock"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Applied"; ofType: null } }
			}
			archivePrecomputedBlock: {
				name: "archivePrecomputedBlock"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Applied"; ofType: null } }
			}
			createAccount: {
				name: "createAccount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "AddAccountPayload"; ofType: null } }
			}
			createHDAccount: {
				name: "createHDAccount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "AddAccountPayload"; ofType: null } }
			}
			deleteAccount: {
				name: "deleteAccount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "DeleteAccountPayload"; ofType: null } }
			}
			deleteWallet: {
				name: "deleteWallet"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "DeleteAccountPayload"; ofType: null } }
			}
			exportLogs: {
				name: "exportLogs"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "ExportLogsPayload"; ofType: null } }
			}
			importAccount: {
				name: "importAccount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "ImportAccountPayload"; ofType: null } }
			}
			internalSendZkapp: {
				name: "internalSendZkapp"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "OBJECT"; name: "SendZkappPayload"; ofType: null }
						}
					}
				}
			}
			lockAccount: {
				name: "lockAccount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "LockPayload"; ofType: null } }
			}
			lockWallet: {
				name: "lockWallet"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "LockPayload"; ofType: null } }
			}
			mockZkapp: {
				name: "mockZkapp"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "SendZkappPayload"; ofType: null } }
			}
			reloadAccounts: {
				name: "reloadAccounts"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "ReloadAccountsPayload"; ofType: null } }
			}
			reloadWallets: {
				name: "reloadWallets"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "ReloadAccountsPayload"; ofType: null } }
			}
			sendDelegation: {
				name: "sendDelegation"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "SendDelegationPayload"; ofType: null } }
			}
			sendPayment: {
				name: "sendPayment"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "SendPaymentPayload"; ofType: null } }
			}
			sendProofBundle: {
				name: "sendProofBundle"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			sendRosettaTransaction: {
				name: "sendRosettaTransaction"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "SendRosettaTransactionPayload"; ofType: null }
				}
			}
			sendTestPayments: {
				name: "sendTestPayments"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			sendZkapp: {
				name: "sendZkapp"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "SendZkappPayload"; ofType: null } }
			}
			setCoinbaseReceiver: {
				name: "setCoinbaseReceiver"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "SetCoinbaseReceiverPayload"; ofType: null }
				}
			}
			setConnectionGatingConfig: {
				name: "setConnectionGatingConfig"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "SetConnectionGatingConfigPayload"; ofType: null }
				}
			}
			setSnarkWorkFee: {
				name: "setSnarkWorkFee"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "SetSnarkWorkFeePayload"; ofType: null }
				}
			}
			setSnarkWorker: {
				name: "setSnarkWorker"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "SetSnarkWorkerPayload"; ofType: null } }
			}
			startFilteredLog: {
				name: "startFilteredLog"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
			unlockAccount: {
				name: "unlockAccount"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "UnlockPayload"; ofType: null } }
			}
			unlockWallet: {
				name: "unlockWallet"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "UnlockPayload"; ofType: null } }
			}
		}
	}
	protocolStateProof: {
		kind: "OBJECT"
		name: "protocolStateProof"
		fields: {
			base64: { name: "base64"; type: { kind: "SCALAR"; name: "PrecomputedBlockProof"; ofType: null } }
			json: { name: "json"; type: { kind: "SCALAR"; name: "JSON"; ofType: null } }
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
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
					}
				}
			}
			bestChain: {
				name: "bestChain"
				type: {
					kind: "LIST"
					name: never
					ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Block"; ofType: null } }
				}
			}
			block: {
				name: "block"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Block"; ofType: null } }
			}
			blockchainVerificationKey: {
				name: "blockchainVerificationKey"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "JSON"; ofType: null } }
			}
			checkVrf: {
				name: "checkVrf"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "VrfEvaluation"; ofType: null } }
			}
			connectionGatingConfig: {
				name: "connectionGatingConfig"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "OBJECT"; name: "SetConnectionGatingConfigPayload"; ofType: null }
				}
			}
			currentSnarkWorker: { name: "currentSnarkWorker"; type: { kind: "OBJECT"; name: "SnarkWorker"; ofType: null } }
			daemonStatus: {
				name: "daemonStatus"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "DaemonStatus"; ofType: null } }
			}
			encodedSnarkedLedgerAccountMembership: {
				name: "encodedSnarkedLedgerAccountMembership"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "EncodedAccount"; ofType: null } }
					}
				}
			}
			evaluateVrf: {
				name: "evaluateVrf"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "VrfEvaluation"; ofType: null } }
			}
			fork_config: {
				name: "fork_config"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "JSON"; ofType: null } }
			}
			genesisBlock: {
				name: "genesisBlock"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Block"; ofType: null } }
			}
			genesisConstants: {
				name: "genesisConstants"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "GenesisConstants"; ofType: null } }
			}
			getFilteredLogEntries: {
				name: "getFilteredLogEntries"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "GetFilteredLogEntries"; ofType: null } }
			}
			getPeers: {
				name: "getPeers"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Peer"; ofType: null } }
					}
				}
			}
			initialPeers: {
				name: "initialPeers"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
					}
				}
			}
			networkID: {
				name: "networkID"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			ownedWallets: {
				name: "ownedWallets"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
					}
				}
			}
			pendingSnarkWork: {
				name: "pendingSnarkWork"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "OBJECT"; name: "PendingSnarkWork"; ofType: null }
						}
					}
				}
			}
			pooledUserCommands: {
				name: "pooledUserCommands"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "INTERFACE"; name: "UserCommand"; ofType: null } }
					}
				}
			}
			pooledZkappCommands: {
				name: "pooledZkappCommands"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "OBJECT"; name: "ZkappCommandResult"; ofType: null }
						}
					}
				}
			}
			protocolState: {
				name: "protocolState"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			runtimeConfig: {
				name: "runtimeConfig"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "JSON"; ofType: null } }
			}
			signatureKind: {
				name: "signatureKind"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			snarkPool: {
				name: "snarkPool"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "CompletedWork"; ofType: null } }
					}
				}
			}
			snarkWorkRange: {
				name: "snarkWorkRange"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "OBJECT"; name: "PendingSnarkWorkSpec"; ofType: null }
						}
					}
				}
			}
			snarkedLedgerAccountMembership: {
				name: "snarkedLedgerAccountMembership"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "MembershipInfo"; ofType: null } }
					}
				}
			}
			syncStatus: {
				name: "syncStatus"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "SyncStatus"; ofType: null } }
			}
			threadGraph: {
				name: "threadGraph"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "String"; ofType: null } }
			}
			timeOffset: {
				name: "timeOffset"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Int"; ofType: null } }
			}
			tokenAccounts: {
				name: "tokenAccounts"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
					}
				}
			}
			tokenOwner: { name: "tokenOwner"; type: { kind: "OBJECT"; name: "Account"; ofType: null } }
			trackedAccounts: {
				name: "trackedAccounts"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Account"; ofType: null } }
					}
				}
			}
			transactionStatus: {
				name: "transactionStatus"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "TransactionStatus"; ofType: null } }
			}
			trustStatus: {
				name: "trustStatus"
				type: {
					kind: "LIST"
					name: never
					ofType: {
						kind: "NON_NULL"
						name: never
						ofType: { kind: "OBJECT"; name: "TrustStatusPayload"; ofType: null }
					}
				}
			}
			trustStatusAll: {
				name: "trustStatusAll"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: {
						kind: "LIST"
						name: never
						ofType: {
							kind: "NON_NULL"
							name: never
							ofType: { kind: "OBJECT"; name: "TrustStatusPayload"; ofType: null }
						}
					}
				}
			}
			validatePayment: {
				name: "validatePayment"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "SCALAR"; name: "Boolean"; ofType: null } }
			}
			version: { name: "version"; type: { kind: "SCALAR"; name: "String"; ofType: null } }
			wallet: { name: "wallet"; type: { kind: "OBJECT"; name: "Account"; ofType: null } }
		}
	}
	sign: { name: "sign"; enumValues: "PLUS" | "MINUS" }
	subscription: {
		kind: "OBJECT"
		name: "subscription"
		fields: {
			chainReorganization: {
				name: "chainReorganization"
				type: {
					kind: "NON_NULL"
					name: never
					ofType: { kind: "ENUM"; name: "ChainReorganizationStatus"; ofType: null }
				}
			}
			newBlock: {
				name: "newBlock"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "OBJECT"; name: "Block"; ofType: null } }
			}
			newSyncUpdate: {
				name: "newSyncUpdate"
				type: { kind: "NON_NULL"; name: never; ofType: { kind: "ENUM"; name: "SyncStatus"; ofType: null } }
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
	name: "mina"
	query: "query"
	mutation: "mutation"
	subscription: "subscription"
	types: introspection_types
}

import * as gqlTada from "gql.tada"
