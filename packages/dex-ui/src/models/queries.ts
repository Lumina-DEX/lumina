export const MULTISIG_QUERIES = {
	GET_MULTISIGS: `
		query GetMultisigs($network: Network) {
			multisigs(network: $network) {
				id
				signerId
				signature
				data
				network
				deadline
				createdAt
				signer {
					id
					publicKey
				}
			}
		}
	`,
	CREATE_MULTISIG: `
		mutation CreateMultisig($input: CreateMultisigInput!) {
			createMultisig(input: $input) {
				id
				signerId
				signature
				data
				network
				deadline
				createdAt
				signer {
					id
					publicKey
				}
			}
		}
	`,
	DELETE_MULTISIG: `
		mutation DeleteMultisig($id: Int!) {
			deleteMultisig(id: $id)
		}
	`,
	GET_SIGNERS: `
		query GetSigners {
			signers {
				id
				publicKey
			}
		}
	`
}

export const SIGNER_QUERIES = {
	GET_SIGNERS: `
		query GetSigners($network: Network) {
			signers(network: $network) {
				id
				publicKey
				createdAt
				networks {
					id
					signerId
					network
					permission
					active
					createdAt
				}
			}
		}
	`,
	CREATE_SIGNER: `
		mutation CreateSigner($input: CreateSignerInput!) {
			createSigner(input: $input) {
				id
				publicKey
				createdAt
			}
		}
	`,
	CREATE_SIGNER_NETWORK: `
		mutation CreateSignerNetwork($input: CreateSignerNetworkInput!) {
			createSignerNetwork(input: $input) {
				id
				signerId
				network
				permission
				active
			}
		}
	`,
	UPDATE_SIGNER_NETWORK: `
		mutation UpdateSignerNetwork($signerId: Int!, $network: Network!, $input: UpdateSignerNetworkInput!) {
			updateSignerNetwork(signerId: $signerId, network: $network, input: $input) {
				id
				signerId
				network
				permission
				active
			}
		}
	`
}

export const FACTORY_QUERIES = {
	DEPLOY_FACTORY: `
		mutation DeployFactory($input: DeployFactoryInput!) {
			deployFactory(input: $input) {
				id
				status
			}
		}
	`,
	GET_FACTORY_JOB: `
		query GetFactoryJob($jobId: String!) {
			factoryDeploymentJob(jobId: $jobId) {
				status
				factoryPublicKey
				transactionJson
				completedAt
			}
		}
	`,
	SUBSCRIBE_FACTORY_DEPLOYMENT: `
		subscription FactoryDeployment($jobId: String!) {
			factoryDeployment(jobId: $jobId) {
				status
				factoryPublicKey
				transactionJson
				completedAt
			}
		}
	`
}
