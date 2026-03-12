#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

STUB_BIN="$TMP_DIR/bin"
mkdir -p "$STUB_BIN"

cat >"$STUB_BIN/curl" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF

cat >"$STUB_BIN/jq" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF

cat >"$STUB_BIN/nixos-anywhere" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF

cat >"$STUB_BIN/nixos-rebuild" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF

cat >"$STUB_BIN/scp" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF

cat >"$STUB_BIN/ssh" <<EOF
#!/usr/bin/env bash
if [[ "\${1:-}" == "-G" ]]; then
  cat <<CFG
hostname 203.0.113.10
identityfile $TMP_DIR/test-key
CFG
  exit 0
fi
exit 0
EOF

chmod +x "$STUB_BIN/curl" "$STUB_BIN/jq" "$STUB_BIN/nixos-anywhere" \
  "$STUB_BIN/nixos-rebuild" "$STUB_BIN/scp" "$STUB_BIN/ssh"

ssh-keygen -q -t ed25519 -N '' -f "$TMP_DIR/test-key" >/dev/null

cat >"$TMP_DIR/signer-fleet.env" <<'EOF'
CLOUDFLARE_API_TOKEN="test-token"
CLOUDFLARE_ZONE_NAME="luminadex.com"
SIGNER_IMAGE_REF="ghcr.io/lumina-dex/lumina-signer@sha256:test"
ZEKO_TESTNET_HOSTNAME="zeko-testnet.signer.luminadex.com"
ZEKO_TESTNET_SERVER_IP="203.0.113.10"
ZEKO_TESTNET_SSH_ALIAS="lumina_signer_zeko_testnet"
ZEKO_TESTNET_RUNTIME_ENV_FILE="/tmp/placeholder"
EOF

cat >"$TMP_DIR/incomplete.env" <<'EOF'
DATABASE_URL=postgresql://example
INFISICAL_ENVIRONMENT=dev
INFISICAL_PROJECT_ID=dummy
INFISICAL_CLIENT_ID=dummy
EOF

cat >"$TMP_DIR/complete.env" <<'EOF'
DATABASE_URL=postgresql://example
INFISICAL_ENVIRONMENT=dev
INFISICAL_PROJECT_ID=dummy
INFISICAL_CLIENT_ID=dummy
INFISICAL_CLIENT_SECRET=dummy
EOF

run_expect_fail() {
  local expected="$1"
  shift
  local output_file="$TMP_DIR/output.log"

  if "$@" >"$output_file" 2>&1; then
    echo "expected failure but command succeeded: $*" >&2
    cat "$output_file" >&2
    exit 1
  fi

  grep -q "$expected" "$output_file" || {
    echo "expected to find '$expected' in output" >&2
    cat "$output_file" >&2
    exit 1
  }
}

run_expect_success() {
  local output_file="$TMP_DIR/output.log"

  "$@" >"$output_file" 2>&1 || {
    echo "expected success but command failed: $*" >&2
    cat "$output_file" >&2
    exit 1
  }
}

COMMON_ENV=(
  env
  "PATH=$STUB_BIN:/usr/bin:/bin"
  "SIGNER_FLEET_ENV_FILE=$TMP_DIR/signer-fleet.env"
)

run_expect_fail "Missing required key INFISICAL_CLIENT_SECRET" \
  "${COMMON_ENV[@]}" \
  "$SCRIPT_DIR/validate-local-setup.sh" \
  --target zeko-testnet \
  --runtime-env-file "$TMP_DIR/incomplete.env"

run_expect_success \
  "${COMMON_ENV[@]}" \
  "$SCRIPT_DIR/validate-local-setup.sh" \
  --target zeko-testnet \
  --runtime-env-file "$TMP_DIR/complete.env"

run_expect_fail "Missing required key INFISICAL_CLIENT_SECRET" \
  "${COMMON_ENV[@]}" \
  "$SCRIPT_DIR/rollout-host.sh" \
  --target zeko-testnet \
  --runtime-env-file "$TMP_DIR/incomplete.env" \
  --skip-dns

printf 'helper script checks passed\n'
