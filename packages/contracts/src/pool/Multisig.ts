import { Bool, Field, Gadgets, MerkleMapWitness, Poseidon, Provable, PublicKey, Signature, Struct, UInt32 } from "o1js"

export const updateSigner = "UpdateSigner"
export const updateFactory = "UpdateFactory"
export const updateDelegator = "UpdateDelegator"
export const updateProtocol = "UpdateProtocol"

export const deployPoolRight = Field(1)
export const updateSignerRight = Field(2)
export const updateProtocolRight = Field(4)
export const updateDelegatorRight = Field(8)
export const updateFactoryRight = Field(16)
export const allRight = Field(31) // 1+2+4+8+16

export function hasRight(userRight: Field, right: Field): Bool {
  return Gadgets.and(userRight, right, 32).equals(right)
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
    return UpdateFactoryInfo.toFields(this)
  }

  hash(): Field {
    return Poseidon.hashWithPrefix(updateFactory, this.toFields())
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
  // signature right to use
  right: Field,
  // deadline to use this signature
  deadlineSlot: UInt32
}) {
  constructor(value: {
    oldUser: PublicKey
    newUser: PublicKey
    right: Field
    deadlineSlot: UInt32
  }) {
    super(value)
  }

  /**
   * Data use to create the signature
   * @returns array of field of all parameters
   */
  toFields(): Field[] {
    return UpdateAccountInfo.toFields(this)
  }

  hash(): Field {
    let prefix = ""
    if (hasRight(this.right, updateDelegatorRight).toBoolean()) {
      prefix = updateDelegator
    } else if (hasRight(this.right, updateProtocolRight).toBoolean()) {
      prefix = updateProtocol
    } else {
      throw new Error("Invalid right to update account")
    }
    return Poseidon.hashWithPrefix(prefix, this.toFields())
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
    return UpdateSignerData.toFields(this)
  }

  hash(): Field {
    return Poseidon.hashWithPrefix(updateSigner, this.toFields())
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
    return MultisigInfo.toFields(this)
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
  right: Field
}) {
  constructor(value: {
    user: PublicKey
    witness: MerkleMapWitness
    signature: Signature
    right: Field
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
    const value = Poseidon.hash(this.right.toFields())
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
    if (value.signatures.length !== 2) {
      throw new Error("Need 2 signatures")
    }
    super(value)
  }

  /**
   * Check if the signature match the current user and data submit
   * @param data needed to verify the signature
   */
  verifyUpdateFactory(updateInfo: UpdateFactoryInfo) {
    const right = updateFactoryRight
    verifySignature(
      this.signatures,
      updateInfo.deadlineSlot,
      updateFactory,
      this.info,
      this.info.approvedUpgrader,
      updateInfo.toFields(),
      right
    )
  }

  /**
   * Check if the signature match the current user and data submit
   * @param data needed to verify the signature
   */
  verifyUpdateDelegator(updateInfo: UpdateAccountInfo) {
    const right = updateDelegatorRight
    verifySignature(
      this.signatures,
      updateInfo.deadlineSlot,
      updateDelegator,
      this.info,
      this.info.approvedUpgrader,
      updateInfo.toFields(),
      right
    )
  }

  /**
   * Check if the signature match the current user and data submit
   * @param data needed to verify the signature
   */
  verifyUpdateProtocol(updateInfo: UpdateAccountInfo) {
    const right = updateProtocolRight
    verifySignature(
      this.signatures,
      updateInfo.deadlineSlot,
      updateProtocol,
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
    if (value.signatures.length !== 2) {
      throw new Error("Need 2 signatures")
    }
    if (value.newSignatures.length !== 2) {
      throw new Error("Need 2 new signatures")
    }
    super(value)
  }

  /**
   * Check if the signature match the current user and data submit
   * @param data needed to verify the signature
   */
  verifyUpdateSigner(upgradeInfo: UpdateSignerData) {
    const right = updateSignerRight
    upgradeInfo.oldRoot.equals(this.info.approvedUpgrader).assertTrue("Merkle root doesn't match")
    upgradeInfo.oldRoot.equals(upgradeInfo.newRoot).assertFalse("Can't reuse same merkle")
    verifySignature(
      this.signatures,
      upgradeInfo.deadlineSlot,
      updateSigner,
      this.info,
      this.info.approvedUpgrader,
      upgradeInfo.toFields(),
      right
    )
    verifySignature(
      this.newSignatures,
      upgradeInfo.deadlineSlot,
      updateSigner,
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
  prefix: string,
  info: MultisigInfo,
  root: Field,
  data: Field[],
  right: Field
) {
  info.deadlineSlot.equals(deadlineSlot).assertTrue("Deadline doesn't match")
  // check the signature come from 2 different users
  signatures[0].user.equals(signatures[1].user).assertFalse("Can't include same signer")

  const hash = Poseidon.hashWithPrefix(prefix, data)
  for (let index = 0; index < signatures.length; index++) {
    const element = signatures[index]
    // check if he can upgrade a pool
    hasRight(element.right, right).assertTrue("User doesn't have the right for this operation")
    // verfify the signature validity for all users
    const valid = element.validate(root, data)
    // hash valid
    info.messageHash.equals(hash).assertTrue("Message didn't match parameters")
    valid.assertTrue("Invalid signature")
  }
}
