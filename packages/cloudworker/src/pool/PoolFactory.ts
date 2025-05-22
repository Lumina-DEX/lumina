import {
	AccountUpdate,
	AccountUpdateForest,
	Bool,
	DeployArgs,
	Field,
	MerkleMap,
	MerkleMapWitness,
	method,
	Permissions,
	Poseidon,
	PublicKey,
	Signature,
	state,
	State,
	Struct,
	TokenContract,
	TokenId,
	UInt32,
	UInt64,
	VerificationKey
} from "o1js"
import { FungibleToken } from "zkcloudworker"
import {
	MultisigInfo,
	Multisig,
	MultisigSigner,
	SignatureInfo,
	SignatureRight,
	UpdateAccountInfo,
	UpdateFactoryInfo,
	UpdateSignerData,
	verifySignature
} from "./Multisig"

/**
 * Current verification key of pool contract
 */
export const contractData =
	"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"
/**
 * Current hash of verification key of pool contract
 */
export const contractHash =
	Field(5594455694225844493828763509468165382923180297395536400245484306269052311024n)
/**
 * Current verification key of pool token holder contract
 */
export const contractHolderData =
	"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"
/**
 * Current hash of verification key of pool token holder contract
 */
export const contractHolderHash =
	Field(11549450361008775235242038734709709351447737775285423036140322613088171224061n)

/**
 * Interface of current data needed to deploy the pool factory
 */
export interface PoolDeployProps extends Exclude<DeployArgs, undefined> {
	symbol: string
	src: string
	protocol: PublicKey
	delegator: PublicKey
	approvedSigner: Field
	signatures: SignatureInfo[]
	multisigInfo: MultisigInfo
}

/**
 * Event emitted when a new pool is created
 */
export class PoolCreationEvent extends Struct({
	sender: PublicKey,
	signer: PublicKey,
	poolAddress: PublicKey,
	token0Address: PublicKey,
	token1Address: PublicKey
}) {
	constructor(value: {
		sender: PublicKey
		signer: PublicKey
		poolAddress: PublicKey
		token0Address: PublicKey
		token1Address: PublicKey
	}) {
		super(value)
	}
}

/**
 * Event emitted when an address is updated
 */
export class UpdateUserEvent extends Struct({
	newUser: PublicKey
}) {
	constructor(newUser: PublicKey) {
		super({ newUser })
	}
}

/**
 * Event emitted when the verification key is updated
 */
export class UpdateVerificationKeyEvent extends Struct({
	hash: Field
}) {
	constructor(hash: Field) {
		super({ hash })
	}
}

/**
 * Event emitted when the signer list is updated
 */
export class UpdateSignerEvent extends Struct({
	root: Field
}) {
	constructor(root: Field) {
		super({ root })
	}
}

/**
 * Factory who create pools
 */
export class PoolFactory extends TokenContract {
	/**
	 * List of signer approved to deploy a new pool
	 */
	@state(Field)
	approvedSigner = State<Field>()
	/**
	 * Account who collect protocol fees
	 */
	@state(PublicKey)
	protocol = State<PublicKey>()
	/**
	 * Delegator account for mina pools
	 */
	@state(PublicKey)
	delegator = State<PublicKey>()

	/**
	 * List of pool factory events
	 */
	events = {
		poolAdded: PoolCreationEvent,
		upgrade: UpdateVerificationKeyEvent,
		updateSigner: UpdateSignerEvent,
		updateProtocol: UpdateUserEvent,
		updateDelegator: UpdateUserEvent,
		updateOwner: UpdateUserEvent
	}

	/**
	 * Method call when you deploy the pool factory contracts
	 * @param args default data stored in the contracts
	 */
	async deploy(args: PoolDeployProps) {
		await super.deploy(args)
		const defaultRoot = new MerkleMap().getRoot()
		args.approvedSigner.equals(Field.empty()).assertFalse("Approved signer is empty")
		args.approvedSigner.equals(defaultRoot).assertFalse("Approved signer is empty")

		this.network.globalSlotSinceGenesis.requireBetween(UInt32.zero, args.multisigInfo.deadlineSlot)

		const updateSignerData = new UpdateSignerData({
			oldRoot: Field.empty(),
			newRoot: args.approvedSigner,
			deadlineSlot: args.multisigInfo.deadlineSlot
		})
		// we need 3 signatures to update signer, prevent to deadlock contract update
		const right = SignatureRight.canUpdateSigner()
		verifySignature(
			args.signatures,
			args.multisigInfo.deadlineSlot,
			args.multisigInfo,
			args.multisigInfo.approvedUpgrader,
			updateSignerData.toFields(),
			right
		)

		this.account.zkappUri.set(args.src)
		this.account.tokenSymbol.set(args.symbol)
		this.approvedSigner.set(args.approvedSigner)
		this.protocol.set(args.protocol)
		this.delegator.set(args.delegator)

		let permissions = Permissions.default()
		permissions.access = Permissions.proof()
		permissions.setPermissions = Permissions.impossible()
		permissions.setVerificationKey = Permissions.VerificationKey.proofDuringCurrentVersion()
		this.account.permissions.set(permissions)
	}

	/**
	 * Upgrade to a new version
	 * @param multisig multisig data
	 * @param vk new verification key
	 */
	@method async updateVerificationKey(multisig: Multisig, vk: VerificationKey) {
		const deadlineSlot = multisig.info.deadlineSlot
		const approvedSigner = this.approvedSigner.getAndRequireEquals()
		multisig.info.approvedUpgrader.equals(approvedSigner).assertTrue("Incorrect signer list")
		this.network.globalSlotSinceGenesis.requireBetween(UInt32.zero, deadlineSlot)

		const upgradeInfo = new UpdateFactoryInfo({ newVkHash: vk.hash, deadlineSlot })
		multisig.verifyUpdateFactory(upgradeInfo)

		this.account.verificationKey.set(vk)
		this.emitEvent("upgrade", new UpdateVerificationKeyEvent(vk.hash))
	}

	/**
	 * Update the list of approved signers
	 * @param multisig multisig data
	 * @param newRoot merkle root of the new list
	 */
	@method async updateApprovedSigner(multisig: MultisigSigner, newRoot: Field) {
		const oldRoot = this.approvedSigner.getAndRequireEquals()
		multisig.info.approvedUpgrader.equals(oldRoot).assertTrue("Incorrect signer list")
		const deadlineSlot = multisig.info.deadlineSlot
		this.network.globalSlotSinceGenesis.requireBetween(UInt32.zero, deadlineSlot)

		const upgradeInfo = new UpdateSignerData({ oldRoot, newRoot, deadlineSlot })
		multisig.verifyUpdateSigner(upgradeInfo)

		this.approvedSigner.set(newRoot)
		this.emitEvent("updateSigner", new UpdateSignerEvent(newRoot))
	}

	/**
	 * Update the protocol account address
	 * @param multisig multisig data
	 * @param newUser address of the new protocol collectord
	 */
	@method async setNewProtocol(multisig: Multisig, newUser: PublicKey) {
		const oldUser = this.protocol.getAndRequireEquals()
		const deadlineSlot = multisig.info.deadlineSlot
		const approvedSigner = this.approvedSigner.getAndRequireEquals()
		multisig.info.approvedUpgrader.equals(approvedSigner).assertTrue("Incorrect signer list")
		this.network.globalSlotSinceGenesis.requireBetween(UInt32.zero, deadlineSlot)

		const upgradeInfo = new UpdateAccountInfo({ oldUser, newUser, deadlineSlot })
		multisig.verifyUpdateProtocol(upgradeInfo)

		this.protocol.set(newUser)
		this.emitEvent("updateProtocol", new UpdateUserEvent(newUser))
	}

	/**
	 * Update the delgator address
	 * @param multisig multisig data
	 * @param newUser address of the new delegator
	 */
	@method async setNewDelegator(multisig: Multisig, newUser: PublicKey) {
		const oldUser = this.delegator.getAndRequireEquals()
		const deadlineSlot = multisig.info.deadlineSlot
		const approvedSigner = this.approvedSigner.getAndRequireEquals()
		multisig.info.approvedUpgrader.equals(approvedSigner).assertTrue("Incorrect signer list")
		this.network.globalSlotSinceGenesis.requireBetween(UInt32.zero, deadlineSlot)

		const upgradeInfo = new UpdateAccountInfo({ oldUser, newUser, deadlineSlot })
		multisig.verifyUpdateDelegator(upgradeInfo)

		this.delegator.set(newUser)
		this.emitEvent("updateDelegator", new UpdateUserEvent(newUser))
	}

	/**
	 * Get protocol address
	 * @returns address of the protocol
	 */
	@method.returns(PublicKey) async getProtocol() {
		const protocol = this.protocol.getAndRequireEquals()
		return protocol
	}

	/**
	 * Get delegator address
	 * @returns address of the delegator
	 */
	@method.returns(PublicKey) async getDelegator() {
		const delegator = this.delegator.getAndRequireEquals()
		return delegator
	}

	/**
	 * Get approved signer
	 * @returns root of approved signer
	 */
	@method.returns(Field) async getApprovedSigner() {
		const approvedSigner = this.approvedSigner.getAndRequireEquals()
		return approvedSigner
	}

	/**
	 * Method use by token allowance but it's not permissible to use it
	 * @param forest account forest to update
	 */
	@method
	async approveBase(forest: AccountUpdateForest) {
		forest.isEmpty().assertTrue("You can't approve any token operation")
	}

	/**
	 * Create a new mina/token pool
	 * @param newAccount address of the new pool
	 * @param token token 1 for the mina pool
	 * @param signer who sign the argument
	 * @param signature who proves you can deploy this pool (only approved signer can deploy a pool)
	 * @param path merkle witness to check if signer is in the approved list
	 * @param right right of the signer
	 */
	@method
	async createPool(
		newAccount: PublicKey,
		token: PublicKey,
		signer: PublicKey,
		signature: Signature,
		path: MerkleMapWitness,
		right: SignatureRight
	) {
		token.isEmpty().assertFalse("Token is empty")
		await this.createAccounts(
			newAccount,
			token,
			PublicKey.empty(),
			token,
			signer,
			signature,
			path,
			right,
			false
		)
	}

	/**
	 * Create a new token/token pool
	 * @param newAccount address of the new pool
	 * @param token 0 of the pool
	 * @param token 1 of the pool
	 * @param signer who sign the argument
	 * @param signature who proves you can deploy this pool (only approved signer can deploy a pool)
	 * @param path merkle witness to check if signer is in the approved list
	 * @param right right of the signer
	 */
	@method
	async createPoolToken(
		newAccount: PublicKey,
		token0: PublicKey,
		token1: PublicKey,
		signer: PublicKey,
		signature: Signature,
		path: MerkleMapWitness,
		right: SignatureRight
	) {
		token0.x.assertLessThan(token1.x, "Token 0 need to be lesser than token 1")
		// create an address with the 2 public key as pool id
		const fields = token0.toFields().concat(token1.toFields())
		const hash = Poseidon.hashToGroup(fields)
		const publicKey = PublicKey.fromGroup(hash)
		publicKey.isEmpty().assertFalse("publicKey is empty")
		await this.createAccounts(
			newAccount,
			publicKey,
			token0,
			token1,
			signer,
			signature,
			path,
			right,
			true
		)
	}

	private async createAccounts(
		newAccount: PublicKey,
		token: PublicKey,
		token0: PublicKey,
		token1: PublicKey,
		signer: PublicKey,
		signature: Signature,
		path: MerkleMapWitness,
		right: SignatureRight,
		isTokenPool: boolean
	) {
		let tokenAccount = AccountUpdate.create(token, this.deriveTokenId())
		// if the balance is not zero, so a pool already exist for this token
		tokenAccount.account.balance.requireEquals(UInt64.zero)

		// verify the signer has right to create the pool
		signer.equals(PublicKey.empty()).assertFalse("Empty signer")
		const signerHash = Poseidon.hash(signer.toFields())
		const approvedSignerRoot = this.approvedSigner.getAndRequireEquals()
		right.deployPool.assertTrue("Insufficient right to deploy a pool")
		const [root, key] = path.computeRootAndKey(right.hash())
		root.assertEquals(approvedSignerRoot, "Invalid signer merkle root")
		key.assertEquals(signerHash, "Invalid signer")
		signature.verify(signer, newAccount.toFields()).assertTrue("Invalid signature")

		// create a pool as this new address
		const poolAccount = AccountUpdate.createSigned(newAccount)
		// Require this account didn't already exist
		poolAccount.account.isNew.requireEquals(Bool(true))

		// set pool account vk and permission
		poolAccount.body.update.verificationKey = {
			isSome: Bool(true),
			value: { data: contractData, hash: contractHash }
		}
		poolAccount.body.update.permissions = {
			isSome: Bool(true),
			value: {
				...Permissions.default(),
				// only proof to prevent signature owner to steal liquidity
				access: Permissions.proof(),
				setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
				send: Permissions.proof(),
				setDelegate: Permissions.proof(),
				setPermissions: Permissions.impossible()
			}
		}

		// set poolAccount initial state
		const appState = this.createState(token0, token1)
		poolAccount.body.update.appState = appState

		// Liquidity token default name
		poolAccount.account.tokenSymbol.set("LUM")

		// create a token holder as this new address
		if (isTokenPool) {
			// only pool token need an account at token 0 address
			await this.createPoolHolderAccount(newAccount, token0, appState)
		}
		await this.createPoolHolderAccount(newAccount, token1, appState)

		// create a liquidity token holder as this new address
		const tokenId = TokenId.derive(newAccount)
		const liquidityAccount = AccountUpdate.createSigned(newAccount, tokenId)
		// Require this account didn't already exist
		liquidityAccount.account.isNew.requireEquals(Bool(true))
		liquidityAccount.body.update.permissions = {
			isSome: Bool(true),
			value: {
				...Permissions.default(),
				setVerificationKey: Permissions.VerificationKey.impossibleDuringCurrentVersion(),
				// This is necessary in order to allow burn circulation supply without signature
				send: Permissions.none(),
				setPermissions: Permissions.impossible()
			}
		}

		// we mint one token to check if this pool exist
		this.internal.mint({ address: tokenAccount, amount: UInt64.one })

		await poolAccount.approve(liquidityAccount)

		const sender = this.sender.getAndRequireSignature()
		this.emitEvent(
			"poolAdded",
			new PoolCreationEvent({
				sender,
				signer,
				poolAddress: newAccount,
				token0Address: token0,
				token1Address: token1
			})
		)
	}

	private createState(token0: PublicKey, token1: PublicKey): { isSome: Bool; value: Field }[] {
		let token0Fields = token0.toFields()
		let token1Fields = token1.toFields()
		let poolFactory = this.address.toFields()
		let protocol = this.protocol.getAndRequireEquals()
		let protocolFields = protocol.toFields()

		return [
			{ isSome: Bool(true), value: token0Fields[0] },
			{ isSome: Bool(true), value: token0Fields[1] },
			{ isSome: Bool(true), value: token1Fields[0] },
			{ isSome: Bool(true), value: token1Fields[1] },
			{ isSome: Bool(true), value: poolFactory[0] },
			{ isSome: Bool(true), value: poolFactory[1] },
			{ isSome: Bool(true), value: protocolFields[0] },
			{ isSome: Bool(true), value: protocolFields[1] }
		]
	}

	private async createPoolHolderAccount(
		newAccount: PublicKey,
		token: PublicKey,
		appState: { isSome: Bool; value: Field }[]
	): Promise<AccountUpdate> {
		const fungibleToken = new FungibleToken(token)
		const poolHolderAccount = AccountUpdate.createSigned(newAccount, fungibleToken.deriveTokenId())
		// Require this account didn't already exist
		poolHolderAccount.account.isNew.requireEquals(Bool(true))

		// set pool token holder account vk and permission
		poolHolderAccount.body.update.verificationKey = {
			isSome: Bool(true),
			value: { data: contractHolderData, hash: contractHolderHash }
		}
		poolHolderAccount.body.update.permissions = {
			isSome: Bool(true),
			value: {
				...Permissions.default(),
				setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
				send: Permissions.proof(),
				setPermissions: Permissions.impossible()
			}
		}
		poolHolderAccount.body.update.appState = appState
		await fungibleToken.approveAccountUpdate(poolHolderAccount)
		return poolHolderAccount
	}
}
