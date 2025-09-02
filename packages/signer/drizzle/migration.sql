-- 1. Créer la table Networks
CREATE TABLE IF NOT EXISTS "Networks" (
    "id" serial PRIMARY KEY NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "network" text NOT NULL UNIQUE
);

-- 2. Créer la table SignerMerkleNetworks (relation N-N avec permissions par réseau)
CREATE TABLE IF NOT EXISTS "SignerMerkleNetworks" (
    "id" serial PRIMARY KEY NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signer_id" integer NOT NULL,
    "network_id" integer NOT NULL,
    "permission" text NOT NULL CHECK ("permission" IN ('deploy', 'all')),
    "active" boolean NOT NULL DEFAULT true,
    CONSTRAINT "SignerMerkleNetworks_signer_id_fkey"
        FOREIGN KEY ("signer_id") REFERENCES "SignerMerkle"("id") ON DELETE CASCADE,
    CONSTRAINT "SignerMerkleNetworks_network_id_fkey"
        FOREIGN KEY ("network_id") REFERENCES "Networks"("id") ON DELETE CASCADE,
    CONSTRAINT "SignerMerkleNetworks_unique"
        UNIQUE ("signer_id", "network_id") -- un signataire ne peut avoir qu’un set de permissions par réseau
);

-- 3. Modifier la table Pool
-- 3a. Ajouter la colonne network_id
ALTER TABLE "Pool"
    ADD COLUMN "network_id" integer;

-- 3b. Créer la contrainte FK vers Networks
ALTER TABLE "Pool"
    ADD CONSTRAINT "Pool_network_id_fkey"
    FOREIGN KEY ("network_id") REFERENCES "Networks"("id");

-- 3c. Supprimer l’ancienne colonne "network" (enum)
ALTER TABLE "Pool"
    DROP COLUMN "network";
