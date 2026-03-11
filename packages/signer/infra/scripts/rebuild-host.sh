#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

TARGET_ENV="${TARGET_ENV:-}"
IMAGE_REF="${IMAGE_REF:-${SIGNER_IMAGE_REF:-}}"
CONTAINER_PORT="${CONTAINER_PORT:-}"
ENV_FILE_PATH="${ENV_FILE_PATH:-}"

usage() {
	cat <<'EOF'
Usage: rebuild-host.sh --target <env> [--image-ref <container-image>] [--container-port <port>] [--env-file <path>]
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
			--container-port)
				[[ $# -ge 2 ]] || die "--container-port requires a value"
				CONTAINER_PORT="$2"
				shift 2
				;;
			--env-file)
				[[ $# -ge 2 ]] || die "--env-file requires a value"
				ENV_FILE_PATH="$2"
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
	local hostname ssh_target flake_dir image_ref ssh_public_key

	parse_args "$@"
	maybe_source_env

	require_command nixos-rebuild
	require_command ssh

	[[ -n "$TARGET_ENV" ]] || die "--target is required"
	[[ -n "$IMAGE_REF" ]] || die "--image-ref or SIGNER_IMAGE_REF is required"
	hostname="$(target_hostname "$TARGET_ENV")"
	image_ref="$IMAGE_REF"

	ssh_target="$(build_ssh_target "$TARGET_ENV")"
	flake_dir="$(repo_root)/packages/signer/infra/nixos"
	ssh_public_key="${LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY:-}"

	if [[ -z "$ssh_public_key" && -f "${HOME}/.ssh/id_ed25519" ]]; then
		ssh_public_key="$(ssh-keygen -y -f "${HOME}/.ssh/id_ed25519")"
	fi
	[[ -n "$ssh_public_key" ]] || die \
		"Provide LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY or make ~/.ssh/id_ed25519 available before rebuilding."

	if [[ -n "${SSH_PORT:-}" ]]; then
		export NIX_SSHOPTS="-p ${SSH_PORT}"
	fi

	log "Applying $(target_host_config "$TARGET_ENV") to ${ssh_target}"
	# The image is injected at evaluation time so CI can promote a digest by rebuilding the host config.
	LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY="$ssh_public_key" \
		LUMINA_SIGNER_IMAGE_REF="$image_ref" \
		LUMINA_SIGNER_CONTAINER_PORT="${CONTAINER_PORT:-3001}" \
		LUMINA_SIGNER_ENV_FILE="${ENV_FILE_PATH:-/var/lib/lumina-signer/env}" \
		nixos-rebuild switch \
		--flake "${flake_dir}#$(target_host_config "$TARGET_ENV")" \
		--target-host "$ssh_target" \
		--use-remote-sudo
}

main "$@"
