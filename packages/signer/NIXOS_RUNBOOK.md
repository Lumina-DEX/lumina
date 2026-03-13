# Lumina Signer NixOS Runbook

Use this runbook either:

- as a human operator doing every step manually
- as an agent driving the shell, with explicit pauses to ask the operator for inputs only when needed

> [!WARNING]
> This rollout is only for new NixOS signer hosts.
> Do not run it against the existing legacy Dokku signer host.

## 1. Prepare the local workstation

Required local tools:

- `ssh`
- `scp`
- `curl`
- `jq`
- `gh`
- `docker`

Agent note:
Prefer a containerized Nix toolchain so the operator machine does not need a host-level Nix install.

## 2. Generate SSH keypairs

Create two keypairs per host: one for the human operator, one dedicated for CI.

```bash
# Operator key (for lumina-admin SSH access)
ssh-keygen -t ed25519 -f ~/.ssh/lumina_signer_zeko_testnet -N '' -C 'lumina_signer_zeko_testnet'

# CI key (for GitHub Actions — do NOT reuse the operator key)
ssh-keygen -t ed25519 -f ~/.ssh/lumina_ci_zeko_testnet -N '' -C 'lumina_ci_zeko_testnet'
```

Repeat for each additional host:

- `lumina_signer_mina_mainnet` / `lumina_ci_mina_mainnet`
- `lumina_signer_zeko_mainnet` / `lumina_ci_zeko_mainnet`

## 3. Add the operator SSH public key in Hetzner Robot

Do not have the agent read the public key file directly. Print it locally yourself:

```bash
cat ~/.ssh/lumina_signer_zeko_testnet.pub
```

In Hetzner Robot:

1. Open `Key`
2. Add a new SSH key
3. Paste the printed public key

Agent note:
Ask the operator to do the Hetzner Robot UI step and confirm when it is complete.

## 4. Install Debian 12 from Hetzner Robot

In Hetzner Robot:

1. Open the target server under `Server`
2. Open the `Linux` tab
3. Select `Debian 12`
4. **Check the SSH key checkbox** next to the operator key uploaded in step 3.
   If this checkbox is skipped, Hetzner will use a random password instead of your SSH key
   and the bootstrap SSH login in step 6 will fail.
5. Start the install

After the install completes:

1. Open `Reset`
2. Click `Execute an automatic hardware reset`
3. Wait a few minutes for the new SSH login to become available

Agent note:
Ask the operator to do the Robot install and reset flow, then continue once the operator confirms it is done.

## 5. Create the local SSH alias

Add one alias per host to `~/.ssh/config`.

Bootstrap aliases must not hardcode a user. The login user is chosen at command time:

- use `root@alias` before NixOS is installed
- use `lumina-admin@alias` after NixOS is installed

Example:

```sshconfig
Host lumina_signer_zeko_testnet
  HostName <zeko-testnet-ip>
  Port 22
  IdentityFile ~/.ssh/lumina_signer_zeko_testnet
  IdentitiesOnly yes
```

Repeat for each host.

## 6. Verify bootstrap SSH access

Clear any stale host keys from previous installs, then verify:

```bash
ssh-keygen -R <server-ip>
ssh -o StrictHostKeyChecking=accept-new root@lumina_signer_zeko_testnet 'source /etc/os-release && echo "$ID $VERSION_ID"'
```

Expected output: `debian 12`

## 7. Local fleet env file

You should find a fleet env file under `packages/signer/infra/scripts/`.

If it doesn't exist, you can create one like so:

```bash
cp packages/signer/infra/scripts/signer-fleet.env.example \
  packages/signer/infra/scripts/signer-fleet.env
```

The `*_CI_KEY_FILE` paths are pre-filled from the keypair names in step 2 and do not need to be changed unless you used different filenames.

Agent note:
If you created the env file, ask the operator to fill the real secret values before continuing.

## 8. Local runtime secrets file

For a given environment, you should find a corresponding secrets file under `packages/signer/infra/secrets/`.
If the env file does not exist, you can create one like so :

```bash
cat > packages/signer/infra/secrets/zeko-testnet-signer.env <<'EOF'
DATABASE_URL=replace-me
INFISICAL_ENVIRONMENT=replace-me
INFISICAL_PROJECT_ID=replace-me
INFISICAL_CLIENT_ID=replace-me
INFISICAL_CLIENT_SECRET=replace-me
EOF
chmod 600 packages/signer/infra/secrets/zeko-testnet-signer.env
```

These values stay local and are uploaded to `/var/lib/lumina-signer/env` on the host.

Agent note:
If you created the env file, ask the operator to fill the real secret values before continuing.

## 9. Validate all secrets upfront

Run this before touching any infrastructure. It normalizes the env file (strips any quoted values
that would break `podman --env-file`) and tests Infisical authentication live:

```bash
# For zeko-testnet
cd packages/signer && pnpm tsx scripts/validate-infisical.ts infra/secrets/zeko-testnet-signer.env
```

If this fails, fix the credentials before continuing. Do not proceed past this step with broken secrets.
Then, run the validate-local-setup.sh script to ensure your local environment is ready:

```bash
bash packages/signer/infra/scripts/validate-local-setup.sh --target zeko-testnet
```

If this fails, fix any issues before proceeding.

## 10. Install NixOS via nixos-anywhere

Hardware configuration is provided by `lumina-hetzner-ax41.nix` and `lumina-disko.nix` — no
generated hardware file is needed.

Run from inside the Nix toolbox container. `$LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY` and
`$LUMINA_SIGNER_CI_AUTHORIZED_KEY` must already be set (injected via `-e` in step 10).

Write a script then run it — do not use heredoc piping into docker:

Write the script to the monorepo root (outside Docker), then run the container non-interactively:

```bash
# From the monorepo root, on the host machine
cat > nixos-install.sh << 'SCRIPT'
#!/bin/sh
set -e
LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY="${LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY}" \
LUMINA_SIGNER_CI_AUTHORIZED_KEY="${LUMINA_SIGNER_CI_AUTHORIZED_KEY}" \
nix --extra-experimental-features "nix-command flakes" run github:nix-community/nixos-anywhere -- \
  --build-on remote \
  --option pure-eval false \
  --flake "path:./packages/signer/infra/nixos#zeko-testnet-signer" \
  --target-host root@lumina_signer_zeko_testnet
SCRIPT

ADMIN_KEY="$(cat ~/.ssh/lumina_signer_zeko_testnet.pub)"
CI_KEY="$(cat ~/.ssh/lumina_ci_zeko_testnet.pub)"

docker run --rm -i \
  -v "$PWD:/work" \
  -v "$HOME/.ssh/lumina_signer_zeko_testnet:/root/.ssh/id_ed25519:ro" \
  -v "$HOME/.ssh/known_hosts:/root/.ssh/known_hosts" \
  -e LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY="$ADMIN_KEY" \
  -e LUMINA_SIGNER_CI_AUTHORIZED_KEY="$CI_KEY" \
  -w /work \
  nixos/nix:2.24.14 sh nixos-install.sh

rm nixos-install.sh
```

**Why `--build-on remote`:** The operator machine may be aarch64 (Apple Silicon). nixos-anywhere
with `--build-on remote` evaluates the Nix expression locally (reading env vars) but compiles
derivations on the target x86_64 host. Without this flag, the build fails on aarch64 with
`required system: 'x86_64-linux'`.

**Why `--option pure-eval false`:** Nix flakes evaluate in pure mode by default, which blocks
`builtins.getEnv`. The NixOS config reads `LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY` and
`LUMINA_SIGNER_CI_AUTHORIZED_KEY` to populate `lumina-admin`'s `openssh.authorizedKeys`. Without
this flag those env vars evaluate to `""` and `lumina-admin` ends up locked out.
Note: `--impure` is NOT equivalent here — it does not override `pure-eval` for flake evaluation
in the Nix version used by the container (`nixos/nix:2.24.14`).

Skip this step if:

```bash
ssh lumina-admin@lumina_signer_zeko_testnet 'source /etc/os-release && echo "$ID"'
```

already returns `nixos`.

After nixos-anywhere completes, clear the stale host key and verify from the host machine (not inside the container):

```bash
source packages/signer/infra/scripts/signer-fleet.env
ssh-keygen -R "${ZEKO_TESTNET_SERVER_IP}"
ssh -o StrictHostKeyChecking=accept-new lumina-admin@lumina_signer_zeko_testnet \
  'source /etc/os-release && echo "$ID"'
```

Expected: `nixos`

## 11. Upload the runtime secrets

The signer service requires **two** files under `/var/lib/lumina-signer/`:

- `env` — Infisical credentials and database URL
- `release.env` — image metadata (`IMAGE_REF`, `GIT_SHA`, `RELEASED_AT`)

Run from the host machine (not inside the container):

```bash
source packages/signer/infra/scripts/signer-fleet.env

# Upload runtime secrets
scp "${ZEKO_TESTNET_RUNTIME_ENV_FILE}" lumina-admin@lumina_signer_zeko_testnet:/tmp/lumina-signer-env
ssh lumina-admin@lumina_signer_zeko_testnet \
  'sudo install -d -m 700 -o root -g root /var/lib/lumina-signer && \
   sudo install -m 600 -o root -g root /tmp/lumina-signer-env /var/lib/lumina-signer/env && \
   rm -f /tmp/lumina-signer-env'

# Upload release metadata
RELEASE_ENV="$(mktemp)"
cat >"${RELEASE_ENV}" <<EOF
IMAGE_REF=${SIGNER_IMAGE_REF}
GIT_SHA=$(git rev-parse HEAD)
RELEASED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF
scp "${RELEASE_ENV}" lumina-admin@lumina_signer_zeko_testnet:/tmp/lumina-signer-release.env
rm -f "${RELEASE_ENV}"
ssh lumina-admin@lumina_signer_zeko_testnet \
  'sudo install -m 600 -o root -g root /tmp/lumina-signer-release.env /var/lib/lumina-signer/release.env && \
   rm -f /tmp/lumina-signer-release.env'
```

> [!NOTE]
> The `lumina-signer` systemd `ExecCondition` checks that **both** files are non-empty (`test -s`).
> If either is missing the service will not start. On subsequent deploys `rebuild-host.sh` writes
> `release.env` automatically.

## 12. Start the service and verify

```bash
ssh lumina-admin@lumina_signer_zeko_testnet 'sudo systemctl restart lumina-signer'
sleep 30
packages/signer/infra/scripts/check-host.sh --target zeko-testnet --path /graphql
```

## 13. Configure GitHub Actions environment secrets

After the host is bootstrapped and reachable, create the `signer-zeko-testnet` GitHub Actions
environment with the **CI key** (not the operator key):

```bash
source packages/signer/infra/scripts/signer-fleet.env

gh secret set SSH_HOST --env signer-zeko-testnet --body "${ZEKO_TESTNET_SERVER_IP}"
gh secret set SSH_PORT --env signer-zeko-testnet --body "22"
gh secret set SSH_USER --env signer-zeko-testnet --body "lumina-admin"
gh secret set TARGET_HOSTNAME --env signer-zeko-testnet --body "${ZEKO_TESTNET_HOSTNAME}"
gh secret set SSH_PRIVATE_KEY --env signer-zeko-testnet < ~/.ssh/lumina_ci_zeko_testnet
# Scan the server IP directly — the hostname resolves to Cloudflare's edge when proxied
ssh-keyscan -H "${ZEKO_TESTNET_SERVER_IP}" 2>/dev/null | gh secret set SSH_KNOWN_HOSTS --env signer-zeko-testnet
```

> [!NOTE]
> `SSH_KNOWN_HOSTS` must be updated after every OS reinstall because the host SSH fingerprint changes.

## CI workflows

- [signer-image.yml](../../.github/workflows/signer-image.yml)
- [signer-deploy-testnet.yml](../../.github/workflows/signer-deploy-testnet.yml)
- [signer-promote.yml](../../.github/workflows/signer-promote.yml)

Normal CI deploys do not upload runtime secrets, mutate Cloudflare, or regenerate keypairs.
Those are first-time rollout steps only.

---

## Troubleshooting

### nixos-anywhere completes but lumina-admin cannot SSH in

**Cause:** `--option pure-eval false` was missing (or replaced with `--impure`, which is not
equivalent). The NixOS config read `builtins.getEnv "LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY"` as `""`
and `lumina-admin.openssh.authorizedKeys.keys` was empty.

**Fix:** Re-run nixos-anywhere with `--option pure-eval false` and both key env vars set. Then verify SSH access.

### ssh-copy-id fails with "Read-only file system" inside container

**Cause:** The SSH identity key is mounted with `:ro`. nixos-anywhere internally runs `ssh-copy-id`
which creates a temp dir inside `~/.ssh`.

**Fix:** The `known_hosts` volume is mounted read-write so `ssh-copy-id` can write to `~/.ssh`.
If you still see errors, verify both volume mounts in step 10 are present.

### Service stays inactive after secrets are uploaded

**Cause:** The systemd `ExecCondition` runs at start time. If the service was started before
the secrets files were placed, it will remain inactive.

**Fix:** `sudo systemctl restart lumina-signer`

### Caddy fails to obtain Let's Encrypt certificate

**Cause:** The DNS record is `proxied: true` (Cloudflare proxy). Cloudflare terminates TLS at
the edge using the ACM wildcard certificate for `*.signer.luminadex.com`. Caddy's ACME HTTP-01
challenge cannot reach port 80 through the proxy. Caddy should not attempt to manage its own
cert when Cloudflare handles TLS end-to-end.

**Note:** The `rollout-host.sh` script uses `proxied: true`. The Cloudflare ACM wildcard for
`*.signer.luminadex.com` must exist for this to work. If it is missing, request it in the
Cloudflare dashboard → SSL/TLS → Edge Certificates → Advanced Certificate Manager.

**Important:** Caddy uses `tls internal` (self-signed origin cert). The Cloudflare zone SSL/TLS
mode must be set to **Full**, not **Full (Strict)**. Full (Strict) requires a valid origin
certificate and will reject the self-signed cert with a 526 error.

### SSH_KNOWN_HOSTS mismatch in CI after reinstall

**Cause:** The host SSH fingerprint changes every time Debian/NixOS is reinstalled.

**Fix:** Re-run the `ssh-keyscan` line from step 14 to update the GitHub Actions secret.
