// src/pages/api/stat.page.ts

import type { SupportedNetwork } from "@lumina-dex/sdk"
import { archiveUrls, fetchPoolList, startBlock } from "@lumina-dex/sdk"
import type { NextApiRequest, NextApiResponse } from "next"
import { fetchEvents, PublicKey, TokenId, UInt32 } from "o1js"

// ─── Event type maps ──────────────────────────────────────────────────────────

const POOL_EVENT_TYPES: Record<number, string> = {
	0: "swap",
	1: "addLiquidity",
	2: "balanceChange",
	3: "updateDelegator",
	4: "updateProtocol",
	5: "upgrade",
	6: "burnLiquidity",
	7: "receiveMina"
}

const HOLDER_EVENT_TYPES: Record<number, string> = {
	0: "withdrawLiquidity",
	1: "swap",
	2: "upgrade",
	3: "subWithdrawLiquidity"
}

// ─── Types ────────────────────────────────────────────────────────────────────

const DECIMALS = 1_000_000_000n

interface RawEvent {
	globalSlot: string
	data: string[]
}

interface VolumeStats {
	total: string
	last24h: string
	avgPerDay: string
}

interface SwapStats {
	total: number
	last24h: number
	avgPerDay: string
}

interface PoolStats {
	poolAddress: string
	tokens: { symbol: string; address: string }[]
	firstActivityDate: string
	volume: {
		token0: VolumeStats
		token1: VolumeStats
	}
	swaps: SwapStats
	addLiquidity: { total: number }
	removeLiquidity: { total: number }
}

interface DexStats {
	network: string
	generatedAt: string
	pools: PoolStats[]
	totals: {
		volume: {
			token0: VolumeStats
			token1: VolumeStats
		}
		swaps: SwapStats
		addLiquidity: { total: number }
		removeLiquidity: { total: number }
	}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDecimal(raw: bigint): string {
	const whole = raw / DECIMALS
	const frac = raw % DECIMALS
	return `${whole}.${frac.toString().padStart(9, "0")}`
}

function parseDecimal(s: string): bigint {
	const [whole, frac = ""] = s.split(".")
	return BigInt(whole) * DECIMALS + BigInt(frac.padEnd(9, "0").slice(0, 9))
}

/**
 * Number of calendar days from firstDate to today (inclusive).
 * Supports both "YYYY-MM-DD" and "bucket-N" (Zeko slot buckets).
 */
function daySpan(firstDate: string, today: string): number {
	if (!firstDate || !today) return 1
	if (firstDate.startsWith("bucket-") && today.startsWith("bucket-")) {
		const a = Number.parseInt(firstDate.replace("bucket-", ""), 10)
		const b = Number.parseInt(today.replace("bucket-", ""), 10)
		return Math.max(b - a + 1, 1)
	}
	const MS_PER_DAY = 1000 * 60 * 60 * 24
	const diff = new Date(today).getTime() - new Date(firstDate).getTime()
	return Math.max(Math.floor(diff / MS_PER_DAY) + 1, 1)
}

function slotToDate(globalSlot: string, network: SupportedNetwork): string {
	const slot = Number(globalSlot)
	if (network === "mina:mainnet") {
		const GENESIS_MS = new Date("2021-03-17T00:00:00Z").getTime()
		const ts = GENESIS_MS + slot * 3 * 60 * 1000
		return new Date(ts).toISOString().slice(0, 10)
	}
	// Zeko: bucket by ~480 slots (~1 day at 3 min/slot)
	return `bucket-${Math.floor(slot / 480)}`
}

function todayDate(network: SupportedNetwork): string {
	if (network === "mina:mainnet") {
		return new Date().toISOString().slice(0, 10)
	}
	return ""
}

function computeVolumeStats(byDay: Map<string, bigint>, today: string, firstDate: string): VolumeStats {
	let total = 0n
	let last24h = 0n

	for (const [date, vol] of byDay) {
		total += vol
		if (date === today) last24h += vol
	}

	const span = daySpan(firstDate, today)
	const avg = span > 0 ? total / BigInt(span) : 0n

	return {
		total: toDecimal(total),
		last24h: toDecimal(last24h),
		avgPerDay: toDecimal(avg)
	}
}

function computeSwapStats(byDay: Map<string, number>, today: string, firstDate: string): SwapStats {
	let total = 0
	let last24h = 0

	for (const [date, count] of byDay) {
		total += count
		if (date === today) last24h += count
	}

	const span = daySpan(firstDate, today)

	return {
		total,
		last24h,
		avgPerDay: (total / span).toFixed(2)
	}
}

// ─── Fetching ─────────────────────────────────────────────────────────────────

async function fetchAllEvents(
	publicKey: string,
	archiveUrl: string,
	fromBlock: number,
	tokenId?: string,
	push?: (msg: string) => void
): Promise<RawEvent[]> {
	const allEvents: RawEvent[] = []
	let from = UInt32.from(fromBlock)
	const account = tokenId ? { publicKey, tokenId } : { publicKey }

	while (true) {
		const batch = await fetchEvents(account, archiveUrl, { from })
		if (!batch.length) break

		for (const block of batch) {
			for (const event of block.events) {
				allEvents.push({
					globalSlot: block.globalSlot.toString(),
					data: event.data
				})
			}
		}

		const lastBlock = batch[batch.length - 1].blockHeight.toBigint()
		push?.(`  → ${allEvents.length} events (block ${lastBlock})`)

		const nextBlock = lastBlock + 1n
		if (nextBlock <= from.toBigint()) break
		from = UInt32.from(nextBlock)
	}

	return allEvents
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

function aggregatePoolStats(
	poolEvents: RawEvent[],
	holderEvents: RawEvent[],
	pool: { address: string; tokens: { symbol: string; address: string }[] },
	network: SupportedNetwork
): PoolStats {
	const today = todayDate(network)

	const volToken0ByDay = new Map<string, bigint>()
	const volToken1ByDay = new Map<string, bigint>()
	const swapsByDay = new Map<string, number>()

	let totalAddLiquidity = 0
	let totalRemoveLiquidity = 0

	const addVol = (map: Map<string, bigint>, date: string, amount: bigint) => {
		map.set(date, (map.get(date) ?? 0n) + amount)
	}

	const addSwap = (date: string) => {
		swapsByDay.set(date, (swapsByDay.get(date) ?? 0) + 1)
	}

	// ── Pool contract events ──────────────────────────────────────────────────
	for (const { globalSlot, data } of poolEvents) {
		const type = POOL_EVENT_TYPES[Number(data[0])]
		if (!type) continue
		const fields = data.slice(3)
		const date = slotToDate(globalSlot, network)

		switch (type) {
			case "swap": {
				// Pool.swapFromTokenToMina: token1 IN → token0 (MINA) OUT
				addVol(volToken1ByDay, date, BigInt(fields[0] ?? "0"))
				addVol(volToken0ByDay, date, BigInt(fields[1] ?? "0"))
				addSwap(date)
				break
			}
			case "addLiquidity": {
				totalAddLiquidity++
				break
			}
			case "burnLiquidity": {
				totalRemoveLiquidity++
				break
			}
		}
	}

	// ── PoolTokenHolder events ────────────────────────────────────────────────
	for (const { globalSlot, data } of holderEvents) {
		const type = HOLDER_EVENT_TYPES[Number(data[0])]
		if (!type) continue
		const fields = data.slice(3)
		const date = slotToDate(globalSlot, network)

		switch (type) {
			case "swap": {
				// PoolTokenHolder.swapFromMinaToToken: token0 (MINA) IN → token1 OUT
				addVol(volToken0ByDay, date, BigInt(fields[0] ?? "0"))
				addVol(volToken1ByDay, date, BigInt(fields[1] ?? "0"))
				addSwap(date)
				break
			}
			// removeLiquidity counted via burnLiquidity on Pool side only
		}
	}

	// First activity date across both contracts
	const allDates = [
		...poolEvents.map((e) => slotToDate(e.globalSlot, network)),
		...holderEvents.map((e) => slotToDate(e.globalSlot, network))
	].sort()
	const firstDate = allDates[0] ?? today

	return {
		poolAddress: pool.address,
		tokens: pool.tokens,
		firstActivityDate: firstDate,
		volume: {
			token0: computeVolumeStats(volToken0ByDay, today, firstDate),
			token1: computeVolumeStats(volToken1ByDay, today, firstDate)
		},
		swaps: computeSwapStats(swapsByDay, today, firstDate),
		addLiquidity: { total: totalAddLiquidity },
		removeLiquidity: { total: totalRemoveLiquidity }
	}
}

function aggregateDexTotals(pools: PoolStats[], network: SupportedNetwork): DexStats["totals"] {
	// Use the earliest pool launch as the DEX start date
	const allFirstDates = pools.map((p) => p.firstActivityDate).sort()
	const dexFirstDate = allFirstDates[0] ?? ""
	const today = todayDate(network)

	let totalVol0 = 0n,
		last24hVol0 = 0n
	let totalVol1 = 0n,
		last24hVol1 = 0n
	let totalSwaps = 0,
		last24hSwaps = 0
	let totalAdd = 0,
		totalRemove = 0

	for (const p of pools) {
		totalVol0 += parseDecimal(p.volume.token0.total)
		last24hVol0 += parseDecimal(p.volume.token0.last24h)
		totalVol1 += parseDecimal(p.volume.token1.total)
		last24hVol1 += parseDecimal(p.volume.token1.last24h)
		totalSwaps += p.swaps.total
		last24hSwaps += p.swaps.last24h
		totalAdd += p.addLiquidity.total
		totalRemove += p.removeLiquidity.total
	}

	const span = BigInt(daySpan(dexFirstDate, today))

	return {
		volume: {
			token0: {
				total: toDecimal(totalVol0),
				last24h: toDecimal(last24hVol0),
				avgPerDay: toDecimal(span > 0n ? totalVol0 / span : 0n)
			},
			token1: {
				total: toDecimal(totalVol1),
				last24h: toDecimal(last24hVol1),
				avgPerDay: toDecimal(span > 0n ? totalVol1 / span : 0n)
			}
		},
		swaps: {
			total: totalSwaps,
			last24h: last24hSwaps,
			avgPerDay: (totalSwaps / Number(span)).toFixed(2)
		},
		addLiquidity: { total: totalAdd },
		removeLiquidity: { total: totalRemove }
	}
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(405).end()

	const { network }: { network: SupportedNetwork } = req.body
	const archiveUrl = archiveUrls[network]

	if (!archiveUrl || archiveUrl === "NOT_IMPLEMENTED") {
		return res.status(400).json({ error: `No archive URL for "${network}"` })
	}

	res.setHeader("Content-Type", "application/x-ndjson")
	res.setHeader("Transfer-Encoding", "chunked")

	const push = (msg: string) => res.write(JSON.stringify({ type: "log", payload: msg }) + "\n")

	try {
		push("Fetching pool list...")
		const pools = await fetchPoolList(network)
		push(`Found ${pools.length} pools.`)

		const poolStats: PoolStats[] = []
		const fromBlock = startBlock[network] ?? 0

		for (const pool of pools) {
			const name = `${pool.tokens[0].symbol}/${pool.tokens[1].symbol}`

			push(`[${name}] fetching Pool events…`)
			const poolEvents = await fetchAllEvents(pool.address, archiveUrl, fromBlock, undefined, (msg) =>
				push(`[${name}] pool ${msg}`)
			)

			const holderTokenId = TokenId.derive(PublicKey.fromBase58(pool.tokens[1].address)).toString()

			push(`[${name}] fetching PoolTokenHolder events…`)
			const holderEvents = await fetchAllEvents(pool.address, archiveUrl, fromBlock, holderTokenId, (msg) =>
				push(`[${name}] holder ${msg}`)
			)

			const stats = aggregatePoolStats(poolEvents, holderEvents, pool, network)
			poolStats.push(stats)

			push(
				`[${name}] swaps=${stats.swaps.total} | vol0 total=${stats.volume.token0.total} 24h=${stats.volume.token0.last24h} avg=${stats.volume.token0.avgPerDay}`
			)
		}

		const result: DexStats = {
			network,
			generatedAt: new Date().toISOString(),
			pools: poolStats,
			totals: aggregateDexTotals(poolStats, network)
		}

		res.write(JSON.stringify({ type: "data", payload: result }) + "\n")
		res.write(JSON.stringify({ type: "done" }) + "\n")
	} catch (err) {
		res.write(JSON.stringify({ type: "error", payload: String(err) }) + "\n")
	} finally {
		res.end()
	}
}

export const config = {
	api: {
		bodyParser: true,
		responseLimit: false
	}
}
