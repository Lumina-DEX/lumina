CREATE TABLE "Network" (
	"network" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- CUSTOM : Insert values into the Network table --
INSERT INTO "Network" ("network") VALUES
  ('mina:mainnet'),
  ('zeko:mainnet'),
  ('mina:devnet'),
  ('zeko:testnet')
ON CONFLICT ("network") DO NOTHING;
-- END CUSTOM --

--> statement-breakpoint
CREATE TABLE "Factory" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"public_key" text NOT NULL,
	"user" text NOT NULL,
	"network" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SignerMerkleNetwork" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"signer_id" integer NOT NULL,
	"network" text NOT NULL,
	"permission" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);

-- CUSTOM : Insert permission in new table --
INSERT INTO "SignerMerkleNetwork" ("signer_id", "network", "permission", "active")
SELECT 
    s.id, 
    n.network, 
    CASE 
        WHEN s.permission = 'all' THEN 31
        WHEN s.permission = 'deploy' THEN 1
        ELSE 0 
    END,
    true
FROM "SignerMerkle" s
JOIN "Network" n
  ON n.network IN ('mina:devnet', 'zeko:testnet')
ON CONFLICT DO NOTHING;
-- END CUSTOM --

--> statement-breakpoint
ALTER TABLE "PoolKey" RENAME COLUMN "public_key" TO "pool_id";--> statement-breakpoint
ALTER TABLE "PoolKey" DROP CONSTRAINT "PoolKey_public_key_Pool_id_fk";
--> statement-breakpoint
ALTER TABLE "Multisig" ADD COLUMN "network" text NOT NULL;--> statement-breakpoint
ALTER TABLE "PoolKey" ADD COLUMN "factory_id" integer;--> statement-breakpoint
ALTER TABLE "Factory" ADD CONSTRAINT "Factory_network_Network_network_fk" FOREIGN KEY ("network") REFERENCES "public"."Network"("network") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SignerMerkleNetwork" ADD CONSTRAINT "SignerMerkleNetwork_signer_id_SignerMerkle_id_fk" FOREIGN KEY ("signer_id") REFERENCES "public"."SignerMerkle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SignerMerkleNetwork" ADD CONSTRAINT "SignerMerkleNetwork_network_Network_network_fk" FOREIGN KEY ("network") REFERENCES "public"."Network"("network") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Multisig" ADD CONSTRAINT "Multisig_network_Network_network_fk" FOREIGN KEY ("network") REFERENCES "public"."Network"("network") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Pool" ADD CONSTRAINT "Pool_network_Network_network_fk" FOREIGN KEY ("network") REFERENCES "public"."Network"("network") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PoolKey" ADD CONSTRAINT "PoolKey_pool_id_Pool_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."Pool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PoolKey" ADD CONSTRAINT "PoolKey_factory_id_Factory_id_fk" FOREIGN KEY ("factory_id") REFERENCES "public"."Factory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SignerMerkle" DROP COLUMN "permission";--> statement-breakpoint
ALTER TABLE "SignerMerkle" DROP COLUMN "active";