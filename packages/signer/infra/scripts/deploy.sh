#!/usr/bin/env bash
# Usage: ./deploy.sh --target zeko-testnet [--image-ref ...]
# Runs rebuild-host.sh inside a Docker container with nix pre-installed.
# Copies SSH keys into a temp dir so nix tools can write temp files.
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

DOCKER_TTY_FLAGS="-i"
if [ -t 0 ]; then
  DOCKER_TTY_FLAGS="-it"
fi

IMAGE_ID="$(docker build -q -f "$SCRIPT_DIR/../Dockerfile.deploy" "$SCRIPT_DIR/..")"

# Copy SSH directory so the container can write temp files under ~/.ssh.
SSH_TMPDIR="$(mktemp -d)"
trap 'rm -rf "$SSH_TMPDIR"' EXIT
cp -a "$HOME/.ssh/." "$SSH_TMPDIR/"

# shellcheck disable=SC2086
docker run --rm $DOCKER_TTY_FLAGS \
  --entrypoint "" \
  -v "$REPO_ROOT:/workspace" \
  -v "$SSH_TMPDIR:/root/.ssh" \
  -w /workspace \
  "$IMAGE_ID" \
  bash /workspace/packages/signer/infra/scripts/rebuild-host.sh "$@"
