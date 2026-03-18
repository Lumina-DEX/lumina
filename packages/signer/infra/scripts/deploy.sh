#!/usr/bin/env bash
# Usage: deploy.sh --target <env> --image-ref <container-image>
#
# Deploys a new signer container image WITHOUT a full NixOS rebuild.
# This is the normal CI deploy path:
#   1. Uploads release.env with the new IMAGE_REF
#   2. Pre-pulls the image on the remote host
#   3. Restarts the lumina-signer systemd service
#
# Use rebuild-host.sh instead when NixOS config changes (SSH keys,
# modules, system packages) need to be applied.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

TARGET_ENV="${TARGET_ENV:-}"
IMAGE_REF="${IMAGE_REF:-${SIGNER_IMAGE_REF:-}}"

usage() {
	cat <<'EOF'
Usage: deploy.sh --target <env> --image-ref <container-image>

Deploys a new container image to a signer host.
Does NOT run nixos-rebuild — use rebuild-host.sh for NixOS config changes.

Options:
  --target     Target environment (zeko-testnet, mina-mainnet, zeko-mainnet)
  --image-ref  Container image reference (e.g. ghcr.io/lumina-dex/lumina-signer@sha256:...)
EOF
}

parse_args() {
	while [[ $# -gt 0 ]]; do
		case "$1" in
			--target)
				[[ $# -ge 2 ]] || die "--target requires a value"
				TARGET_ENV="$2"
				shift 2
				;;
			--image-ref)
				[[ $# -ge 2 ]] || die "--image-ref requires a value"
				IMAGE_REF="$2"
				shift 2
				;;
			-h | --help)
				usage
				exit 0
				;;
			*)
				die "Unknown argument: $1"
				;;
		esac
	done
}

main() {
	local ssh_target image_ref release_payload
	local -a scp_command

	parse_args "$@"
	maybe_source_env
	IMAGE_REF="${IMAGE_REF:-${SIGNER_IMAGE_REF:-}}"

	require_command scp
	require_command ssh

	[[ -n "$TARGET_ENV" ]] || die "--target is required"
	[[ -n "$IMAGE_REF" ]] || die "--image-ref is required"
	image_ref="$IMAGE_REF"

	# Validate digest format if using @ pinning syntax
	if [[ "$image_ref" == *@* ]]; then
		local digest_part="${image_ref#*@}"
		if [[ ! "$digest_part" =~ ^sha256:[a-f0-9]{64}$ ]]; then
			die "Invalid image reference: '${image_ref}'. Digest after '@' must be sha256:<64 hex chars>."
		fi
	fi

	ssh_target="$(build_ssh_target "$TARGET_ENV" "$(remote_admin_user)")"

	# 1. Upload release.env with the new image reference
	log "Uploading release metadata to ${ssh_target}..."
	release_payload="$(mktemp)"
	cat >"$release_payload" <<EOF
IMAGE_REF=${image_ref}
GIT_SHA=${GIT_SHA:-$(git -C "$(repo_root)" rev-parse HEAD 2>/dev/null || true)}
RELEASED_AT=${RELEASED_AT:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}
EOF

	build_scp_command scp_command
	scp_command+=("$release_payload" "${ssh_target}:/tmp/lumina-signer-release.env")
	"${scp_command[@]}"
	rm -f "$release_payload"

	run_remote_as "$TARGET_ENV" "$(remote_admin_user)" \
		"sudo install -d -m 700 -o root -g root $(remote_state_dir) && \
		sudo install -m 600 -o root -g root /tmp/lumina-signer-release.env $(remote_release_env_path) && \
		rm -f /tmp/lumina-signer-release.env"

	# 2. Pre-pull the image on the remote host
	log "Pre-pulling ${image_ref} on ${ssh_target}..."
	run_remote_as "$TARGET_ENV" "$(remote_admin_user)" \
		"sudo podman pull ${image_ref}" \
		|| die "Pre-pull failed for ${image_ref}. Aborting — old service still running."

	# 3. Stop the old container (30s timeout), then start fresh
	log "Stopping lumina-signer service..."
	run_remote_as "$TARGET_ENV" "$(remote_admin_user)" \
		"sudo systemctl stop lumina-signer || true"

	log "Starting lumina-signer service..."
	run_remote_as "$TARGET_ENV" "$(remote_admin_user)" \
		"sudo systemctl start lumina-signer"

	# 4. Verify it came up
	sleep 5
	run_remote_as "$TARGET_ENV" "$(remote_admin_user)" \
		"systemctl is-active lumina-signer" \
		|| die "lumina-signer failed to start"

	log "Deploy complete for ${TARGET_ENV} with image ${image_ref}"
}

main "$@"
