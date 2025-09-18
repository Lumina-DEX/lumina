import type { Networks } from "@lumina-dex/sdk"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "./pooldb.types"

export const updatePool = async ({
	env,
	poolAddress,
	network
}: { env: Env; poolAddress: string; network: string }) => {
	const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_KEY)
	await supabase
		.from("Pool")
		.update({ status: "deployed" })
		.eq("public_key", poolAddress)
		.eq("network", network)
}

export const cleanPendingPools = async ({ env }: { env: Env }) => {
	const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_KEY)
	const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

	const { data: pendingPools, error } = await supabase
		.from("Pool")
		.select()
		.eq("status", "pending")
		.lt("created_at", oneDayAgo)

	if (!pendingPools || error) {
		console.error("Error fetching pending pools", error)
		return
	}

	if (pendingPools.length === 0) {
		console.log("No pending pools to clean")
		return
	}
	console.log(`Cleaning ${pendingPools.length} pending pools`)
	const id = env.TOKENLIST.idFromName(env.DO_TOKENLIST_NAME)
	const tokenList = env.TOKENLIST.get(id)

	//TODO: Use p-limit to do this in batches.

	for (const pool of pendingPools) {
		const exist = await tokenList.poolExists({
			network: pool.network as Networks,
			address: pool.public_key
		})
		if (exist) {
			console.log(
				`Pool ${pool.public_key} exists on network ${pool.network}, updating status to deployed`
			)
			await supabase.from("Pool").update({ status: "deployed" }).eq("id", pool.id)
		}
		if (!exist) {
			console.log(
				`Pool ${pool.public_key} does not exist on network ${pool.network}, deleting from database`
			)
			await supabase.from("Pool").delete().eq("id", pool.id)
		}
	}
}
