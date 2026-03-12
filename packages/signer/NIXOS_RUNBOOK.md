# Lumina Signer NixOS Runbook

This runbook is intentionally split in two:

- operator preparation: the minimum local setup a human must do
- agent rollout: the concrete steps the agent runs once the shell is ready

## Operator Preparation

The operator prepares the workstation once, then the agent takes over.

### 1. Install the required local tools

Have these available in the operator shell:

- `ssh`
- `scp`
- `curl`
- `jq`
- `nix`
- `nixos-anywhere`
- `nixos-rebuild`

### 2. Install Debian 12 on the new Hetzner server

The target host starts as plain Debian 12 with SSH enabled.

### 3. Create one SSH alias per host

The alias should only describe how to reach the box. Do not hardcode a user in the alias. The
agent scripts switch between `root` for bootstrap and `lumina-admin` after NixOS is installed.

```sshconfig
Host lumina_signer_zeko_testnet
  HostName <zeko-testnet-ip>
  Port 22
  IdentityFile ~/.ssh/lumina_signer_zeko_testnet
  IdentitiesOnly yes
```

Repeat for:

- `lumina_signer_mina_mainnet`
- `lumina_signer_zeko_mainnet`

### 4. Fill the local fleet env file

```bash
cp packages/signer/infra/scripts/signer-fleet.env.example packages/signer/infra/scripts/signer-fleet.env
```

Set:

- the final hostname for each target
- the server IPv4 for each target
- the SSH alias for each target
- the local path to each runtime secrets file
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ZONE_NAME`
- `SIGNER_IMAGE_REF` with the image digest that already exists in GHCR

### 5. Create the runtime secrets file locally

Create one local file per target. The agent uploads it to `/var/lib/lumina-signer/env`.

Required contents:

- `DATABASE_URL`
- `INFISICAL_ENVIRONMENT`
- `INFISICAL_PROJECT_ID`
- `INFISICAL_CLIENT_ID`
- `INFISICAL_CLIENT_SECRET`

## Agent Rollout

Once the operator preparation is complete, the agent runs the rollout.

### Preferred path

The preferred agent path is the helper script:

```bash
packages/signer/infra/scripts/rollout-host.sh --target zeko-testnet
```

Use `mina-mainnet` or `zeko-mainnet` for the production hosts.

If the helper fails at any point, the agent must continue by following the manual step breakdown
below. The manual steps are the source of truth for debugging and recovery.

### Manual step breakdown

### 1. Validate the local operator setup

```bash
packages/signer/infra/scripts/validate-local-setup.sh --target zeko-testnet
```

### 2. Create or update the Cloudflare DNS record

```bash
ZONE_ID="$(curl -fsS "https://api.cloudflare.com/client/v4/zones?name=${CLOUDFLARE_ZONE_NAME}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H 'Content-Type: application/json' | jq -r '.result[0].id')"

RECORD_ID="$(curl -fsS "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=A&name=${ZEKO_TESTNET_HOSTNAME}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H 'Content-Type: application/json' | jq -r '.result[0].id // empty')"

PAYLOAD="$(jq -cn \
  --arg type A \
  --arg name "${ZEKO_TESTNET_HOSTNAME}" \
  --arg content "${ZEKO_TESTNET_SERVER_IP}" \
  '{type: $type, name: $name, content: $content, proxied: true, ttl: 1}')"

if [[ -n "${RECORD_ID}" ]]; then
  curl -fsS -X PUT "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${RECORD_ID}" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H 'Content-Type: application/json' \
    --data "${PAYLOAD}"
else
  curl -fsS -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H 'Content-Type: application/json' \
    --data "${PAYLOAD}"
fi
```

### 3. Install NixOS if the host is still on Debian

The generated hardware file stays gitignored under `packages/signer/infra/nixos/hosts/generated/`.

```bash
mkdir -p packages/signer/infra/nixos/hosts/generated

LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY="$(ssh-keygen -y -f "$(ssh -G lumina_signer_zeko_testnet | awk '/^identityfile / { print $2; exit }')")" \
LUMINA_SIGNER_IMAGE_REF="${SIGNER_IMAGE_REF}" \
nixos-anywhere \
  --generate-hardware-config \
  nixos-generate-config \
  packages/signer/infra/nixos/hosts/generated/zeko-testnet-signer-hardware.nix \
  --flake "path:./packages/signer/infra/nixos#zeko-testnet-signer" \
  --target-host root@lumina_signer_zeko_testnet
```

Skip this step if `ssh lumina-admin@lumina_signer_zeko_testnet 'source /etc/os-release && echo "$ID"'`
already returns `nixos`.

### 4. Upload the runtime secrets file

```bash
scp "${ZEKO_TESTNET_RUNTIME_ENV_FILE}" lumina-admin@lumina_signer_zeko_testnet:/tmp/lumina-signer-env
ssh lumina-admin@lumina_signer_zeko_testnet \
  'sudo install -d -m 700 -o root -g root /var/lib/lumina-signer && \
   sudo install -m 600 -o root -g root /tmp/lumina-signer-env /var/lib/lumina-signer/env && \
   rm -f /tmp/lumina-signer-env'
```

### 5. Apply the signer host config

```bash
packages/signer/infra/scripts/rebuild-host.sh --target zeko-testnet --image-ref "${SIGNER_IMAGE_REF}"
```

### 6. Verify the host

```bash
packages/signer/infra/scripts/check-host.sh --target zeko-testnet --path /graphql
```

## CI / Automation

- [signer-image.yml](/Users/hebilicious/GitHub/lumina/monorepo/.github/workflows/signer-image.yml) builds and publishes the signer image digest to GHCR
- [signer-deploy-testnet.yml](/Users/hebilicious/GitHub/lumina/monorepo/.github/workflows/signer-deploy-testnet.yml) auto-deploys that digest to `zeko-testnet`
- [signer-promote.yml](/Users/hebilicious/GitHub/lumina/monorepo/.github/workflows/signer-promote.yml) manually promotes an approved digest to `mina-mainnet` or `zeko-mainnet`

Normal CI deploys do not upload runtime secrets or touch Cloudflare. Those stay in the first-time
agent rollout flow only.
