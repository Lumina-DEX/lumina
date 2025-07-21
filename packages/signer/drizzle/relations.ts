import { defineRelations } from "drizzle-orm"
import * as schema from "./schema"

export const relations = defineRelations(schema, (r) => ({
	multisig: {
		signer: r.one.signerMerkle({
			from: r.multisig.signerId,
			to: r.signerMerkle.id
		})
	},
	poolKey: {
		signer1: r.one.signerMerkle({
			from: r.poolKey.signer1Id,
			to: r.signerMerkle.id
		}),
		signer2: r.one.signerMerkle({
			from: r.poolKey.signer2Id,
			to: r.signerMerkle.id
		})
	}
}))
