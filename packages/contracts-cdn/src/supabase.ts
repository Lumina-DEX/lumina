import type { Networks } from "@lumina-dex/sdk"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "./pooldb.types"

export const updatePool = async ({
	env,
	poolAddress,
	network,
	status
}: {
	env: Env
	poolAddress: string
	network: string
	status: "deployed" | "unconfirmed"
}) => {
	const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_KEY)
	await supabase.from("Pool").update({ status }).eq("public_key", poolAddress).eq("network", network)
}

export const cleanPoolTable = async ({ env }: { env: Env }) => {
	const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_KEY)
	const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

	const [{ data: pendingPools, error: pendingError }, { data: confirmedPools, error: confirmedError }] =
		await Promise.all([
			supabase.from("Pool").select().eq("status", "pending").lt("created_at", oneDayAgo),
			supabase.from("Pool").select().eq("status", "confirmed").lt("created_at", oneDayAgo)
		])

	const pools = [...(pendingPools || []), ...(confirmedPools || [])]
	const error = pendingError || confirmedError
	if (!pools || error) {
		console.error("Error fetching pools", error)
		return
	}

	if (pools.length === 0) {
		console.log("No pools to clean")
		return
	}
	console.log(`Cleaning ${pendingPools.length} pools`)
	const id = env.TOKENLIST.idFromName(env.DO_TOKENLIST_NAME)
	const tokenList = env.TOKENLIST.get(id)

	// TODO: Use p-limit to do this in batches.
	for (const { id, network, public_key: address } of pools) {
		const exist = await tokenList.poolExists({ network: network as Networks, address })
		if (exist) {
			console.log(`Pool ${address} exists on network ${network}, updating status to deployed`)
			await supabase.from("Pool").update({ status: "deployed" }).eq("id", id)
		} else {
			console.log(`Pool ${address} does not exist on network ${network}, deleting from database`)
			await supabase.from("Pool").update({ status: "unconfirmed" }).eq("id", id)
		}
	}
}
