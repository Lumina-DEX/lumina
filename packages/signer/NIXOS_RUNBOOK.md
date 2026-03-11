# Lumina Signer NixOS Runbook

> [!WARNING]
> Before running any signer infra script, set `LEGACY_SIGNER_BLOCKLIST` in
> `packages/signer/infra/scripts/signer-fleet.env` so it includes the current live legacy signer
> host IP or hostname plus any legacy aliases you want blocked. The scripts fail closed until this
> is set.

This runbook is split into:

- operator steps: commands a human runs from a workstation
- agent steps: commands CI or a separate automation can run once the host exists

## Operator Steps

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

- `LEGACY_SIGNER_BLOCKLIST`
- the target hostnames and IPs
- the single SSH alias per host
- Cloudflare token and zone

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

### 7. Apply the smoke host config

This intentionally deploys a plain webserver image, not the signer app:

```bash
packages/signer/infra/scripts/rebuild-smoke-host.sh --target zeko-testnet
```

### 8. Create the Cloudflare DNS record

Use the API, not the dashboard:

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

### 9. Verify the smoke host

```bash
packages/signer/infra/scripts/check-smoke-host.sh --target zeko-testnet
```

### 10. Bootstrap signer rows directly in Postgres

Prepare a payload file:

```json
{
  "signers": [
    { "publicKey": "B62...", "permission": 1, "active": true }
  ]
}
```

Then run:

```bash
DATABASE_URL='postgresql://...' \
packages/signer/infra/scripts/bootstrap-signers.sh \
  --target zeko-testnet \
  --payload /absolute/path/to/zeko-testnet-signers.json
```

This writes `SignerMerkle` and `SignerMerkleNetwork` rows directly in Postgres and verifies them
with a readback query.

## Agent Steps

These are the only steps meant for CI or another automation:

### Build the signer image

Use [signer-image.yml](/Users/hebilicious/GitHub/lumina/monorepo/.github/workflows/signer-image.yml) to
test, build, and publish `ghcr.io/lumina-dex/lumina-signer`.

### Re-apply the smoke host config

Use [signer-deploy-testnet.yml](/Users/hebilicious/GitHub/lumina/monorepo/.github/workflows/signer-deploy-testnet.yml)
for zeko testnet and [signer-promote.yml](/Users/hebilicious/GitHub/lumina/monorepo/.github/workflows/signer-promote.yml)
for manual production smoke deploys.

Those workflows:

- install Nix on the runner
- rebuild the target host config declaratively
- deploy the smoke webserver image
- run the simple HTTPS smoke check

They do not bootstrap signers, mutate the database, or touch Cloudflare.
