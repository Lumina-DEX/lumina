CREATE TABLE "Multisig" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"signer" integer NOT NULL,
	"signature" text NOT NULL,
	"data" text NOT NULL,
	"deadline" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Pool" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"token_a" text NOT NULL,
	"token_b" text NOT NULL,
	"public_key" text NOT NULL,
	"user" text NOT NULL,
	"job_id" text NOT NULL,
	"status" text NOT NULL,
	"network" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PoolKey" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"public_key" integer NOT NULL,
	"signer_1" integer NOT NULL,
	"signer_2" integer NOT NULL,
	"encrypted_key" text NOT NULL,
	"generated_public_1" text NOT NULL,
	"generated_public_2" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SignerMerkle" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"public_key" text NOT NULL,
	"permission" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Multisig" ADD CONSTRAINT "Multisig_signer_SignerMerkle_id_fk" FOREIGN KEY ("signer") REFERENCES "public"."SignerMerkle"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PoolKey" ADD CONSTRAINT "PoolKey_public_key_Pool_id_fk" FOREIGN KEY ("public_key") REFERENCES "public"."Pool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PoolKey" ADD CONSTRAINT "PoolKey_signer_1_SignerMerkle_id_fk" FOREIGN KEY ("signer_1") REFERENCES "public"."SignerMerkle"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PoolKey" ADD CONSTRAINT "PoolKey_signer_2_SignerMerkle_id_fk" FOREIGN KEY ("signer_2") REFERENCES "public"."SignerMerkle"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "Pool_job_id_unique" ON "Pool" USING btree ("job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "Pool_public_key_unique" ON "Pool" USING btree ("public_key");--> statement-breakpoint
CREATE UNIQUE INDEX "SignerMerkle_public_key_unique" ON "SignerMerkle" USING btree ("public_key");