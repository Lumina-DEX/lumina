import {
  Claim,
  Credential,
  DynamicString,
  Operation,
  Presentation,
  PresentationRequest,
  PresentationSpec
} from "mina-attestations"
import {
  AccountUpdate,
  AccountUpdateForest,
  assert,
  Bool,
  DynamicProof,
  FeatureFlags,
  Field,
  Int64,
  method,
  Permissions,
  Poseidon,
  PrivateKey,
  Provable,
  PublicKey,
  Signature,
  State,
  state,
  Struct,
  TokenContract,
  TokenId,
  Types,
  UInt64,
  VerificationKey,
  ZkProgram
} from "o1js"

// B62qoHtRmvtiZrsWFZDUxgiJ98DcWbvva5D31iDXKFGbCUqFEwtxBrw
export const authorizeSigner = PrivateKey.fromBase58("EKE2f1KypNKvwd19SpvBhtkackD44JrKBomdvPERQsbxDiUE8Big")
const aurthorizedPublicKey = authorizeSigner.toPublicKey()

export class KycInfo extends Struct({
  sender: PublicKey,
  checkCompany: Bool,
  companyId: Field
}) {
  constructor(value: {
    sender: PublicKey
    checkCompany: Bool
    companyId: Field
  }) {
    super(value)
  }

  hash(): Field {
    return Poseidon.hash(this.sender.toFields().concat(this.checkCompany.toFields().concat(this.companyId.toFields())))
  }
}

export const KYCProgram = ZkProgram({
  name: "kyc",
  publicInput: KycInfo,

  methods: {
    checkKyc: {
      privateInputs: [Signature],

      /**
       * simple proof program where we supposed a dedicate signer,
       * sign a message with an address and a boolean indicate if it's address is KYC
       * @param publicInput address who check if is kyc
       * @param signature signature created by a dedicated signer manage by our org
       */
      async method(publicInput: KycInfo, signature: Signature) {
        signature.verify(aurthorizedPublicKey, publicInput.hash().toFields()).assertTrue("Invalid Signer")
      }
    }
  }
})
export let MainProof_ = ZkProgram.Proof(KYCProgram)
export class MainProof extends MainProof_ {}

// given a zkProgram, we compute the feature flags that we need in order to verify proofs that were generated
const featureFlags = await FeatureFlags.fromZkProgram(KYCProgram)

export class SideloadedProgramProof extends DynamicProof<KycInfo, KycInfo> {
  static publicInputType = KycInfo
  static publicOutputType = KycInfo
  static maxProofsVerified = 0 as const

  // we use the feature flags that we computed from the `sideloadedProgram` ZkProgram
  static featureFlags = featureFlags
}

const Nationality = DynamicString({ maxLength: 50 })

// dummy passport credential, which just takes in some data and returns it
// TODO: in place of this, we'd want a real proof of passport verification
// (implementation in progress at the time of writing)
let PassportCredential_ = await Credential.Imported.fromMethod(
  {
    name: "passport",
    publicInput: { issuer: Field },
    privateInput: { nationality: Nationality, expiresAt: UInt64 },
    data: { nationality: Nationality, expiresAt: UInt64 }
  },
  async ({ privateInput }) => {
    return privateInput
  }
)
export let PassportCredential = Object.assign(PassportCredential_, { Nationality })
let vk = await PassportCredential.compile()

let ownerKey = PrivateKey.random()
let owner = ownerKey.toPublicKey()
// user "imports" their passport into a credential, by creating a PassportCredential proof
let cred = await PassportCredential.create({
  owner,
  publicInput: { issuer: 1001 },
  privateInput: {
    expiresAt: UInt64.from(Date.UTC(2027, 1, 1)),
    nationality: "Austria"
  }
})
await Credential.validate(cred)
let credJson = Credential.toJSON(cred)

/**
 * Presentation spec for using a passport credential to verify
 * that the user is a citizen from a country other than the United States.
 */
let spec = PresentationSpec(
  { passport: PassportCredential.spec, createdAt: Claim(UInt64) },
  ({ passport, createdAt }) => ({
    assert: [
      // not from the United States
      Operation.not(
        Operation.equals(
          Operation.property(passport, "nationality"),
          Operation.constant(
            PassportCredential.Nationality.from("United States")
          )
        )
      ),

      // passport is not expired
      Operation.lessThanEq(
        createdAt,
        Operation.property(passport, "expiresAt")
      ),

      // hard-code passport verification key
      Operation.equals(
        Operation.verificationKeyHash(passport),
        Operation.constant(vk.hash)
      )
    ],
    // return public input (passport issuer hash) for verification
    outputClaim: Operation.publicInput(passport)
  })
)
let compiledSpec = await Presentation.precompile(spec)

// based on the (precompiled) spec, the verifier creates a presentation request
let request = PresentationRequest.httpsFromCompiled(
  compiledSpec,
  { createdAt: UInt64.from(Date.now()) },
  { action: "verify-citizenship" }
)
let requestJson = PresentationRequest.toJSON(request)

// the user answers the request by creating a presentation from their passport credential
let recoveredCredential = await Credential.fromJSON(credJson)
let recoveredRequest = PresentationRequest.fromJSON("https", requestJson)

let presentation = await Presentation.create(ownerKey, {
  request: recoveredRequest,
  credentials: [recoveredCredential],
  context: { verifierIdentity: "crypto-exchange.com" }
})
let presentationJson = Presentation.toJSON(presentation)

// the verifier verifies the presentation against their own (stored) request
let output = await Presentation.verify(
  request,
  Presentation.fromJSON(presentationJson),
  { verifierIdentity: "crypto-exchange.com" }
)

// also need to verify that the passport was issued by a legitimate authority.
// to enable this, the passport presentation exposed the `issuer` (public input of the passport credential)
let acceptedIssuers = [1001n, 1203981n, 21380123n] // mocked list of accepted issuers
assert(acceptedIssuers.includes(output.issuer.toBigInt()), "Invalid issuer")
