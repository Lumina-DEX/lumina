import {
  AccountUpdate,
  Bool,
  Cache,
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
  UInt64,
  UInt8,
  VerificationKey
} from "o1js"
import { beforeAll, beforeEach, describe, expect, it, Pool } from "vitest"

import {
  Multisig,
  MultisigInfo,
  MultisigSigner,
  Pool,
  PoolFactory,
  PoolTokenHolder,
  SignatureInfo,
  SignatureRight,
  UpdateAccountInfo,
  UpdateFactoryInfo,
  UpdateSignerData,
  UpgradeInfo
} from "../dist"

import { FungibleToken, FungibleTokenAdmin } from "mina-fungible-token"

const proofsEnabled = false

const vkUpgradeTest = new VerificationKey({
  data:
    "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",
  hash: Field.from(1094855669395027188090902596744887124365128625005606285591537108109825582697n)
})

describe("Pool data", () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    senderPublic: PublicKey,
    bobAccount: Mina.TestPublicKey,
    bobPublic: PublicKey,
    bobKey: PrivateKey,
    deployer2: Mina.TestPublicKey,
    deployer3: Mina.TestPublicKey,
    aliceAccount: Mina.TestPublicKey,
    alicePublic: PublicKey,
    dylanAccount: Mina.TestPublicKey,
    dylanPublic: PublicKey,
    deployerPublic: PublicKey,
    deployer2Public: PublicKey,
    deployer3Public: PublicKey,
    aliceKey: PrivateKey,
    allRight: SignatureRight,
    signerRight: SignatureRight,
    deployRight: SignatureRight,
    updatePoolRight: SignatureRight,
    updateDelegatorRight: SignatureRight,
    updateSignerRight: SignatureRight,
    updateProtocolRight: SignatureRight,
    updateFactoryRight: SignatureRight,
    deployerRight: SignatureRight,
    merkle: MerkleMap,
    compileKey: VerificationKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: PoolFactory,
    zkPoolAddress: PublicKey,
    zkPoolPrivateKey: PrivateKey,
    zkPool: Pool,
    zkTokenAdminAddress: PublicKey,
    zkTokenAdminPrivateKey: PrivateKey,
    zkTokenAdmin: FungibleTokenAdmin,
    zkTokenAddress: PublicKey,
    zkTokenPrivateKey: PrivateKey,
    zkToken: FungibleToken,
    tokenHolder: PoolTokenHolder

  beforeAll(async () => {
    compileKey = vkUpgradeTest

    const cache = Cache.FileSystem("./cache")
    // const compileResult = await PoolUpgradeTest.compile({ cache, });

    // console.log("poolUpgradeTest", compileResult.verificationKey.data);
    // console.log("poolUpgradeTest hash", compileResult.verificationKey.hash.toBigInt());

    if (proofsEnabled) {
      console.time("compile PoolData")
      await FungibleTokenAdmin.compile({ cache })
      await FungibleToken.compile({ cache })
      await PoolFactory.compile({ cache })
      await Pool.compile({ cache })
      await PoolTokenHolder.compile({ cache })
      console.timeEnd("compile PoolData")
    }

    allRight = new SignatureRight(Bool(true), Bool(true), Bool(true), Bool(true), Bool(true), Bool(true))
    deployerRight = new SignatureRight(Bool(true), Bool(false), Bool(true), Bool(false), Bool(false), Bool(false))
    updatePoolRight = SignatureRight.canUpdatePool()
    updateDelegatorRight = SignatureRight.canUpdateDelegator()
    updateSignerRight = SignatureRight.canUpdateSigner()
    updateProtocolRight = SignatureRight.canUpdateProtocol()
    updateFactoryRight = SignatureRight.canUpdateFactory()
    signerRight = SignatureRight.canUpdateSigner()
    deployRight = SignatureRight.canDeployPool()
  })

  beforeEach(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled })
    Mina.setActiveInstance(Local)
    ;[deployerAccount, senderAccount, bobAccount, aliceAccount, dylanAccount, deployer2, deployer3] = Local.testAccounts
    deployerKey = deployerAccount.key
    senderKey = senderAccount.key

    senderPublic = senderKey.toPublicKey()
    dylanPublic = dylanAccount.key.toPublicKey()
    bobKey = bobAccount.key
    bobPublic = bobKey.toPublicKey()
    aliceKey = aliceAccount.key
    alicePublic = aliceKey.toPublicKey()
    deployerPublic = deployerKey.toPublicKey()
    deployer2Public = deployer2.key.toPublicKey()
    deployer3Public = deployer3.key.toPublicKey()

    merkle = new MerkleMap()
    merkle.set(Poseidon.hash(deployerPublic.toFields()), allRight.hash())
    merkle.set(Poseidon.hash(deployer2Public.toFields()), updateSignerRight.hash())
    merkle.set(Poseidon.hash(deployer3Public.toFields()), updateSignerRight.hash())

    zkAppPrivateKey = PrivateKey.random()
    zkAppAddress = zkAppPrivateKey.toPublicKey()
    zkApp = new PoolFactory(zkAppAddress)

    zkPoolPrivateKey = PrivateKey.random()
    zkPoolAddress = zkPoolPrivateKey.toPublicKey()
    zkPool = new Pool(zkPoolAddress)

    zkTokenAdminPrivateKey = PrivateKey.random()
    zkTokenAdminAddress = zkTokenAdminPrivateKey.toPublicKey()
    zkTokenAdmin = new FungibleTokenAdmin(zkTokenAdminAddress)

    zkTokenPrivateKey = PrivateKey.random()
    zkTokenAddress = zkTokenPrivateKey.toPublicKey()
    zkToken = new FungibleToken(zkTokenAddress)

    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 3)
      await zkTokenAdmin.deploy({
        adminPublicKey: deployerAccount
      })
      await zkToken.deploy({
        symbol: "LTA",
        src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
        allowUpdates: false
      })
      await zkToken.initialize(
        zkTokenAdminAddress,
        UInt8.from(9),
        Bool(false)
      )
    })
    await txn.prove()
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey, zkTokenAdminPrivateKey, zkTokenPrivateKey]).send()
  })

  async function deployPool() {
    const root = merkle.getRoot()

    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()
    const time = getSlotFromTimestamp(tomorrow)
    const info = new UpdateSignerData({ oldRoot: Field.empty(), newRoot: root, deadlineSlot: UInt32.from(time) })

    const sign1 = Signature.create(deployerKey, info.toFields())
    const sign2 = Signature.create(deployer2.key, info.toFields())
    const sign3 = Signature.create(deployer3.key, info.toFields())

    const multi = new MultisigInfo({
      approvedUpgrader: root,
      messageHash: info.hash(),
      deadlineSlot: UInt32.from(time)
    })
    const info1 = new SignatureInfo({
      user: deployerPublic,
      witness: merkle.getWitness(Poseidon.hash(deployerPublic.toFields())),
      signature: sign1,
      right: allRight
    })
    const info2 = new SignatureInfo({
      user: deployer2Public,
      witness: merkle.getWitness(Poseidon.hash(deployer2Public.toFields())),
      signature: sign2,
      right: updateSignerRight
    })
    const info3 = new SignatureInfo({
      user: deployer3Public,
      witness: merkle.getWitness(Poseidon.hash(deployer3Public.toFields())),
      signature: sign3,
      right: updateSignerRight
    })
    const signatures = [info1, info2, info3]

    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1)
      await zkApp.deploy({
        symbol: "FAC",
        src: "https://luminadex.com/",
        protocol: aliceAccount,
        delegator: dylanAccount,
        approvedSigner: root,
        signatures: signatures,
        multisigInfo: multi
      })
    })
    await txn.prove()
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey, zkTokenAdminPrivateKey, zkTokenPrivateKey]).send()

    const signature = Signature.create(deployerKey, zkPoolAddress.toFields())
    const witness = merkle.getWitness(Poseidon.hash(deployerPublic.toFields()))
    const txn3 = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 4)
      await zkApp.createPool(zkPoolAddress, zkTokenAddress, deployerAccount, signature, witness, allRight)
    })

    // console.log("Pool creation au", txn3.transaction.accountUpdates.length);
    await txn3.prove()
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn3.sign([deployerKey, zkPoolPrivateKey]).send()
  }

  it("update pool proof", async () => {
    merkle.set(Poseidon.hash(bobPublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(alicePublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(dylanPublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(senderPublic.toFields()), updatePoolRight.hash())

    await deployPool()

    const contractAddress = zkPoolAddress
    const tokenId = zkPool.tokenId
    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()
    const time = getSlotFromTimestamp(tomorrow)
    const info = new UpgradeInfo({
      contractAddress,
      tokenId,
      newVkHash: vkUpgradeTest.hash,
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

    const proof = new Multisig({ info: multi, signatures: array })
    const txn = await Mina.transaction(deployerAccount, async () => {
      await zkPool.updateVerificationKey(proof, compileKey)
    })
    await txn.prove()
    await txn.sign([deployerKey]).send()
  })

  it("incorrect signer pool proof", async () => {
    merkle.set(Poseidon.hash(bobPublic.toFields()), updateDelegatorRight.hash())
    merkle.set(Poseidon.hash(alicePublic.toFields()), updateDelegatorRight.hash())
    merkle.set(Poseidon.hash(dylanPublic.toFields()), updateDelegatorRight.hash())
    merkle.set(Poseidon.hash(senderPublic.toFields()), updateDelegatorRight.hash())

    await deployPool()

    const contractAddress = zkPoolAddress
    const tokenId = zkPool.tokenId
    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()
    const time = getSlotFromTimestamp(tomorrow)
    const info = new UpgradeInfo({
      contractAddress,
      tokenId,
      newVkHash: vkUpgradeTest.hash,
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

    const proof = new Multisig({ info: multi, signatures: array })
    await expect(Mina.transaction(deployerAccount, async () => {
      await zkPool.updateVerificationKey(proof, compileKey)
    })).rejects.toThrow("Invalid signer")
  })

  it("incorrect right pool proof", async () => {
    merkle.set(Poseidon.hash(bobPublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(alicePublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(dylanPublic.toFields()), updateDelegatorRight.hash())
    merkle.set(Poseidon.hash(senderPublic.toFields()), updateDelegatorRight.hash())

    await deployPool()

    const contractAddress = zkPoolAddress
    const tokenId = zkPool.tokenId
    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()
    const time = getSlotFromTimestamp(tomorrow)
    const info = new UpgradeInfo({
      contractAddress,
      tokenId,
      newVkHash: vkUpgradeTest.hash,
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
      right: updateDelegatorRight
    })
    const array = [infoBob, infoAlice, infoDylan]

    const proof = new Multisig({ info: multi, signatures: array })
    await expect(Mina.transaction(deployerAccount, async () => {
      await zkPool.updateVerificationKey(proof, compileKey)
    })).rejects.toThrow("User doesn't have the right for this operation")
  })

  it("incorrect message pool proof", async () => {
    merkle.set(Poseidon.hash(bobPublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(alicePublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(dylanPublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(senderPublic.toFields()), updatePoolRight.hash())

    await deployPool()

    const contractAddress = zkPoolAddress
    const tokenId = zkPool.tokenId
    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()
    const time = getSlotFromTimestamp(tomorrow)
    const info = new UpgradeInfo({
      contractAddress,
      tokenId,
      newVkHash: vkUpgradeTest.hash,
      deadlineSlot: UInt32.from(time)
    })
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

    // we sign for the incorrect info
    const multi = new MultisigInfo({
      approvedUpgrader: merkle.getRoot(),
      messageHash: infoProof.hash(),
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

    const proof = new Multisig({ info: multi, signatures: array })
    await expect(Mina.transaction(deployerAccount, async () => {
      await zkPool.updateVerificationKey(proof, compileKey)
    })).rejects.toThrow("Message didn't match parameters")
  })

  it("incorrect signature pool proof", async () => {
    merkle.set(Poseidon.hash(bobPublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(alicePublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(dylanPublic.toFields()), updatePoolRight.hash())
    merkle.set(Poseidon.hash(senderPublic.toFields()), updatePoolRight.hash())

    await deployPool()

    const contractAddress = zkPoolAddress
    const tokenId = zkPool.tokenId
    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()
    const time = getSlotFromTimestamp(tomorrow)
    const info = new UpgradeInfo({
      contractAddress,
      tokenId,
      newVkHash: vkUpgradeTest.hash,
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
    // we pass alice signature to throy the error
    const infoDylan = new SignatureInfo({
      user: dylanPublic,
      witness: merkle.getWitness(Poseidon.hash(dylanPublic.toFields())),
      signature: signAlice,
      right: updatePoolRight
    })
    const array = [infoBob, infoAlice, infoDylan]

    const proof = new Multisig({ info: multi, signatures: array })
    await expect(Mina.transaction(deployerAccount, async () => {
      await zkPool.updateVerificationKey(proof, compileKey)
    })).rejects.toThrow("Invalid signature")
  })

  it("update delegator", async () => {
    merkle.set(Poseidon.hash(bobPublic.toFields()), updateDelegatorRight.hash())
    merkle.set(Poseidon.hash(alicePublic.toFields()), updateDelegatorRight.hash())
    merkle.set(Poseidon.hash(dylanPublic.toFields()), updateDelegatorRight.hash())
    merkle.set(Poseidon.hash(senderPublic.toFields()), updateDelegatorRight.hash())

    await deployPool()

    const pk = PrivateKey.random()
    const oldAccount = await zkApp.delegator.fetch()
    const pkNew = PrivateKey.random()
    const newAccount = pkNew.toPublicKey()
    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()
    const time = getSlotFromTimestamp(tomorrow)
    const info = new UpdateAccountInfo({ oldUser: oldAccount!, newUser: newAccount, deadlineSlot: UInt32.from(time) })

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

    const proof = new Multisig({ info: multi, signatures: array })
    const txn = await Mina.transaction(deployerAccount, async () => {
      await zkApp.setNewDelegator(proof, newAccount)
    })
    await txn.prove()
    await txn.sign([deployerKey]).send()
  })

  it("update protocol", async () => {
    const right = updateProtocolRight
    merkle.set(Poseidon.hash(bobPublic.toFields()), right.hash())
    merkle.set(Poseidon.hash(alicePublic.toFields()), right.hash())
    merkle.set(Poseidon.hash(dylanPublic.toFields()), right.hash())
    merkle.set(Poseidon.hash(senderPublic.toFields()), right.hash())

    await deployPool()

    const pk = PrivateKey.random()
    const oldAccount = await zkApp.protocol.fetch()
    const pkNew = PrivateKey.random()
    const newAccount = pkNew.toPublicKey()
    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()
    const time = getSlotFromTimestamp(tomorrow)
    const info = new UpdateAccountInfo({ oldUser: oldAccount!, newUser: newAccount, deadlineSlot: UInt32.from(time) })

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

    const proof = new Multisig({ info: multi, signatures: array })
    const txn = await Mina.transaction(deployerAccount, async () => {
      await zkApp.setNewProtocol(proof, newAccount)
    })
    await txn.prove()
    await txn.sign([deployerKey]).send()
  })

  it("update factory", async () => {
    const right = updateFactoryRight
    merkle.set(Poseidon.hash(bobPublic.toFields()), right.hash())
    merkle.set(Poseidon.hash(alicePublic.toFields()), right.hash())
    merkle.set(Poseidon.hash(dylanPublic.toFields()), right.hash())
    merkle.set(Poseidon.hash(senderPublic.toFields()), right.hash())

    await deployPool()

    const today = new Date()
    today.setDate(today.getDate() + 1)
    const tomorrow = today.getTime()
    const time = getSlotFromTimestamp(tomorrow)
    const info = new UpdateFactoryInfo({ newVkHash: vkUpgradeTest.hash, deadlineSlot: UInt32.from(time) })

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

    const proof = new Multisig({ info: multi, signatures: array })
    const txn = await Mina.transaction(deployerAccount, async () => {
      await zkApp.updateVerificationKey(proof, vkUpgradeTest)
    })
    await txn.prove()
    await txn.sign([deployerKey]).send()
  })

  it("update signer", async () => {
    const right = updateSignerRight
    merkle.set(Poseidon.hash(bobPublic.toFields()), right.hash())
    merkle.set(Poseidon.hash(alicePublic.toFields()), right.hash())
    merkle.set(Poseidon.hash(dylanPublic.toFields()), right.hash())
    merkle.set(Poseidon.hash(senderPublic.toFields()), right.hash())

    await deployPool()

    const newMerkle = new MerkleMap()
    newMerkle.set(Poseidon.hash(bobPublic.toFields()), right.hash())
    newMerkle.set(Poseidon.hash(alicePublic.toFields()), right.hash())
    newMerkle.set(Poseidon.hash(deployerAccount.toFields()), right.hash())

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

    const proof = new MultisigSigner({ info: multi, signatures: array, newSignatures: newarray })
    const txn = await Mina.transaction(deployerAccount, async () => {
      await zkApp.updateApprovedSigner(proof, newMerkle.getRoot())
    })
    await txn.prove()
    await txn.sign([deployerKey]).send()
  })

  function getSlotFromTimestamp(date: number) {
    const { genesisTimestamp, slotTime } = Mina.activeInstance.getNetworkConstants()
    let slotCalculated = UInt64.from(date)
    slotCalculated = (slotCalculated.sub(genesisTimestamp)).div(slotTime)
    Provable.log("slotCalculated64", slotCalculated)
    return slotCalculated.toUInt32()
  }
})
