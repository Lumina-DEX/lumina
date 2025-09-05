CREATE TABLE "Networks" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"network" text NOT NULL,
	CONSTRAINT "Networks_network_unique" UNIQUE("network")
);

-- 8. Populate network table
INSERT INTO "Networks" ("network") VALUES
  ('mina:mainnet'),
  ('zeko:mainnet'),
  ('mina:devnet'),
  ('zeko:testnet')
ON CONFLICT ("network") DO NOTHING;

--> statement-breakpoint
CREATE TABLE "Factory" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"public_key" text NOT NULL,
	"user" text NOT NULL,
	"network_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SignerMerkleNetworks" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"signer_id" integer NOT NULL,
	"network_id" integer NOT NULL,
	"permission" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);

-- migrate network
ALTER TABLE "Pool" ADD COLUMN "_tmp_network_id" integer;
UPDATE "Pool" p
SET _tmp_network_id = n.id
FROM "Networks" n
WHERE p."network" = n."network";
ALTER TABLE "Pool" DROP COLUMN "network";
ALTER TABLE "Pool" RENAME COLUMN "_tmp_network_id" TO "network_id";

WITH net_dev AS (
  SELECT id FROM "Networks" WHERE network = 'mina:devnet'
),
net_test AS (
  SELECT id FROM "Networks" WHERE network = 'zeko:testnet'
)

-- 2. Insérer les entrées correspondantes
INSERT INTO "SignerMerkleNetworks" ("signer_id", "network_id", "permission", "active")
SELECT s.id, n.id, s.permission, true
FROM "SignerMerkle" s
JOIN "Networks" n
  ON n.network IN ('mina:devnet', 'zeko:testnet')
ON CONFLICT DO NOTHING;

--> statement-breakpoint
ALTER TABLE "PoolKey" RENAME COLUMN "public_key" TO "pool_id";--> statement-breakpoint
ALTER TABLE "PoolKey" DROP CONSTRAINT "PoolKey_public_key_Pool_id_fk";
--> statement-breakpoint
ALTER TABLE "Multisig" ADD COLUMN "network_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "PoolKey" ADD COLUMN "factory_id" integer;--> statement-breakpoint
ALTER TABLE "Factory" ADD CONSTRAINT "Factory_network_id_Networks_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."Networks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SignerMerkleNetworks" ADD CONSTRAINT "SignerMerkleNetworks_signer_id_SignerMerkle_id_fk" FOREIGN KEY ("signer_id") REFERENCES "public"."SignerMerkle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SignerMerkleNetworks" ADD CONSTRAINT "SignerMerkleNetworks_network_id_Networks_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."Networks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Multisig" ADD CONSTRAINT "Multisig_network_id_Networks_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."Networks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Pool" ADD CONSTRAINT "Pool_network_id_Networks_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."Networks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PoolKey" ADD CONSTRAINT "PoolKey_pool_id_Pool_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."Pool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PoolKey" ADD CONSTRAINT "PoolKey_factory_id_Factory_id_fk" FOREIGN KEY ("factory_id") REFERENCES "public"."Factory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SignerMerkle" DROP COLUMN "permission";--> statement-breakpoint
ALTER TABLE "SignerMerkle" DROP COLUMN "active";