import { AccountUpdate, Bool, method, Permissions, Poseidon, UInt64 } from "o1js"
import { ClaimEvent, FarmMerkleWitness, FarmReward, FarmRewardDeployProps } from "./FarmReward"

/**
 * Farm reward contract in case of the reward in fungible token
 */
export class FarmRewardTokenHolder extends FarmReward {
  async deploy(args: FarmRewardDeployProps) {
    this.account.isNew.requireEquals(Bool(true))

    await super.deploy(args)

    args.token.isEmpty().assertFalse("Token is empty")

    let permissions = Permissions.default()
    permissions.access = Permissions.none()
    permissions.send = Permissions.proof()
    permissions.setPermissions = Permissions.impossible()
    permissions.setVerificationKey = Permissions.VerificationKey.proofDuringCurrentVersion()
    this.account.permissions.set(permissions)
  }

  @method
  async claimReward(amount: UInt64, path: FarmMerkleWitness) {
    const farmReward = new FarmReward(this.address)
    const sender = this.sender.getAndRequireSignature()
    const fieldSender = sender.toFields()
    const hash = Poseidon.hash([fieldSender[0], fieldSender[1], amount.value])
    const root = this.merkleRoot.getAndRequireEquals()
    path.calculateRoot(hash).assertEquals(root, "Invalid request")
    const accountUpdate = this.send({ to: sender, amount: amount })
    accountUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent
    // to prevent double withdraw we mint one token once a user withdraw
    await farmReward.mint(sender)
    this.emitEvent("claim", new ClaimEvent({ user: sender, amount }))
  }
}
