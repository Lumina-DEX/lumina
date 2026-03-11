# Lumina Signer NixOS Runbook

> [!WARNING]
> Never run `nixos-anywhere`, `bootstrap-signers.sh`, `deploy-image-over-ssh.sh`, or any bootstrap command against the legacy live signer host at `157.180.50.185` or the aliases `lumina_root`, `lumina`, `dokku_lumina`.

This runbook is only for new signer hosts:

- `zeko-testnet.signer.luminadex.com`
- `mina-mainnet.signer.luminadex.com`
- `zeko-mainnet.signer.luminadex.com`

Use these host mappings:

| Target | NixOS config | Root alias | Admin alias | Service alias |
| --- | --- | --- | --- | --- |
| `zeko-testnet` | `infra/nixos#zeko-testnet-signer` | `lumina_signer_zeko_testnet_root` | `lumina_signer_zeko_testnet_admin` | `lumina_signer_zeko_testnet_service` |
| `mina-mainnet` | `infra/nixos#mina-mainnet-signer` | `lumina_signer_mina_mainnet_root` | `lumina_signer_mina_mainnet_admin` | `lumina_signer_mina_mainnet_service` |
| `zeko-mainnet` | `infra/nixos#zeko-mainnet-signer` | `lumina_signer_zeko_mainnet_root` | `lumina_signer_zeko_mainnet_admin` | `lumina_signer_zeko_mainnet_service` |

## 1. Buy Hetzner server

Provision a new Hetzner Dedicated Root server for the target environment. Record the public IPv4 address for the new server in `packages/signer/scripts/ops/signer-fleet.env`.

## 2. Install Debian 12 base

Install plain Debian 12 as the temporary bootstrap OS. Do not install Dokku. Ensure OpenSSH is enabled.

## 3. Add operator SSH key and create local SSH aliases

Add the operator public key to Debian root, then define all three aliases locally in `~/.ssh/config`:

```sshconfig
Host lumina_signer_zeko_testnet_root
  HostName <zeko-testnet-ip>
  User root
  Port 22
  IdentityFile ~/.ssh/lumina_signer_zeko_testnet

Host lumina_signer_zeko_testnet_admin
  HostName <zeko-testnet-ip>
  User lumina-admin
  Port 22
  IdentityFile ~/.ssh/lumina_signer_zeko_testnet

Host lumina_signer_zeko_testnet_service
  HostName <zeko-testnet-ip>
  User lumina-signer-service
  Port 22
  IdentityFile ~/.ssh/lumina_signer_zeko_testnet_service
```

Repeat that pattern for `mina-mainnet` and `zeko-mainnet`.

Before installation, place the public keys that NixOS should install at:

- `infra/nixos/hosts/keys/zeko-testnet-admin.pub`
- `infra/nixos/hosts/keys/zeko-testnet-service.pub`
- `infra/nixos/hosts/keys/mina-mainnet-admin.pub`
- `infra/nixos/hosts/keys/mina-mainnet-service.pub`
- `infra/nixos/hosts/keys/zeko-mainnet-admin.pub`
- `infra/nixos/hosts/keys/zeko-mainnet-service.pub`

## 4. Fill local env file from signer-fleet.env.example

Create the operator env file and fill in Cloudflare plus server IP values:

```bash
cp packages/signer/scripts/ops/signer-fleet.env.example packages/signer/scripts/ops/signer-fleet.env
```

## 5. Run local preflight audit

Run the preflight audit before any NixOS install:

```bash
packages/signer/scripts/ops/audit-signer-fleet.sh --preflight-only --target zeko-testnet
```

Swap the target for `mina-mainnet` or `zeko-mainnet` as needed.

## 6. Run nixos-anywhere against the new server only

Generate and store the hardware file for the target, then run `nixos-anywhere` only against the matching `_root` alias:

```bash
mkdir -p infra/nixos/hosts/generated
nixos-anywhere \
  --generate-hardware-config nixos-generate-config infra/nixos/hosts/generated/zeko-testnet-signer-hardware.nix \
  --flake ./infra/nixos#zeko-testnet-signer \
  --target-host lumina_signer_zeko_testnet_root
```

Do not point this command at any legacy alias or `157.180.50.185`.

## 7. Apply NixOS host config from repo

After the first install, verify the host switched to NixOS and apply the repo flake again through the admin alias:

```bash
ssh lumina_signer_zeko_testnet_admin 'grep -E "^ID=nixos$" /etc/os-release'
ssh lumina_signer_zeko_testnet_admin 'sudo nixos-rebuild switch --flake /etc/nixos#zeko-testnet-signer'
```

If you manage `/etc/nixos` from a checkout elsewhere on the host, use that path instead of `/etc/nixos`.

## 8. Create `/var/lib/lumina-signer/env` on the host

Create the runtime env file on the host. It must stay on the server, mode `0600`, owned by `root:root`.

```bash
ssh lumina_signer_zeko_testnet_admin 'sudo install -d -m 0750 -o root -g root /var/lib/lumina-signer'
ssh lumina_signer_zeko_testnet_admin 'sudo sh -c "cat > /var/lib/lumina-signer/env"' <<'EOF'
DATABASE_URL=postgresql://...
INFISICAL_ENVIRONMENT=...
INFISICAL_PROJECT_ID=...
INFISICAL_CLIENT_ID=...
INFISICAL_CLIENT_SECRET=...
EOF
ssh lumina_signer_zeko_testnet_admin 'sudo chmod 0600 /var/lib/lumina-signer/env && sudo chown root:root /var/lib/lumina-signer/env'
```

## 9. Create or update Cloudflare DNS record

Use the Cloudflare API, not the dashboard. Example for testnet:

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

If the record already exists, update it with the record ID instead of creating a duplicate.

## 10. Deploy first image digest

Deploy by immutable digest only:

```bash
packages/signer/scripts/ops/deploy-image-over-ssh.sh \
  --target zeko-testnet \
  --image-digest sha256:<image-digest> \
  --git-sha <git-sha>
```

This writes `/var/lib/lumina-signer/release.env`, restarts `lumina-signer`, and verifies HTTPS.

## 11. Bootstrap signer permissions

Prepare a target-specific payload file:

```json
{
  "signers": [
    { "publicKey": "B62...", "permission": 1, "active": true }
  ]
}
```

Then run:

```bash
SIGNER_API_KEY=<admin-api-key> \
packages/signer/scripts/ops/bootstrap-signers.sh \
  --target zeko-testnet \
  --payload /absolute/path/to/zeko-testnet-signers.json
```

The script uses GraphQL admin mutations against `https://<hostname>/graphql`, creates missing signers, adds or updates network permissions, and verifies final state.

## 12. Run final full audit

Finish with the full end-to-end audit:

```bash
packages/signer/scripts/ops/audit-signer-fleet.sh --full --target zeko-testnet
```

When this passes, the host is ready for normal digest-based releases through CI.
