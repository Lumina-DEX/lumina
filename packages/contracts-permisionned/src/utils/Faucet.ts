import {
  AccountUpdate,
  AccountUpdateForest,
  DeployArgs,
  method,
  Permissions,
  PublicKey,
  State,
  state,
  TokenContract,
  UInt64
} from "o1js"

import { FungibleToken } from "../index.js"

export interface FaucetDeployProps extends Exclude<DeployArgs, undefined> {
  amount: UInt64
  token: PublicKey
}

export class Faucet extends TokenContract {
  @state(UInt64)
  amount = State<UInt64>()
  @state(PublicKey)
  token = State<PublicKey>()

  @method
  async approveBase(forest: AccountUpdateForest) {
    forest.isEmpty().assertTrue("You can't approve any token operation")
  }

  async deploy(args: FaucetDeployProps) {
    await super.deploy(args)
    args.amount.assertGreaterThan(UInt64.zero, "Put a default amount")
    this.amount.set(args.amount)
    args.token.isEmpty().assertFalse("Token empty")
    this.token.set(args.token)

    const token = new FungibleToken(args.token)
    token.deriveTokenId().assertEquals(this.tokenId, "Incorrect token address")

    this.account.permissions.set({
      ...Permissions.default(),
      send: Permissions.proof(),
      setVerificationKey: Permissions.VerificationKey.none(),
      setPermissions: Permissions.impossible()
    })
  }

  @method
  async claim() {
    const tokenAddress = this.token.getAndRequireEquals()
    const amount = this.amount.getAndRequireEquals()

    const token = new FungibleToken(tokenAddress)

    const sender = this.sender.getUnconstrained()

    const senderToken = AccountUpdate.create(sender, this.deriveTokenId())
    // if the balance is not zero, so the sender already claim
    senderToken.account.balance.requireEquals(UInt64.zero)

    const accountSender = AccountUpdate.create(sender, token.deriveTokenId())
    const accountUpdate = this.send({ to: accountSender, amount })
    accountUpdate.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent

    // we mint one token to check if this sender already claim
    this.internal.mint({ address: senderToken, amount: UInt64.one })
  }
}
