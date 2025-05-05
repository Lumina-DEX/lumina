import {
  Field,
  MerkleMap,
  Mina,
  Poseidon,
  PrivateKey,
  Provable,
  PublicKey,
  Signature,
  TokenId,
  UInt32,
  UInt64
} from "o1js"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import {
  MultisigInfo,
  MultisigProgram,
  SignatureInfo,
  SignatureRight,
  UpdateAccountInfo,
  UpdateFactoryInfo,
  UpdateSignerData,
  UpgradeInfo
} from "../dist"

const proofsEnabled = false

describe("Pool data", () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    senderPublic: PublicKey,
    bobAccount: Mina.TestPublicKey,
    bobPublic: PublicKey,
    bobKey: PrivateKey,
    aliceAccount: Mina.TestPublicKey,
    alicePublic: PublicKey,
    dylanAccount: Mina.TestPublicKey,
    dylanPublic: PublicKey,
    aliceKey: PrivateKey,
    updatePoolRight: SignatureRight,
    updateDelegatorRight: SignatureRight,
    updateSignerRight: SignatureRight,
    updateProtocolRight: SignatureRight,
    updateFactoryRight: SignatureRight,
    merkle: MerkleMap

  beforeAll(async () => {
    await MultisigProgram.compile({ proofsEnabled })

    updatePoolRight = SignatureRight.canUpdatePool()
    updateDelegatorRight = SignatureRight.canUpdateDelegator()
    updateSignerRight = SignatureRight.canUpdateSigner()
    updateProtocolRight = SignatureRight.canUpdateProtocol()
    updateFactoryRight = SignatureRight.canUpdateFactory()
  })

  beforeEach(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled })
    Mina.setActiveInstance(Local)
    ;[deployerAccount, senderAccount, bobAccount, aliceAccount, dylanAccount] = Local.testAccounts
    deployerKey = deployerAccount.key
    senderKey = senderAccount.key

    senderPublic = senderKey.toPublicKey()
    dylanPublic = dylanAccount.key.toPublicKey()
    bobKey = bobAccount.key
    bobPublic = bobKey.toPublicKey()
    aliceKey = aliceAccount.key
    alicePublic = aliceKey.toPublicKey()

    merkle = new MerkleMap()
  })

  it("update pool proof", async () => {
    merkle.set(Poseidon.hash(bobPublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(alicePublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(dylanPublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(senderPublic.toFields()), updatePoolRight.hash())

    const pk = PrivateKey.random()
    const contractAddress = pk.toPublicKey()
    const tokenId = TokenId.derive(contractAddress)
    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()
    const time = getSlotFromTimestamp(tomorrow)
    const info = new UpgradeInfo({ contractAddress, tokenId, newVkHash: Field(33), deadlineSlot: UInt32.from(time) })

    Provable.log("info validate", info.toFields())
    Provable.log("bob", bobPublic)
    const signBob = Signature.create(bobKey, info.toFields())
    const signAlice = Signature.create(aliceKey, info.toFields())
    const signDylan = Signature.create(dylanAccount.key, info.toFields())

    const multi = new MultisigInfo({
      approvedUpgrader: merkle.getRoot(),
      messageHash: info.hash(),
      deadlineSlot: UInt32.from(time)
    })
    const infoBob = new SignatureInfo({
      user: bobPublic,
      witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())),
      signature: signBob,
      right: updatePoolRight
    })
    const infoAlice = new SignatureInfo({
      user: alicePublic,
      witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())),
      signature: signAlice,
      right: updatePoolRight
    })
    const infoDylan = new SignatureInfo({
      user: dylanPublic,
      witness: merkle.getWitness(Poseidon.hash(dylanPublic.toFields())),
      signature: signDylan,
      right: updatePoolRight
    })
    const array = [infoBob, infoAlice, infoDylan]
    const multisig = await MultisigProgram.verifyUpdatePool(multi, info, array)

    await multisig.proof.verify()
    multisig.proof.publicOutput.uppdatePool.assertTrue("Is not an update of pool")
  })

  it("incorrect signer pool proof", async () => {
    merkle.set(Poseidon.hash(bobPublic.toFields()), updateDelegatorRight.hash())
    merkle.set(Poseidon.hash(alicePublic.toFields()), updateDelegatorRight.hash())
    merkle.set(Poseidon.hash(dylanPublic.toFields()), updateDelegatorRight.hash())
    merkle.set(Poseidon.hash(senderPublic.toFields()), updateDelegatorRight.hash())

    const pk = PrivateKey.random()
    const contractAddress = pk.toPublicKey()
    const tokenId = TokenId.derive(contractAddress)
    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()
    const time = getSlotFromTimestamp(tomorrow)
    const info = new UpgradeInfo({ contractAddress, tokenId, newVkHash: Field(33), deadlineSlot: UInt32.from(time) })

    Provable.log("info validate", info.toFields())
    Provable.log("bob", bobPublic)
    const signBob = Signature.create(bobKey, info.toFields())
    const signAlice = Signature.create(aliceKey, info.toFields())
    const signDylan = Signature.create(dylanAccount.key, info.toFields())

    const multi = new MultisigInfo({
      approvedUpgrader: merkle.getRoot(),
      messageHash: info.hash(),
      deadlineSlot: UInt32.from(time)
    })
    const infoBob = new SignatureInfo({
      user: bobPublic,
      witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())),
      signature: signBob,
      right: updatePoolRight
    })
    const infoAlice = new SignatureInfo({
      user: alicePublic,
      witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())),
      signature: signAlice,
      right: updatePoolRight
    })
    const infoDylan = new SignatureInfo({
      user: dylanPublic,
      witness: merkle.getWitness(Poseidon.hash(dylanPublic.toFields())),
      signature: signDylan,
      right: updatePoolRight
    })
    const array = [infoBob, infoAlice, infoDylan]
    await expect(MultisigProgram.verifyUpdatePool(multi, info, array)).rejects.toThrow("Invalid signer")
  })

  it("incorrect right pool proof", async () => {
    merkle.set(Poseidon.hash(bobPublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(alicePublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(dylanPublic.toFields()), updateDelegatorRight.hash())
    merkle.set(Poseidon.hash(senderPublic.toFields()), updateDelegatorRight.hash())

    const pk = PrivateKey.random()
    const contractAddress = pk.toPublicKey()
    const tokenId = TokenId.derive(contractAddress)
    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()
    const time = getSlotFromTimestamp(tomorrow)
    const info = new UpgradeInfo({ contractAddress, tokenId, newVkHash: Field(33), deadlineSlot: UInt32.from(time) })

    Provable.log("info validate", info.toFields())
    Provable.log("bob", bobPublic)
    const signBob = Signature.create(bobKey, info.toFields())
    const signAlice = Signature.create(aliceKey, info.toFields())
    const signDylan = Signature.create(dylanAccount.key, info.toFields())

    const multi = new MultisigInfo({
      approvedUpgrader: merkle.getRoot(),
      messageHash: info.hash(),
      deadlineSlot: UInt32.from(time)
    })
    const infoBob = new SignatureInfo({
      user: bobPublic,
      witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())),
      signature: signBob,
      right: updatePoolRight
    })
    const infoAlice = new SignatureInfo({
      user: alicePublic,
      witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())),
      signature: signAlice,
      right: updatePoolRight
    })
    const infoDylan = new SignatureInfo({
      user: dylanPublic,
      witness: merkle.getWitness(Poseidon.hash(dylanPublic.toFields())),
      signature: signDylan,
      right: updateDelegatorRight
    })
    const array = [infoBob, infoAlice, infoDylan]
    await expect(MultisigProgram.verifyUpdatePool(multi, info, array)).rejects.toThrow(
      "User doesn't have the right to update a pool"
    )
  })

  it("incorrect message pool proof", async () => {
    merkle.set(Poseidon.hash(bobPublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(alicePublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(dylanPublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(senderPublic.toFields()), updatePoolRight.hash())

    const pk = PrivateKey.random()
    const contractAddress = pk.toPublicKey()
    const tokenId = TokenId.derive(contractAddress)
    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()
    const time = getSlotFromTimestamp(tomorrow)
    const info = new UpgradeInfo({ contractAddress, tokenId, newVkHash: Field(33), deadlineSlot: UInt32.from(time) })
    const infoProof = new UpgradeInfo({
      contractAddress,
      tokenId,
      newVkHash: Field(5000),
      deadlineSlot: UInt32.from(time)
    })

    Provable.log("info validate", info.toFields())
    Provable.log("bob", bobPublic)
    const signBob = Signature.create(bobKey, info.toFields())
    const signAlice = Signature.create(aliceKey, info.toFields())
    const signDylan = Signature.create(dylanAccount.key, info.toFields())

    const multi = new MultisigInfo({
      approvedUpgrader: merkle.getRoot(),
      messageHash: info.hash(),
      deadlineSlot: UInt32.from(time)
    })
    const infoBob = new SignatureInfo({
      user: bobPublic,
      witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())),
      signature: signBob,
      right: updatePoolRight
    })
    const infoAlice = new SignatureInfo({
      user: alicePublic,
      witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())),
      signature: signAlice,
      right: updatePoolRight
    })
    const infoDylan = new SignatureInfo({
      user: dylanPublic,
      witness: merkle.getWitness(Poseidon.hash(dylanPublic.toFields())),
      signature: signDylan,
      right: updatePoolRight
    })
    const array = [infoBob, infoAlice, infoDylan]
    await expect(MultisigProgram.verifyUpdatePool(multi, infoProof, array)).rejects.toThrow(
      "Message didn't match parameters"
    )
  })

  it("incorrect signature pool proof", async () => {
    merkle.set(Poseidon.hash(bobPublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(alicePublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(dylanPublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(senderPublic.toFields()), updatePoolRight.hash())

    const pk = PrivateKey.random()
    const contractAddress = pk.toPublicKey()
    const tokenId = TokenId.derive(contractAddress)
    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()
    const time = getSlotFromTimestamp(tomorrow)
    const info = new UpgradeInfo({ contractAddress, tokenId, newVkHash: Field(33), deadlineSlot: UInt32.from(time) })

    Provable.log("info validate", info.toFields())
    Provable.log("bob", bobPublic)
    const signBob = Signature.create(bobKey, info.toFields())
    const signAlice = Signature.create(aliceKey, info.toFields())
    const signDylan = Signature.create(dylanAccount.key, info.toFields())

    const multi = new MultisigInfo({
      approvedUpgrader: merkle.getRoot(),
      messageHash: info.hash(),
      deadlineSlot: UInt32.from(time)
    })
    const infoBob = new SignatureInfo({
      user: bobPublic,
      witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())),
      signature: signBob,
      right: updatePoolRight
    })
    const infoAlice = new SignatureInfo({
      user: alicePublic,
      witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())),
      signature: signAlice,
      right: updatePoolRight
    })
    // we pass alice signature to throy the error
    const infoDylan = new SignatureInfo({
      user: dylanPublic,
      witness: merkle.getWitness(Poseidon.hash(dylanPublic.toFields())),
      signature: signAlice,
      right: updatePoolRight
    })
    const array = [infoBob, infoAlice, infoDylan]
    await expect(MultisigProgram.verifyUpdatePool(multi, info, array)).rejects.toThrow("Invalid signature")
  })

  it("update delegator", async () => {
    merkle.set(Poseidon.hash(bobPublic.toFields()), updateDelegatorRight.hash())
    merkle.set(Poseidon.hash(alicePublic.toFields()), updateDelegatorRight.hash())
    merkle.set(Poseidon.hash(dylanPublic.toFields()), updateDelegatorRight.hash())
    merkle.set(Poseidon.hash(senderPublic.toFields()), updateDelegatorRight.hash())

    const pk = PrivateKey.random()
    const oldAccount = pk.toPublicKey()
    const pkNew = PrivateKey.random()
    const newAccount = pkNew.toPublicKey()
    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()
    const time = getSlotFromTimestamp(tomorrow)
    const info = new UpdateAccountInfo({ oldUser: oldAccount, newUser: newAccount, deadlineSlot: UInt32.from(time) })

    Provable.log("info validate", info.toFields())
    Provable.log("bob", bobPublic)
    const signBob = Signature.create(bobKey, info.toFields())
    const signAlice = Signature.create(aliceKey, info.toFields())
    const signDylan = Signature.create(dylanAccount.key, info.toFields())

    const multi = new MultisigInfo({
      approvedUpgrader: merkle.getRoot(),
      messageHash: info.hash(),
      deadlineSlot: UInt32.from(time)
    })
    const infoBob = new SignatureInfo({
      user: bobPublic,
      witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())),
      signature: signBob,
      right: updateDelegatorRight
    })
    const infoAlice = new SignatureInfo({
      user: alicePublic,
      witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())),
      signature: signAlice,
      right: updateDelegatorRight
    })
    const infoDylan = new SignatureInfo({
      user: dylanPublic,
      witness: merkle.getWitness(Poseidon.hash(dylanPublic.toFields())),
      signature: signDylan,
      right: updateDelegatorRight
    })
    const array = [infoBob, infoAlice, infoDylan]
    const multisig = await MultisigProgram.verifyUpdateDelegator(multi, info, array)

    await multisig.proof.verify()
    multisig.proof.publicOutput.updateDelegator.assertTrue("Is not an update of delegator")
  })

  it("update protocol", async () => {
    const right = updateProtocolRight
    merkle.set(Poseidon.hash(bobPublic.toFields()), right.hash())
    merkle.set(Poseidon.hash(alicePublic.toFields()), right.hash())
    merkle.set(Poseidon.hash(dylanPublic.toFields()), right.hash())
    merkle.set(Poseidon.hash(senderPublic.toFields()), right.hash())

    const pk = PrivateKey.random()
    const oldAccount = pk.toPublicKey()
    const pkNew = PrivateKey.random()
    const newAccount = pkNew.toPublicKey()
    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()
    const time = getSlotFromTimestamp(tomorrow)
    const info = new UpdateAccountInfo({ oldUser: oldAccount, newUser: newAccount, deadlineSlot: UInt32.from(time) })

    Provable.log("info validate", info.toFields())
    Provable.log("bob", bobPublic)
    const signBob = Signature.create(bobKey, info.toFields())
    const signAlice = Signature.create(aliceKey, info.toFields())
    const signDylan = Signature.create(dylanAccount.key, info.toFields())

    const multi = new MultisigInfo({
      approvedUpgrader: merkle.getRoot(),
      messageHash: info.hash(),
      deadlineSlot: UInt32.from(time)
    })
    const infoBob = new SignatureInfo({
      user: bobPublic,
      witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())),
      signature: signBob,
      right
    })
    const infoAlice = new SignatureInfo({
      user: alicePublic,
      witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())),
      signature: signAlice,
      right
    })
    const infoDylan = new SignatureInfo({
      user: dylanPublic,
      witness: merkle.getWitness(Poseidon.hash(dylanPublic.toFields())),
      signature: signDylan,
      right
    })
    const array = [infoBob, infoAlice, infoDylan]
    const multisig = await MultisigProgram.verifyUpdateProtocol(multi, info, array)

    await multisig.proof.verify()
    multisig.proof.publicOutput.updateProtocol.assertTrue("Is not an update the protool")
  })

  it("update factory", async () => {
    const right = updateFactoryRight
    merkle.set(Poseidon.hash(bobPublic.toFields()), right.hash())
    merkle.set(Poseidon.hash(alicePublic.toFields()), right.hash())
    merkle.set(Poseidon.hash(dylanPublic.toFields()), right.hash())
    merkle.set(Poseidon.hash(senderPublic.toFields()), right.hash())

    const pk = PrivateKey.random()
    const oldAccount = pk.toPublicKey()
    const pkNew = PrivateKey.random()
    const newAccount = pkNew.toPublicKey()
    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()
    const time = getSlotFromTimestamp(tomorrow)
    const info = new UpdateFactoryInfo({ newVkHash: Field(123), deadlineSlot: UInt32.from(time) })

    Provable.log("info validate", info.toFields())
    Provable.log("bob", bobPublic)
    const signBob = Signature.create(bobKey, info.toFields())
    const signAlice = Signature.create(aliceKey, info.toFields())
    const signDylan = Signature.create(dylanAccount.key, info.toFields())

    const multi = new MultisigInfo({
      approvedUpgrader: merkle.getRoot(),
      messageHash: info.hash(),
      deadlineSlot: UInt32.from(time)
    })
    const infoBob = new SignatureInfo({
      user: bobPublic,
      witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())),
      signature: signBob,
      right
    })
    const infoAlice = new SignatureInfo({
      user: alicePublic,
      witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())),
      signature: signAlice,
      right
    })
    const infoDylan = new SignatureInfo({
      user: dylanPublic,
      witness: merkle.getWitness(Poseidon.hash(dylanPublic.toFields())),
      signature: signDylan,
      right
    })
    const array = [infoBob, infoAlice, infoDylan]
    const multisig = await MultisigProgram.verifyUpdateFactory(multi, info, array)

    await multisig.proof.verify()
    multisig.proof.publicOutput.updateFactory.assertTrue("Is not an update for the factory")
  })

  it("update signer", async () => {
    const right = updateSignerRight
    merkle.set(Poseidon.hash(bobPublic.toFields()), right.hash())
    merkle.set(Poseidon.hash(alicePublic.toFields()), right.hash())
    merkle.set(Poseidon.hash(dylanPublic.toFields()), right.hash())
    merkle.set(Poseidon.hash(senderPublic.toFields()), right.hash())

    const newMerkle = new MerkleMap()
    newMerkle.set(Poseidon.hash(bobPublic.toFields()), right.hash())
    newMerkle.set(Poseidon.hash(alicePublic.toFields()), right.hash())
    newMerkle.set(Poseidon.hash(deployerAccount.toFields()), right.hash())

    const pk = PrivateKey.random()
    const oldAccount = pk.toPublicKey()
    const pkNew = PrivateKey.random()
    const newAccount = pkNew.toPublicKey()
    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()
    const time = getSlotFromTimestamp(tomorrow)
    const info = new UpdateSignerData({
      oldRoot: merkle.getRoot(),
      newRoot: newMerkle.getRoot(),
      deadlineSlot: UInt32.from(time)
    })

    Provable.log("info validate", info.toFields())
    Provable.log("bob", bobPublic)
    const signBob = Signature.create(bobKey, info.toFields())
    const signAlice = Signature.create(aliceKey, info.toFields())
    const signDylan = Signature.create(dylanAccount.key, info.toFields())

    const deployerPublic = deployerAccount.key.toPublicKey()
    const newsignBob = Signature.create(bobKey, info.toFields())
    const newsignAlice = Signature.create(aliceKey, info.toFields())
    const newsignDeployer = Signature.create(deployerAccount.key, info.toFields())

    const multi = new MultisigInfo({
      approvedUpgrader: merkle.getRoot(),
      messageHash: info.hash(),
      deadlineSlot: UInt32.from(time)
    })
    const infoBob = new SignatureInfo({
      user: bobPublic,
      witness: merkle.getWitness(Poseidon.hash(bobPublic.toFields())),
      signature: signBob,
      right
    })
    const infoAlice = new SignatureInfo({
      user: alicePublic,
      witness: merkle.getWitness(Poseidon.hash(alicePublic.toFields())),
      signature: signAlice,
      right
    })
    const infoDylan = new SignatureInfo({
      user: dylanPublic,
      witness: merkle.getWitness(Poseidon.hash(dylanPublic.toFields())),
      signature: signDylan,
      right
    })
    const array = [infoBob, infoAlice, infoDylan]

    const newinfoBob = new SignatureInfo({
      user: bobPublic,
      witness: newMerkle.getWitness(Poseidon.hash(bobPublic.toFields())),
      signature: newsignBob,
      right
    })
    const newinfoAlice = new SignatureInfo({
      user: alicePublic,
      witness: newMerkle.getWitness(Poseidon.hash(alicePublic.toFields())),
      signature: newsignAlice,
      right
    })
    const newinfoDeployer = new SignatureInfo({
      user: deployerPublic,
      witness: newMerkle.getWitness(Poseidon.hash(deployerPublic.toFields())),
      signature: newsignDeployer,
      right
    })
    const newarray = [newinfoBob, newinfoAlice, newinfoDeployer]

    const multisig = await MultisigProgram.verifyUpdateSigner(multi, info, array, newarray)

    await multisig.proof.verify()
    multisig.proof.publicOutput.updateSigner.assertTrue("Is not an update for the signer")
  })

  function getSlotFromTimestamp(date: number) {
    const { genesisTimestamp, slotTime } = Mina.activeInstance.getNetworkConstants()
    let slotCalculated = UInt64.from(date)
    slotCalculated = (slotCalculated.sub(genesisTimestamp)).div(slotTime)
    Provable.log("slotCalculated64", slotCalculated)
    return slotCalculated.toUInt32()
  }
})
