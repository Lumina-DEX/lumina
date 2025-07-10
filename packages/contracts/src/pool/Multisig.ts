import { Bool, Field, MerkleMapWitness, Poseidon, Provable, PublicKey, Signature, Struct, UInt32 } from "o1js"

/**
 * Signature right to update pool information
 */
export class SignatureRight extends Struct({
  deployPool: Bool,
  uppdatePool: Bool,
  updateSigner: Bool,
  updateProtocol: Bool,
  updateDelegator: Bool,
  updateFactory: Bool
}) {
  constructor(
    deployPool: Bool,
    uppdatePool: Bool,
    updateSigner: Bool,
    updateProtocol: Bool,
    updateDelegator: Bool,
    updateFactory: Bool
  ) {
    super({
      deployPool,
      uppdatePool,
      updateSigner,
      updateProtocol,
      updateDelegator,
      updateFactory
    })
  }

  toFields(): Field[] {
    return this.deployPool.toFields().concat(
      this.uppdatePool.toFields().concat(
        this.updateSigner.toFields().concat(
          this.updateProtocol.toFields().concat(
            this.updateDelegator.toFields().concat(
              this.updateFactory.toFields()
            )
          )
        )
      )
    )
  }

  static canUpdatePool(): SignatureRight {
    return new SignatureRight(Bool(false), Bool(true), Bool(false), Bool(false), Bool(false), Bool(false))
  }

  static canUpdateDelegator(): SignatureRight {
    return new SignatureRight(Bool(false), Bool(false), Bool(false), Bool(false), Bool(true), Bool(false))
  }

  static canUpdateProtocol(): SignatureRight {
    return new SignatureRight(Bool(false), Bool(false), Bool(false), Bool(true), Bool(false), Bool(false))
  }

  static canUpdateSigner(): SignatureRight {
    return new SignatureRight(Bool(false), Bool(false), Bool(true), Bool(false), Bool(false), Bool(false))
  }

  static canUpdateFactory(): SignatureRight {
    return new SignatureRight(Bool(false), Bool(false), Bool(false), Bool(false), Bool(false), Bool(true))
  }

  static canDeployPool(): SignatureRight {
    return new SignatureRight(Bool(true), Bool(false), Bool(false), Bool(false), Bool(false), Bool(false))
  }

  /**
   * Check if the user right match the necessary right
   * @param right user right
   */
  hasRight(right: SignatureRight) {
    const newRight = new SignatureRight(
      right.deployPool.and(this.deployPool),
      right.uppdatePool.and(this.uppdatePool),
      right.updateSigner.and(this.updateSigner),
      right.updateProtocol.and(this.updateProtocol),
      right.updateDelegator.and(this.updateDelegator),
      right.updateFactory.and(this.updateFactory)
    )
    return newRight.hash().equals(right.hash())
  }

  /**
   * hash store in the signer merkle map
   */
  hash(): Field {
    return Poseidon.hash(this.toFields())
  }
}

/**
 * Information needed to update the factory verification key
 */
export class UpdateFactoryInfo extends Struct({
  /**
   * new verification key hash to submit
   */
  newVkHash: Field,
  /**
   * deadline to use this signature
   */
  deadlineSlot: UInt32
}) {
  constructor(value: {
    newVkHash: Field
    deadlineSlot: UInt32
  }) {
    super(value)
  }

  /**
   * Data use to create the signature
   * @returns array of field of all parameters
   */
  toFields(): Field[] {
    return this.newVkHash.toFields().concat(
      this.deadlineSlot.toFields()
    )
  }

  hash(): Field {
    return Poseidon.hash(this.toFields())
  }
}

/**
 * Information needed to update the pool verification key
 */
export class UpgradeInfo extends Struct({
  // contract to upgrade
  contractAddress: PublicKey,
  // subaccount to upgrade
  tokenId: Field,
  // new verification key hash to submit
  newVkHash: Field,
  // deadline to use this signature
  deadlineSlot: UInt32
}) {
  constructor(value: {
    contractAddress: PublicKey
    tokenId: Field
    newVkHash: Field
    deadlineSlot: UInt32
  }) {
    super(value)
  }

  /**
   * Data use to create the signature
   * @returns array of field of all parameters
   */
  toFields(): Field[] {
    return this.contractAddress.toFields().concat(
      this.tokenId.toFields().concat(
        this.newVkHash.toFields().concat(
          this.deadlineSlot.toFields()
        )
      )
    )
  }

  hash(): Field {
    return Poseidon.hash(this.toFields())
  }
}

/**
 * Information needed to update the delegator/protocol
 */
export class UpdateAccountInfo extends Struct({
  // old account address
  oldUser: PublicKey,
  // new account address
  newUser: PublicKey,
  // deadline to use this signature
  deadlineSlot: UInt32
}) {
  constructor(value: {
    oldUser: PublicKey
    newUser: PublicKey
    deadlineSlot: UInt32
  }) {
    super(value)
  }

  /**
   * Data use to create the signature
   * @returns array of field of all parameters
   */
  toFields(): Field[] {
    return this.oldUser.toFields().concat(
      this.newUser.toFields().concat(
        this.deadlineSlot.toFields()
      )
    )
  }

  hash(): Field {
    return Poseidon.hash(this.toFields())
  }
}

/**
 * Information needed to update the approved signer
 */
export class UpdateSignerData extends Struct({
  // old signer root
  oldRoot: Field,
  // new signer root
  newRoot: Field,
  // deadline to use this signature
  deadlineSlot: UInt32
}) {
  constructor(value: {
    oldRoot: Field
    newRoot: Field
    deadlineSlot: UInt32
  }) {
    super(value)
  }

  /**
   * Data use to create the signature
   * @returns array of field of all parameters
   */
  toFields(): Field[] {
    return this.oldRoot.toFields().concat(
      this.newRoot.toFields().concat(
        this.deadlineSlot.toFields()
      )
    )
  }

  hash(): Field {
    return Poseidon.hash(this.toFields())
  }
}
export class MultisigInfo extends Struct({
  // merkle root of account who can sign to upgrade
  approvedUpgrader: Field,
  // hash of data passed to the signature
  messageHash: Field,
  // deadline
  deadlineSlot: UInt32
}) {
  constructor(value: {
    approvedUpgrader: Field
    messageHash: Field
    deadlineSlot: UInt32
  }) {
    super(value)
  }

  /**
   * Data use to create the signature
   * @returns array of field of all parameters
   */
  toFields(): Field[] {
    return this.messageHash.toFields()
  }
}

/**
 * Information needed to verify signature in the proof
 */
export class SignatureInfo extends Struct({
  // signer account
  user: PublicKey,
  // witness of this account in the merkle root
  witness: MerkleMapWitness,
  // signature created by this user
  signature: Signature,
  // right
  right: SignatureRight
}) {
  constructor(value: {
    user: PublicKey
    witness: MerkleMapWitness
    signature: Signature
    right: SignatureRight
  }) {
    super(value)
  }

  /**
   * Check if the signature match the current user and data subnit
   * @param merkle list of approved signer
   * @param data data use for the signature
   * @returns true if the signature is valid
   */
  validate(merkle: Field, data: Field[]): Bool {
    const hashUser = Poseidon.hash(this.user.toFields())
    const value = this.right.hash()
    const [root, key] = this.witness.computeRootAndKey(value)
    root.assertEquals(merkle, "Invalid signer")
    key.assertEquals(hashUser, "Invalid key")
    return this.signature.verify(this.user, data)
  }
}

/**
 * Information needed to verify the signatures is correct
 */
export class Multisig extends Struct({
  info: MultisigInfo,
  signatures: Provable.Array(SignatureInfo, 2)
}) {
  constructor(value: {
    info: MultisigInfo
    signatures: SignatureInfo[]
  }) {
    super(value)
  }

  /**
   * Check if the signature match the current user and data subbit
   * @param data needed to verify the signature
   */
  verifyUpdateFactory(updateInfo: UpdateFactoryInfo) {
    const right = SignatureRight.canUpdateFactory()
    verifySignature(
      this.signatures,
      updateInfo.deadlineSlot,
      this.info,
      this.info.approvedUpgrader,
      updateInfo.toFields(),
      right
    )
  }

  /**
   * Check if the signature match the current user and data subbit
   * @param data needed to verify the signature
   */
  verifyUpdateDelegator(updateInfo: UpdateAccountInfo) {
    const right = SignatureRight.canUpdateDelegator()
    verifySignature(
      this.signatures,
      updateInfo.deadlineSlot,
      this.info,
      this.info.approvedUpgrader,
      updateInfo.toFields(),
      right
    )
  }

  /**
   * Check if the signature match the current user and data subbit
   * @param data needed to verify the signature
   */
  verifyUpdateProtocol(updateInfo: UpdateAccountInfo) {
    const right = SignatureRight.canUpdateProtocol()
    verifySignature(
      this.signatures,
      updateInfo.deadlineSlot,
      this.info,
      this.info.approvedUpgrader,
      updateInfo.toFields(),
      right
    )
  }
}

/**
 * Information needed to verify the multisig is correct to update the signer list
 */
export class MultisigSigner extends Struct({
  info: MultisigInfo,
  signatures: Provable.Array(SignatureInfo, 2),
  newSignatures: Provable.Array(SignatureInfo, 2)
}) {
  constructor(value: {
    info: MultisigInfo
    signatures: SignatureInfo[]
    newSignatures: SignatureInfo[]
  }) {
    super(value)
  }

  /**
   * Check if the signature match the current user and data subbit
   * @param data needed to verify the signature
   */
  verifyUpdateSigner(upgradeInfo: UpdateSignerData) {
    const right = SignatureRight.canUpdateSigner()
    upgradeInfo.oldRoot.equals(upgradeInfo.newRoot).assertFalse("Can't reuse same merkle")
    verifySignature(
      this.signatures,
      upgradeInfo.deadlineSlot,
      this.info,
      this.info.approvedUpgrader,
      upgradeInfo.toFields(),
      right
    )
    verifySignature(
      this.newSignatures,
      upgradeInfo.deadlineSlot,
      this.info,
      upgradeInfo.newRoot,
      upgradeInfo.toFields(),
      right
    )
  }
}

/**
 * Check if the 2 signatures are valid
 */
export function verifySignature(
  signatures: SignatureInfo[],
  deadlineSlot: UInt32,
  info: MultisigInfo,
  root: Field,
  data: Field[],
  right: SignatureRight
) {
  info.deadlineSlot.equals(deadlineSlot).assertTrue("Deadline doesn't match")
  // check the signature come from 2 different users
  signatures[0].user.equals(signatures[1].user).assertFalse("Can't include same signer")

  const hash = Poseidon.hash(data)
  for (let index = 0; index < signatures.length; index++) {
    const element = signatures[index]
    // check if he can upgrade a pool
    element.right.hasRight(right).assertTrue("User doesn't have the right for this operation")
    // verfify the signature validity for all users
    const valid = element.validate(root, data)
    // hash valid
    info.messageHash.equals(hash).assertTrue("Message didn't match parameters")
    valid.assertTrue("Invalid signature")
  }
}
