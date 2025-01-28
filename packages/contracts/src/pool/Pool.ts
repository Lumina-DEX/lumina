import {
  AccountUpdate,
  AccountUpdateForest,
  assert,
  Bool,
  Int64,
  method,
  Permissions,
  Provable,
  PublicKey,
  State,
  state,
  Struct,
  TokenContractV2,
  TokenId,
  Types,
  UInt64
} from "o1js"

import { BalanceChangeEvent, FungibleToken, mulDiv, PoolFactory } from "../indexpool.js"

export class SwapEvent extends Struct({
  sender: PublicKey,
  amountIn: UInt64,
  amountOut: UInt64
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
  amountToken0In: UInt64,
  amountToken1In: UInt64,
  amountLiquidityOut: UInt64
}) {
  constructor(value: {
    sender: PublicKey
    amountToken0In: UInt64
    amountToken1In: UInt64
    amountLiquidityOut: UInt64
  }) {
    super(value)
  }
}

export class WithdrawLiquidityEvent extends Struct({
  sender: PublicKey,
  amountLiquidityIn: UInt64,
  amountToken0Out: UInt64,
  amountToken1Out: UInt64
}) {
  constructor(value: {
    sender: PublicKey
    amountLiquidityIn: UInt64
    amountToken0Out: UInt64
    amountToken1Out: UInt64
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
  poolFactory = State<PublicKey>()
  /**
   * we store protocol in the pool to not exceed account update limit on swap
   */
  @state(PublicKey)
  protocol = State<PublicKey>()

  // max fee for frontend 0.15 %
  static maxFee: UInt64 = UInt64.from(15)
  static minimunLiquidity: UInt64 = UInt64.from(1000)

  events = {
    swap: SwapEvent,
    addLiquidity: AddLiquidityEvent,
    withdrawLiquidity: WithdrawLiquidityEvent,
    BalanceChange: BalanceChangeEvent,
    updateDelegator: PublicKey,
    updateProtocol: PublicKey
  }

  async deploy() {
    await super.deploy()

    Bool(false).assertTrue("You can't directly deploy a pool")
  }

  @method
  async setDelegator() {
    const poolFactoryAddress = this.poolFactory.getAndRequireEquals()
    const poolFactory = new PoolFactory(poolFactoryAddress)
    const delegator = await poolFactory.getDelegator()
    const currentDelegator = this.account.delegate.getAndRequireEquals()
    currentDelegator.equals(delegator).assertFalse("Delegator already defined")
    this.account.delegate.set(delegator)
    this.emitEvent("updateDelegator", delegator)
  }

  @method
  async setProtocol() {
    const protocol = await this.getProtocolAddress()
    const currentProtocol = this.protocol.getAndRequireEquals()
    currentProtocol.equals(protocol).assertFalse("Protocol already defined")
    this.protocol.set(protocol)
    this.emitEvent("updateProtocol", protocol)
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
        new BalanceChangeEvent({ address: update.publicKey, amount: update.balanceChange })
      )

      // Don't allow transfers to/from the account that's tracking circulation
      update.publicKey.equals(this.address).and(usesToken).assertFalse(
        "Can't transfer to/from the circulation account"
      )
      totalBalance = Provable.if(usesToken, totalBalance.add(update.balanceChange), totalBalance)
      totalBalance.isPositiveV2().assertFalse(
        "Flash-minting or unbalanced transaction detected"
      )
    })
    totalBalance.assertEquals(Int64.zero, "Unbalanced transaction")
  }

  private checkPermissionsUpdate(update: AccountUpdate) {
    const permissions = update.update.permissions

    const { access, receive } = permissions.value
    const accessIsNone = Provable.equal(Types.AuthRequired, access, Permissions.none())
    const receiveIsNone = Provable.equal(Types.AuthRequired, receive, Permissions.none())
    const updateAllowed = accessIsNone.and(receiveIsNone)

    assert(
      updateAllowed.or(permissions.isSome.not()),
      "Can't change permissions for access or receive on token accounts"
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
    const liquidityUser = await this.supply(amountMina, amountToken, UInt64.zero, UInt64.zero, UInt64.zero, true, true)
    return liquidityUser
  }

  @method.returns(UInt64)
  async supplyLiquidity(
    amountMina: UInt64,
    amountToken: UInt64,
    reserveMinaMax: UInt64,
    reserveTokenMax: UInt64,
    supplyMin: UInt64
  ) {
    const liquidityUser = await this.supply(
      amountMina,
      amountToken,
      reserveMinaMax,
      reserveTokenMax,
      supplyMin,
      true,
      false
    )
    return liquidityUser
  }

  @method.returns(UInt64)
  async supplyFirstLiquiditiesToken(amountToken0: UInt64, amountToken1: UInt64) {
    const liquidityUser = await this.supply(
      amountToken0,
      amountToken1,
      UInt64.zero,
      UInt64.zero,
      UInt64.zero,
      false,
      true
    )
    return liquidityUser
  }

  @method.returns(UInt64)
  async supplyLiquidityToken(
    amountToken0: UInt64,
    amountToken1: UInt64,
    reserveToken0Max: UInt64,
    reserveToken1Max: UInt64,
    supplyMin: UInt64
  ) {
    const liquidityUser = await this.supply(
      amountToken0,
      amountToken1,
      reserveToken0Max,
      reserveToken1Max,
      supplyMin,
      false,
      false
    )
    return liquidityUser
  }

  @method
  async swapFromTokenToMina(
    frontend: PublicKey,
    taxFeeFrontend: UInt64,
    amountTokenIn: UInt64,
    amountMinaOutMin: UInt64,
    balanceInMax: UInt64,
    balanceOutMin: UInt64
  ) {
    amountTokenIn.assertGreaterThan(UInt64.zero, "Amount in can't be zero")
    balanceOutMin.assertGreaterThan(UInt64.zero, "Balance min can't be zero")
    balanceInMax.assertGreaterThan(UInt64.zero, "Balance max can't be zero")
    amountMinaOutMin.assertGreaterThan(UInt64.zero, "Amount out can't be zero")
    amountMinaOutMin.assertLessThan(balanceOutMin, "Amount out exceeds reserves")
    taxFeeFrontend.assertLessThanOrEqual(Pool.maxFee, "Frontend fee exceed max fees")

    // token 0 need to be empty on mina pool
    const [token0, token1] = this.checkToken(true)

    const tokenContract = new FungibleToken(token1)
    const tokenAccount = AccountUpdate.create(this.address, tokenContract.deriveTokenId())

    tokenAccount.account.balance.requireBetween(UInt64.one, balanceInMax)
    this.account.balance.requireBetween(balanceOutMin, UInt64.MAXINT())

    const { feeLP, feeFrontend, feeProtocol, amountOut } = Pool.getAmountOut(
      taxFeeFrontend,
      amountTokenIn,
      balanceInMax,
      balanceOutMin
    )
    amountOut.assertGreaterThanOrEqual(amountMinaOutMin, "Insufficient amount out")

    // send token to the pool
    const sender = this.sender.getUnconstrainedV2()
    sender.equals(this.address).assertFalse("Can't transfer to/from the pool account")
    const senderToken = AccountUpdate.createSigned(sender, tokenContract.deriveTokenId())
    senderToken.send({ to: tokenAccount, amount: amountTokenIn })

    await tokenContract.approveAccountUpdates([senderToken, tokenAccount])

    // send mina to user
    await this.send({ to: sender, amount: amountOut })
    // send mina to frontend (if not empty)
    const frontendReceiver = Provable.if(frontend.equals(PublicKey.empty()), this.address, frontend)
    await this.send({ to: frontendReceiver, amount: feeFrontend })
    // send mina to protocol
    const protocol = await this.getProtocolAddress()
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
  async swapFromMinaToToken(protocol: PublicKey, amountMinaIn: UInt64, balanceInMax: UInt64) {
    amountMinaIn.assertGreaterThan(UInt64.zero, "Amount in can't be zero")
    balanceInMax.assertGreaterThan(UInt64.zero, "Balance max can't be zero")

    const [token0, token1] = this.checkToken(true)

    // check if the protocol address is correct
    this.protocol.requireEquals(protocol)

    this.account.balance.requireBetween(UInt64.one, balanceInMax)
    const sender = this.sender.getUnconstrainedV2()
    const senderSigned = AccountUpdate.createSigned(sender)
    await senderSigned.send({ to: this.self, amount: amountMinaIn })
  }

  /**
   * Don't call this method directly, use withdrawLiquidity from PoolTokenHolder
   */
  @method
  async withdrawLiquidity(
    liquidityAmount: UInt64,
    amountMinaMin: UInt64,
    amountTokenOut: UInt64,
    reserveMinaMin: UInt64,
    supplyMax: UInt64
  ) {
    liquidityAmount.assertGreaterThan(UInt64.zero, "Liquidity amount can't be zero")
    reserveMinaMin.assertGreaterThan(UInt64.zero, "Reserve mina min can't be zero")
    amountMinaMin.assertGreaterThan(UInt64.zero, "Amount token can't be zero")
    supplyMax.assertGreaterThan(UInt64.zero, "Supply max can't be zero")

    // token 0 need to be empty on mina pool
    const [token0, token1] = this.checkToken(true)

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
        amountToken0Out: amountMina,
        amountToken1Out: amountTokenOut,
        amountLiquidityIn: liquidityAmount
      })
    )
  }

  /**
   * Don't call this method directly, use withdrawLiquidityToken from PoolTokenHolder
   */
  @method
  async checkLiquidityToken(
    liquidityAmount: UInt64,
    amountToken0: UInt64,
    amountToken1: UInt64,
    reserveMinaMin: UInt64,
    supplyMax: UInt64
  ) {
    liquidityAmount.assertGreaterThan(UInt64.zero, "Liquidity amount can't be zero")
    reserveMinaMin.assertGreaterThan(UInt64.zero, "Reserve mina min can't be zero")
    amountToken0.assertGreaterThan(UInt64.zero, "Amount token can't be zero")
    supplyMax.assertGreaterThan(UInt64.zero, "Supply max can't be zero")

    // token 0 need to be empty on mina pool
    const [token0, token1] = this.checkToken(false)

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
        amountToken0Out: amountToken0,
        amountToken1Out: amountToken1,
        amountLiquidityIn: liquidityAmount
      })
    )
  }

  private async supply(
    amountToken0: UInt64,
    amountToken1: UInt64,
    reserveToken0Max: UInt64,
    reserveToken1Max: UInt64,
    supplyMin: UInt64,
    isMinaPool: boolean,
    isFirstSupply: boolean
  ) {
    const circulationUpdate = AccountUpdate.create(this.address, this.deriveTokenId())
    const balanceLiquidity = circulationUpdate.account.balance.getAndRequireEquals()
    if (isFirstSupply) {
      balanceLiquidity.equals(UInt64.zero).assertTrue("First liquidities already supplied")
    } else {
      reserveToken1Max.assertGreaterThan(UInt64.zero, "Reserve token 1 max can't be zero")
      reserveToken0Max.assertGreaterThan(UInt64.zero, "Reserve token 0 max can't be zero")
      supplyMin.assertGreaterThan(UInt64.zero, "Supply min can't be zero")
    }
    amountToken0.assertGreaterThan(UInt64.zero, "Amount token 0 can't be zero")
    amountToken1.assertGreaterThan(UInt64.zero, "Amount token 1 can't be zero")

    const [token0, token1] = this.checkToken(isMinaPool)

    let liquidityAmount = UInt64.zero
    let liquidityUser = UInt64.zero

    const sender = this.sender.getUnconstrainedV2()
    sender.equals(this.address).assertFalse("Can't transfer to/from the pool account")

    const tokenId0 = TokenId.derive(token0)
    const tokenId1 = TokenId.derive(token1)
    const token0Account = isMinaPool ? this.self : AccountUpdate.create(this.address, tokenId0)
    const token1Account = AccountUpdate.create(this.address, tokenId1)

    if (isFirstSupply) {
      // calculate liquidity token output simply as liquidityAmount = amountA + amountB
      balanceLiquidity.equals(UInt64.zero).assertTrue("First liquidities already supplied")
      liquidityAmount = amountToken0.add(amountToken1)
      // on first mint remove minimal liquidity amount to prevent from inflation attack
      liquidityUser = liquidityAmount.sub(Pool.minimunLiquidity)
    } else {
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
    }

    if (isMinaPool) {
      // send mina to the pool
      const senderUpdate = AccountUpdate.createSigned(sender)
      senderUpdate.send({ to: this.self, amount: amountToken0 })
    } else {
      // send token 0 to the pool
      await this.sendTokenAccount(token0Account, token0, amountToken0)
    }
    // send token 1 to the pool
    await this.sendTokenAccount(token1Account, token1, amountToken1)

    this.internal.mint({ address: sender, amount: liquidityUser })
    this.internal.mint({ address: circulationUpdate, amount: liquidityAmount })

    this.emitEvent(
      "addLiquidity",
      new AddLiquidityEvent({
        sender,
        amountToken0In: amountToken0,
        amountToken1In: amountToken1,
        amountLiquidityOut: liquidityUser
      })
    )

    return liquidityUser
  }

  private checkToken(isMinaPool: boolean) {
    const token0 = this.token0.getAndRequireEquals()
    const token1 = this.token1.getAndRequireEquals()
    // token 0 need to be empty on mina pool
    token0.equals(PublicKey.empty()).assertEquals(
      isMinaPool,
      isMinaPool ? "Not a mina pool" : "Invalid token 0 address"
    )
    token1.equals(PublicKey.empty()).assertFalse("Invalid token 1 address")
    return [token0, token1]
  }

  private async sendTokenAccount(tokenAccount: AccountUpdate, tokenAddress: PublicKey, amount: UInt64) {
    const tokenContract = new FungibleToken(tokenAddress)
    const sender = this.sender.getUnconstrainedV2()
    sender.equals(this.address).assertFalse("Can't transfer to/from the pool account")

    // send token to the pool
    const senderToken = AccountUpdate.createSigned(sender, tokenContract.deriveTokenId())
    senderToken.send({ to: tokenAccount, amount: amount })
    await tokenContract.approveAccountUpdates([senderToken, tokenAccount])
  }

  private async getProtocolAddress(): Promise<PublicKey> {
    const poolFactoryAddress = this.poolFactory.getAndRequireEquals()
    const poolFactory = new PoolFactory(poolFactoryAddress)
    return await poolFactory.getProtocol()
  }

  public static getAmountOut(
    taxFeeFrontend: UInt64,
    amountTokenIn: UInt64,
    balanceInMax: UInt64,
    balanceOutMin: UInt64
  ) {
    const amountOutBeforeFee = mulDiv(balanceOutMin, amountTokenIn, balanceInMax.add(amountTokenIn))
    // 0.20% tax fee for liquidity provider directly on amount out
    const feeLP = mulDiv(amountOutBeforeFee, UInt64.from(2), UInt64.from(1000))
    // 0.15% fee max for the frontend
    const feeFrontend = mulDiv(amountOutBeforeFee, taxFeeFrontend, UInt64.from(10000))
    // 0.05% to the protocol
    const feeProtocol = mulDiv(amountOutBeforeFee, UInt64.from(5), UInt64.from(10000))
    const amountOut = amountOutBeforeFee.sub(feeLP).sub(feeFrontend).sub(feeProtocol)
    return { feeLP, feeFrontend, feeProtocol, amountOut }
  }
}
