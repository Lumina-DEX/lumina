# Lumina Signer NixOS Runbook

> [!WARNING]
> Before running any signer infra script, set `LEGACY_SIGNER_HOST` or `LEGACY_SIGNER_IP` in
> `packages/signer/infra/scripts/signer-fleet.env`. The scripts refuse to touch `lumina_root`,
> `lumina`, `dokku_lumina`, or the configured legacy host.

This runbook is split into:

- operator preparation: things a human sets up locally before asking the agent to proceed
- agent rollout: the steps the agent follows once the local shell environment is ready

## Operator Preparation

### 1. Buy the Hetzner server

Provision a new Hetzner Dedicated Root server for one of:

- `zeko-testnet.signer.luminadex.com`
- `mina-mainnet.signer.luminadex.com`
- `zeko-mainnet.signer.luminadex.com`

Record the public IPv4 address for the target host.

### 2. Install Debian 12 base

Install plain Debian 12 as the temporary bootstrap OS. Do not install Dokku. Keep SSH enabled.

### 3. Create one local SSH alias per host

Use one alias per host. Start with `User root` during bootstrap, then switch the same alias to
`User lumina-admin` after NixOS is installed.

```sshconfig
Host lumina_signer_zeko_testnet
  HostName <zeko-testnet-ip>
  User root
  Port 22
  IdentityFile ~/.ssh/lumina_signer_zeko_testnet
```

Repeat for `lumina_signer_mina_mainnet` and `lumina_signer_zeko_mainnet`.

### 4. Fill the local env file

```bash
cp packages/signer/infra/scripts/signer-fleet.env.example packages/signer/infra/scripts/signer-fleet.env
```

Set:

- `LEGACY_SIGNER_HOST` or `LEGACY_SIGNER_IP`
- the target hostnames and IPs
- the single SSH alias per host
- Cloudflare token and zone
- `SIGNER_IMAGE_REF` with the first signer image digest you intend to deploy

### 5. Put the admin SSH public keys in the repo-local ignored directory

Store the operator public keys here:

- `packages/signer/infra/nixos/hosts/keys/zeko-testnet-admin.pub`
- `packages/signer/infra/nixos/hosts/keys/mina-mainnet-admin.pub`
- `packages/signer/infra/nixos/hosts/keys/zeko-mainnet-admin.pub`

### 6. Run `nixos-anywhere` against the new host only

Generate the hardware file and install NixOS:

```bash
mkdir -p packages/signer/infra/nixos/hosts/generated
nixos-anywhere \
  --generate-hardware-config \
  nixos-generate-config \
  packages/signer/infra/nixos/hosts/generated/zeko-testnet-signer-hardware.nix \
  --flake ./packages/signer/infra/nixos#zeko-testnet-signer \
  --target-host lumina_signer_zeko_testnet
```

After the install finishes, change the SSH alias to `User lumina-admin`.

## Agent Rollout

After the operator preparation is complete, the agent runs the remaining steps.

### 1. Install NixOS with `nixos-anywhere`

Generate the hardware file and install NixOS:

```bash
nixos-anywhere \
  --generate-hardware-config \
  nixos-generate-config \
  packages/signer/infra/nixos/hosts/generated/zeko-testnet-signer-hardware.nix \
  --flake ./packages/signer/infra/nixos#zeko-testnet-signer \
  --target-host lumina_signer_zeko_testnet
```

### 2. Create or update the Cloudflare DNS record

```bash
ZONE_ID="$(curl -fsS "https://api.cloudflare.com/client/v4/zones?name=luminadex.com" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H 'Content-Type: application/json' | jq -r '.result[0].id')"

curl -fsS "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H 'Content-Type: application/json' \
  --data "$(jq -cn \
    --arg type A \
    --arg name zeko-testnet.signer.luminadex.com \
    --arg content "${ZEKO_TESTNET_SERVER_IP}" \
    '{type: $type, name: $name, content: $content, proxied: true, ttl: 1}')"
```

If the record already exists, update it instead of creating a duplicate.

### 3. Deploy the signer image digest

```bash
packages/signer/infra/scripts/rebuild-host.sh --target zeko-testnet
```

### 4. Verify the host

```bash
packages/signer/infra/scripts/check-host.sh --target zeko-testnet --path /graphql
```

### 5. Seed signer rows with the existing seed process

Prepare a payload file if the target needs production-specific signers:

```json
{
  "signers": [
    { "publicKey": "B62...", "permission": 1, "active": true }
  ]
}
```

Then run the existing seed entrypoint with the payload:

```bash
DATABASE_URL='postgresql://...' \
SIGNER_SEED_FILE='/absolute/path/to/zeko-testnet-signers.json' \
SIGNER_SEED_TARGET_ENV='zeko-testnet' \
moon signer:db-seed
```

The seed script keeps its existing dev/testnet defaults when those env vars are unset.

## CI / Automation

### Build the signer image

Use [signer-image.yml](/Users/hebilicious/GitHub/lumina/monorepo/.github/workflows/signer-image.yml) to
test, build, and publish `ghcr.io/lumina-dex/lumina-signer`.

### Re-apply the signer host config

Use [signer-deploy-testnet.yml](/Users/hebilicious/GitHub/lumina/monorepo/.github/workflows/signer-deploy-testnet.yml)
for zeko testnet and [signer-promote.yml](/Users/hebilicious/GitHub/lumina/monorepo/.github/workflows/signer-promote.yml)
for manual production deploys.

Those workflows:

- install Nix on the runner
- rebuild the target host config declaratively
- deploy the signer image digest from GHCR
- run a simple HTTPS check against `/graphql`

They do not bootstrap signers, mutate the database, or touch Cloudflare.
