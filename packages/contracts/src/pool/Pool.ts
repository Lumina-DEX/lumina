import {
  Account,
  AccountUpdate,
  AccountUpdateForest,
  assert,
  Bool,
  CircuitString,
  DeployArgs,
  Field,
  Int64,
  method,
  Permissions,
  Provable,
  PublicKey,
  Reducer,
  State,
  state,
  Struct,
  TokenContractV2,
  TokenId,
  Types,
  UInt64,
  VerificationKey,
} from "o1js"
import { BalanceChangeEvent, FungibleToken, mulDiv, PoolData, PoolTokenHolder } from "../indexpool.js"

export class SwapEvent extends Struct({
  sender: PublicKey,
  amountIn: UInt64,
  amountOut: UInt64,
}) {
  constructor(value: {
    sender: PublicKey
    amountIn: UInt64
    amountOut: UInt64
  }) {
    super(value)
  }
}

export class AddLiquidityEvent extends Struct({
  sender: PublicKey,
  amountMinaIn: UInt64,
  amountTokenIn: UInt64,
  amountLiquidityOut: UInt64,
}) {
  constructor(value: {
    sender: PublicKey
    amountMinaIn: UInt64
    amountTokenIn: UInt64
    amountLiquidityOut: UInt64
  }) {
    super(value)
  }
}

export class WithdrawLiquidityEvent extends Struct({
  sender: PublicKey,
  amountLiquidityIn: UInt64,
  amountMinaOut: UInt64,
  amountTokenOut: UInt64,
}) {
  constructor(value: {
    sender: PublicKey
    amountLiquidityIn: UInt64
    amountMinaOut: UInt64
    amountTokenOut: UInt64
  }) {
    super(value)
  }
}

/**
 * Pool contract for Lumina dex (Future implementation for direct mina token support)
 */
export class Pool extends TokenContractV2 {
  // we need the token address to instantiate it
  @state(PublicKey)
  token0 = State<PublicKey>()
  @state(PublicKey)
  token1 = State<PublicKey>()
  @state(PublicKey)
  poolData = State<PublicKey>()

  // max fee for frontend 0.15 %
  static maxFee: UInt64 = UInt64.from(15)
  static minimunLiquidity: UInt64 = UInt64.from(1000)

  events = {
    swap: SwapEvent,
    addLiquidity: AddLiquidityEvent,
    withdrawLiquidity: WithdrawLiquidityEvent,
    BalanceChange: BalanceChangeEvent,
    updateDelegator: PublicKey,
  }

  async deploy() {
    await super.deploy()

    Bool(false).assertTrue("You can't directly deploy a pool")
  }

  @method
  async setDelegator() {
    const poolDataAddress = this.poolData.getAndRequireEquals()
    const poolData = new PoolData(poolDataAddress)
    const delegator = await poolData.getDelegator()
    const currentDelegator = this.account.delegate.getAndRequireEquals()
    currentDelegator.equals(delegator).assertFalse("Delegator already defined")

    this.account.delegate.set(delegator)

    this.emitEvent("updateDelegator", delegator)
  }

  /** Approve `AccountUpdate`s that have been created outside of the token contract.
   *
   * @argument {AccountUpdateForest} updates - The `AccountUpdate`s to approve. Note that the forest size is limited by the base token contract, @see TokenContractV2.MAX_ACCOUNT_UPDATES The current limit is 9.
   */
  @method
  async approveBase(updates: AccountUpdateForest): Promise<void> {
    let totalBalance = Int64.from(0)
    this.forEachUpdate(updates, (update, usesToken) => {
      // Make sure that the account permissions are not changed
      this.checkPermissionsUpdate(update)
      this.emitEventIf(
        usesToken,
        "BalanceChange",
        new BalanceChangeEvent({ address: update.publicKey, amount: update.balanceChange }),
      )

      // Don't allow transfers to/from the account that's tracking circulation
      update.publicKey.equals(this.address).and(usesToken).assertFalse(
        "Can't transfer to/from the circulation account",
      )
      totalBalance = Provable.if(usesToken, totalBalance.add(update.balanceChange), totalBalance)
      totalBalance.isPositiveV2().assertFalse(
        "Flash-minting or unbalanced transaction detected",
      )
    })
    totalBalance.assertEquals(Int64.zero, "Unbalanced transaction")
  }

  private checkPermissionsUpdate(update: AccountUpdate) {
    let permissions = update.update.permissions

    let { access, receive } = permissions.value
    let accessIsNone = Provable.equal(Types.AuthRequired, access, Permissions.none())
    let receiveIsNone = Provable.equal(Types.AuthRequired, receive, Permissions.none())
    let updateAllowed = accessIsNone.and(receiveIsNone)

    assert(
      updateAllowed.or(permissions.isSome.not()),
      "Can't change permissions for access or receive on token accounts",
    )
  }

  @method
  async transfer(from: PublicKey, to: PublicKey, amount: UInt64) {
    from.equals(this.address).assertFalse("Can't transfer to/from the circulation account")
    to.equals(this.address).assertFalse("Can't transfer to/from the circulation account")
    this.internal.send({ from, to, amount })
  }

  @method.returns(UInt64)
  async supplyFirstLiquidities(amountMina: UInt64, amountToken: UInt64) {
    const circulationUpdate = AccountUpdate.create(this.address, this.deriveTokenId())
    const balanceLiquidity = circulationUpdate.account.balance.getAndRequireEquals()
    balanceLiquidity.equals(UInt64.zero).assertTrue("First liquidities already supplied")

    amountToken.assertGreaterThan(UInt64.zero, "Amount token can't be zero")
    amountMina.assertGreaterThan(UInt64.zero, "Amount mina can't be zero")

    // remove minimun liquidity amount, we mint token to the protocol fees
    const liquidityAmount = amountToken.add(amountMina)

    // token 0 need to be empty on mina pool
    const token0 = this.token0.getAndRequireEquals()
    const token1 = this.token1.getAndRequireEquals()
    token0.equals(PublicKey.empty()).assertTrue("Not a mina pool")
    token1.equals(PublicKey.empty()).assertFalse("Invalid token 1 address")

    let tokenContract = new FungibleToken(token1)
    let tokenAccount = AccountUpdate.create(this.address, tokenContract.deriveTokenId())

    // send mina to the pool
    let sender = this.sender.getUnconstrainedV2()
    sender.equals(this.address).assertFalse("Can't transfer to/from the pool account")
    let senderUpdate = AccountUpdate.createSigned(sender)
    senderUpdate.send({ to: this.self, amount: amountMina })

    // send token to the pool
    let senderToken = AccountUpdate.createSigned(sender, tokenContract.deriveTokenId())
    senderToken.send({ to: tokenAccount, amount: amountToken })

    // calculate liquidity token output simply as liquidityAmount = amountA + amountB
    const liquidityUser = liquidityAmount.sub(Pool.minimunLiquidity)
    // mint token
    this.internal.mint({ address: sender, amount: liquidityUser })
    this.internal.mint({ address: circulationUpdate, amount: liquidityAmount })

    await tokenContract.approveAccountUpdates([senderToken, tokenAccount])

    this.emitEvent(
      "addLiquidity",
      new AddLiquidityEvent({
        sender,
        amountMinaIn: amountMina,
        amountTokenIn: amountToken,
        amountLiquidityOut: liquidityUser,
      }),
    )

    return liquidityUser
  }

  @method.returns(UInt64)
  async supplyLiquidity(
    amountMina: UInt64,
    amountToken: UInt64,
    reserveMinaMax: UInt64,
    reserveTokenMax: UInt64,
    supplyMin: UInt64,
  ) {
    amountMina.assertGreaterThan(UInt64.zero, "Amount mina can't be zero")
    amountToken.assertGreaterThan(UInt64.zero, "Amount token can't be zero")
    reserveTokenMax.assertGreaterThan(UInt64.zero, "Reserve token max can't be zero")
    reserveMinaMax.assertGreaterThan(UInt64.zero, "Reserve mina max can't be zero")
    supplyMin.assertGreaterThan(UInt64.zero, "Supply min can't be zero")

    // token 0 need to be empty on mina pool
    const token0 = this.token0.getAndRequireEquals()
    const token1 = this.token1.getAndRequireEquals()
    token0.equals(PublicKey.empty()).assertTrue("Not a mina pool")
    token1.equals(PublicKey.empty()).assertFalse("Invalid token 1 address")

    const circulationUpdate = AccountUpdate.create(this.address, this.deriveTokenId())
    let tokenContract = new FungibleToken(token1)
    let tokenAccount = AccountUpdate.create(this.address, tokenContract.deriveTokenId())

    tokenAccount.account.balance.requireBetween(UInt64.one, reserveTokenMax)
    this.account.balance.requireBetween(UInt64.one, reserveMinaMax)
    circulationUpdate.account.balance.requireBetween(supplyMin, UInt64.MAXINT())

    // calculate liquidity token output simply as amountX * liquiditySupply / reserveX
    const liquidityMina = mulDiv(amountMina, supplyMin, reserveMinaMax)
    const liquidityToken = mulDiv(amountToken, supplyMin, reserveTokenMax)
    // 0.1 % of error max between these 2 liquidities, prevent to send too much token or mina
    const percentError = liquidityMina.div(1000)
    const liquidityMin = liquidityMina.sub(percentError)
    const liquidityMax = liquidityMina.add(percentError)
    liquidityMin.assertLessThanOrEqual(liquidityToken, "Too much mina supplied")
    liquidityMax.assertGreaterThanOrEqual(liquidityToken, "Too much token supplied")

    const liquidityAmount = Provable.if(liquidityMina.lessThan(liquidityToken), liquidityMina, liquidityToken)
    liquidityAmount.assertGreaterThan(UInt64.zero, "Liquidity out can't be zero")

    // send mina to the pool
    let sender = this.sender.getUnconstrainedV2()
    sender.equals(this.address).assertFalse("Can't transfer to/from the pool account")
    let senderUpdate = AccountUpdate.createSigned(sender)
    senderUpdate.send({ to: this.self, amount: amountMina })

    // send token to the pool
    let senderToken = AccountUpdate.createSigned(sender, tokenContract.deriveTokenId())
    senderToken.send({ to: tokenAccount, amount: amountToken })

    const liquidityUser = liquidityAmount
    // mint token
    this.internal.mint({ address: sender, amount: liquidityUser })
    this.internal.mint({ address: circulationUpdate, amount: liquidityAmount })

    await tokenContract.approveAccountUpdates([senderToken, tokenAccount])

    this.emitEvent(
      "addLiquidity",
      new AddLiquidityEvent({
        sender,
        amountMinaIn: amountMina,
        amountTokenIn: amountToken,
        amountLiquidityOut: liquidityUser,
      }),
    )

    return liquidityUser
  }

  @method.returns(UInt64)
  async supplyFirstLiquiditiesToken(amountToken0: UInt64, amountToken1: UInt64) {
    amountToken0.assertGreaterThan(UInt64.zero, "Amount token 0 can't be zero")
    amountToken1.assertGreaterThan(UInt64.zero, "Amount token 1 can't be zero")

    // if token 0 is empty so it's a Mina/Token pool
    const token0 = this.token0.getAndRequireEquals()
    const token1 = this.token1.getAndRequireEquals()
    token0.equals(PublicKey.empty()).assertFalse("Invalid token 0 address")
    token1.equals(PublicKey.empty()).assertFalse("Invalid token 1 address")

    // if token 0 is not empty we send fungible token to the pool
    const amount0 = Provable.if(token0.equals(PublicKey.empty()), UInt64.zero, amountToken0)
    await this.sendToken(token0, amount0)
    // send token 1
    await this.sendToken(token1, amountToken1)

    // calculate liquidity token output simply as liquidityAmount = amountA + amountB
    const circulationUpdate = AccountUpdate.create(this.address, this.deriveTokenId())
    const balanceLiquidity = circulationUpdate.account.balance.getAndRequireEquals()
    balanceLiquidity.equals(UInt64.zero).assertTrue("First liquidities already supplied")

    const liquidityAmount = amount0.add(amountToken1)
    // on first mint remove minimal liquidity amount to prevent from inflation attack
    const liquidityUser = liquidityAmount.sub(Pool.minimunLiquidity)
    // mint token
    let sender = this.sender.getUnconstrainedV2()
    this.internal.mint({ address: sender, amount: liquidityUser })
    this.internal.mint({ address: circulationUpdate, amount: liquidityAmount })

    this.emitEvent(
      "addLiquidity",
      new AddLiquidityEvent({
        sender,
        amountMinaIn: amountToken0,
        amountTokenIn: amountToken1,
        amountLiquidityOut: liquidityUser,
      }),
    )

    return liquidityUser
  }

  @method.returns(UInt64)
  async supplyLiquidityToken(
    amountToken0: UInt64,
    amountToken1: UInt64,
    reserveToken0Max: UInt64,
    reserveToken1Max: UInt64,
    supplyMin: UInt64,
  ) {
    amountToken0.assertGreaterThan(UInt64.zero, "Amount token 0 can't be zero")
    amountToken1.assertGreaterThan(UInt64.zero, "Amount token 1 can't be zero")
    reserveToken1Max.assertGreaterThan(UInt64.zero, "Reserve token 1 max can't be zero")
    reserveToken0Max.assertGreaterThan(UInt64.zero, "Reserve token 0 max can't be zero")
    supplyMin.assertGreaterThan(UInt64.zero, "Supply min can't be zero")

    // if token 0 is empty so it's a Mina/Token pool
    const token0 = this.token0.getAndRequireEquals()
    const token1 = this.token1.getAndRequireEquals()
    token0.equals(PublicKey.empty()).assertFalse("Invalid token 0 address")
    token1.equals(PublicKey.empty()).assertFalse("Invalid token 1 address")

    const circulationUpdate = AccountUpdate.create(this.address, this.deriveTokenId())
    const tokenId0 = TokenId.derive(token0)
    const tokenId1 = TokenId.derive(token1)
    const token0Account = AccountUpdate.create(this.address, tokenId0)
    const token1Account = AccountUpdate.create(this.address, tokenId1)

    token0Account.account.balance.requireBetween(UInt64.one, reserveToken0Max)
    token1Account.account.balance.requireBetween(UInt64.one, reserveToken1Max)
    circulationUpdate.account.balance.requireBetween(supplyMin, UInt64.MAXINT())

    // calculate liquidity token output simply as amountX * liquiditySupply / reserveX
    const liquidityToken0 = mulDiv(amountToken0, supplyMin, reserveToken0Max)
    const liquidityToken1 = mulDiv(amountToken1, supplyMin, reserveToken1Max)
    // 0.1 % of error max between these 2 liquidities, prevent to send too much token or mina
    const percentError = liquidityToken0.div(1000)
    const liquidityMin = liquidityToken0.sub(percentError)
    const liquidityMax = liquidityToken0.add(percentError)
    liquidityMin.assertLessThanOrEqual(liquidityToken1, "Too much token 0 supplied")
    liquidityMax.assertGreaterThanOrEqual(liquidityToken1, "Too much token 1 supplied")

    const liquidityAmount = Provable.if(liquidityToken0.lessThan(liquidityToken1), liquidityToken0, liquidityToken1)
    liquidityAmount.assertGreaterThan(UInt64.zero, "Liquidity out can't be zero")

    await this.sendTokenAccount(token0Account, token0, amountToken0)
    // send token 1
    await this.sendTokenAccount(token1Account, token1, amountToken1)

    let sender = this.sender.getUnconstrainedV2()
    const liquidityUser = liquidityAmount
    // mint token
    this.internal.mint({ address: sender, amount: liquidityUser })
    this.internal.mint({ address: circulationUpdate, amount: liquidityAmount })

    this.emitEvent(
      "addLiquidity",
      new AddLiquidityEvent({
        sender,
        amountMinaIn: amountToken0,
        amountTokenIn: amountToken1,
        amountLiquidityOut: liquidityUser,
      }),
    )

    return liquidityUser
  }

  @method
  async swapTokenForMina(
    frontend: PublicKey,
    taxFeeFrontend: UInt64,
    amountTokenIn: UInt64,
    amountMinaOutMin: UInt64,
    balanceInMax: UInt64,
    balanceOutMin: UInt64,
  ) {
    amountTokenIn.assertGreaterThan(UInt64.zero, "Amount in can't be zero")
    balanceOutMin.assertGreaterThan(UInt64.zero, "Balance min can't be zero")
    balanceInMax.assertGreaterThan(UInt64.zero, "Balance max can't be zero")
    amountMinaOutMin.assertGreaterThan(UInt64.zero, "Amount out can't be zero")
    amountMinaOutMin.assertLessThan(balanceOutMin, "Amount out exceeds reserves")
    taxFeeFrontend.assertLessThanOrEqual(Pool.maxFee, "Frontend fee exceed max fees")

    // token 0 need to be empty on mina pool
    const token0 = this.token0.getAndRequireEquals()
    const token1 = this.token1.getAndRequireEquals()
    token0.equals(PublicKey.empty()).assertTrue("Not a mina pool")
    token1.equals(PublicKey.empty()).assertFalse("Invalid token 1 address")

    let tokenContract = new FungibleToken(token1)
    let tokenAccount = AccountUpdate.create(this.address, tokenContract.deriveTokenId())

    tokenAccount.account.balance.requireBetween(UInt64.one, balanceInMax)
    this.account.balance.requireBetween(balanceOutMin, UInt64.MAXINT())

    let amountOutBeforeFee = mulDiv(balanceOutMin, amountTokenIn, balanceInMax.add(amountTokenIn))
    // 0.20% tax fee for liquidity provider directly on amount out
    const feeLP = mulDiv(amountOutBeforeFee, UInt64.from(2), UInt64.from(1000))
    // 0.15% fee max for the frontend
    const feeFrontend = mulDiv(amountOutBeforeFee, taxFeeFrontend, UInt64.from(10000))
    // 0.05% to the protocol
    const feeProtocol = mulDiv(amountOutBeforeFee, UInt64.from(5), UInt64.from(10000))

    let amountOut = amountOutBeforeFee.sub(feeLP).sub(feeFrontend).sub(feeProtocol)
    amountOut.assertGreaterThanOrEqual(amountMinaOutMin, "Insufficient amount out")

    // send token to the pool
    let sender = this.sender.getUnconstrainedV2()
    sender.equals(this.address).assertFalse("Can't transfer to/from the pool account")
    let senderToken = AccountUpdate.createSigned(sender, tokenContract.deriveTokenId())
    senderToken.send({ to: tokenAccount, amount: amountTokenIn })

    await tokenContract.approveAccountUpdates([senderToken, tokenAccount])

    // send mina to user
    await this.send({ to: sender, amount: amountOut })
    // send mina to frontend (if not empty)
    const frontendReceiver = Provable.if(frontend.equals(PublicKey.empty()), this.address, frontend)
    await this.send({ to: frontendReceiver, amount: feeFrontend })
    // send mina to protocol
    const poolDataAddress = this.poolData.getAndRequireEquals()
    const poolData = new PoolData(poolDataAddress)
    const protocol = await poolData.getProtocol()
    const protocolReceiver = Provable.if(protocol.equals(PublicKey.empty()), this.address, protocol)
    await this.send({ to: protocolReceiver, amount: feeProtocol })

    this.emitEvent("swap", new SwapEvent({ sender, amountIn: amountTokenIn, amountOut }))
  }

  /**
   * Don't call this method directly, use pool token holder or you will just lost mina
   * @param amountMinaIn mina amount in
   * @param balanceInMax actual reserve max in
   */
  @method
  async swapMinaForToken(protocol: PublicKey, amountMinaIn: UInt64, balanceInMax: UInt64) {
    amountMinaIn.assertGreaterThan(UInt64.zero, "Amount in can't be zero")
    balanceInMax.assertGreaterThan(UInt64.zero, "Balance max can't be zero")

    const token0 = this.token0.getAndRequireEquals()
    const token1 = this.token1.getAndRequireEquals()
    token0.equals(PublicKey.empty()).assertTrue("Not a mina pool")
    token1.equals(PublicKey.empty()).assertFalse("Invalid token 1 address")

    // check if the protocol address is correct
    const poolDataAddress = this.poolData.getAndRequireEquals()
    const poolData = new PoolData(poolDataAddress)
    poolData.protocol.requireEquals(protocol)

    this.account.balance.requireBetween(UInt64.one, balanceInMax)
    let sender = this.sender.getUnconstrainedV2()
    let senderSigned = AccountUpdate.createSigned(sender)
    await senderSigned.send({ to: this.self, amount: amountMinaIn })
  }

  @method
  async withdrawLiquidity(
    liquidityAmount: UInt64,
    amountMinaMin: UInt64,
    amountTokenOut: UInt64,
    reserveMinaMin: UInt64,
    supplyMax: UInt64,
  ) {
    liquidityAmount.assertGreaterThan(UInt64.zero, "Liquidity amount can't be zero")
    reserveMinaMin.assertGreaterThan(UInt64.zero, "Reserve mina min can't be zero")
    amountMinaMin.assertGreaterThan(UInt64.zero, "Amount token can't be zero")
    supplyMax.assertGreaterThan(UInt64.zero, "Supply max can't be zero")

    // token 0 need to be empty on mina pool
    const token0 = this.token0.getAndRequireEquals()
    const token1 = this.token1.getAndRequireEquals()
    token0.equals(PublicKey.empty()).assertTrue("Not a mina pool")
    token1.equals(PublicKey.empty()).assertFalse("Invalid token 1 address")

    this.account.balance.requireBetween(reserveMinaMin, UInt64.MAXINT())

    const sender = this.sender.getUnconstrainedV2()
    sender.equals(this.address).assertFalse("Can't transfer to/from the pool account")
    const liquidityAccount = AccountUpdate.create(this.address, this.deriveTokenId())
    liquidityAccount.account.balance.requireBetween(UInt64.one, supplyMax)

    const amountMina = mulDiv(liquidityAmount, reserveMinaMin, supplyMax)
    amountMina.assertGreaterThanOrEqual(amountMinaMin, "Insufficient amount mina out")

    // burn liquidity from user and current supply
    liquidityAccount.balanceChange = Int64.fromUnsigned(liquidityAmount).negV2()
    await this.internal.burn({ address: sender, amount: liquidityAmount })

    // send mina to user
    await this.send({ to: sender, amount: amountMina })

    this.emitEvent(
      "withdrawLiquidity",
      new WithdrawLiquidityEvent({
        sender,
        amountMinaOut: amountMina,
        amountTokenOut,
        amountLiquidityIn: liquidityAmount,
      }),
    )
  }

  @method
  async checkLiquidityToken(
    liquidityAmount: UInt64,
    amountMinaMin: UInt64,
    amountTokenOut: UInt64,
    reserveMinaMin: UInt64,
    supplyMax: UInt64,
  ) {
    liquidityAmount.assertGreaterThan(UInt64.zero, "Liquidity amount can't be zero")
    reserveMinaMin.assertGreaterThan(UInt64.zero, "Reserve mina min can't be zero")
    amountMinaMin.assertGreaterThan(UInt64.zero, "Amount token can't be zero")
    supplyMax.assertGreaterThan(UInt64.zero, "Supply max can't be zero")

    // token 0 need to be empty on mina pool
    const token0 = this.token0.getAndRequireEquals()
    const token1 = this.token1.getAndRequireEquals()
    token0.equals(PublicKey.empty()).assertFalse("Invalid token 0 address")
    token1.equals(PublicKey.empty()).assertFalse("Invalid token 1 address")

    const sender = this.sender.getUnconstrainedV2()
    sender.equals(this.address).assertFalse("Can't transfer to/from the pool account")
    const liquidityAccount = AccountUpdate.create(this.address, this.deriveTokenId())
    liquidityAccount.account.balance.requireBetween(UInt64.one, supplyMax)

    // burn liquidity from user and current supply
    liquidityAccount.balanceChange = Int64.fromUnsigned(liquidityAmount).negV2()
    await this.internal.burn({ address: sender, amount: liquidityAmount })

    this.emitEvent(
      "withdrawLiquidity",
      new WithdrawLiquidityEvent({
        sender,
        amountMinaOut: amountMinaMin,
        amountTokenOut,
        amountLiquidityIn: liquidityAmount,
      }),
    )
  }

  @method.returns(PublicKey)
  async getPoolData() {
    const poolData = this.poolData.getAndRequireEquals()
    return poolData
  }

  private async sendToken(tokenAddress: PublicKey, amount: UInt64) {
    let tokenContract = new FungibleToken(tokenAddress)
    let tokenAccount = AccountUpdate.create(this.address, tokenContract.deriveTokenId())
    let sender = this.sender.getUnconstrainedV2()
    sender.equals(this.address).assertFalse("Can't transfer to/from the pool account")

    // send token to the pool
    let senderToken = AccountUpdate.createSigned(sender, tokenContract.deriveTokenId())
    senderToken.send({ to: tokenAccount, amount: amount })
    await tokenContract.approveAccountUpdates([senderToken, tokenAccount])
  }

  private async sendTokenAccount(tokenAccount: AccountUpdate, tokenAddress: PublicKey, amount: UInt64) {
    let tokenContract = new FungibleToken(tokenAddress)
    let sender = this.sender.getUnconstrainedV2()
    sender.equals(this.address).assertFalse("Can't transfer to/from the pool account")

    // send token to the pool
    let senderToken = AccountUpdate.createSigned(sender, tokenContract.deriveTokenId())
    senderToken.send({ to: tokenAccount, amount: amount })
    await tokenContract.approveAccountUpdates([senderToken, tokenAccount])
  }

  private async sendMina(amount: UInt64) {
    let sender = this.sender.getUnconstrainedV2()
    sender.equals(this.address).assertFalse("Can't transfer to/from the pool account")
    let senderUpdate = AccountUpdate.createSigned(sender)
    senderUpdate.send({ to: this.self, amount: amount })
  }
}
