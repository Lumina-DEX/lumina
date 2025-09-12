-- Custom SQL migration file, put your code below! --
CREATE TABLE "Networks" (
	"network" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
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
	"network" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SignerMerkleNetworks" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"signer_id" integer NOT NULL,
	"network" text NOT NULL,
	"permission" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);


-- 2. Insérer les entrées correspondantes
INSERT INTO "SignerMerkleNetworks" ("signer_id", "network", "permission", "active")
SELECT s.id, n.network, s.permission, true
FROM "SignerMerkle" s
JOIN "Networks" n
  ON n.network IN ('mina:devnet', 'zeko:testnet')
ON CONFLICT DO NOTHING;

--> statement-breakpoint
ALTER TABLE "PoolKey" RENAME COLUMN "public_key" TO "pool_id";--> statement-breakpoint
ALTER TABLE "PoolKey" DROP CONSTRAINT "PoolKey_public_key_Pool_id_fk";
--> statement-breakpoint
ALTER TABLE "Multisig" ADD COLUMN "network" text NOT NULL;--> statement-breakpoint
ALTER TABLE "PoolKey" ADD COLUMN "factory_id" integer;--> statement-breakpoint
ALTER TABLE "Factory" ADD CONSTRAINT "Factory_network_Networks_network_fk" FOREIGN KEY ("network") REFERENCES "public"."Networks"("network") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SignerMerkleNetworks" ADD CONSTRAINT "SignerMerkleNetworks_signer_id_SignerMerkle_id_fk" FOREIGN KEY ("signer_id") REFERENCES "public"."SignerMerkle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SignerMerkleNetworks" ADD CONSTRAINT "SignerMerkleNetworks_network_Networks_network_fk" FOREIGN KEY ("network") REFERENCES "public"."Networks"("network") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Multisig" ADD CONSTRAINT "Multisig_network_Networks_network_fk" FOREIGN KEY ("network") REFERENCES "public"."Networks"("network") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Pool" ADD CONSTRAINT "Pool_network_Networks_network_fk" FOREIGN KEY ("network") REFERENCES "public"."Networks"("network") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PoolKey" ADD CONSTRAINT "PoolKey_pool_id_Pool_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."Pool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PoolKey" ADD CONSTRAINT "PoolKey_factory_id_Factory_id_fk" FOREIGN KEY ("factory_id") REFERENCES "public"."Factory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SignerMerkle" DROP COLUMN "permission";--> statement-breakpoint
ALTER TABLE "SignerMerkle" DROP COLUMN "active";