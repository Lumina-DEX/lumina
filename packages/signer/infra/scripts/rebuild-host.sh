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
	local ssh_target flake_dir image_ref ssh_public_key release_payload

	parse_args "$@"
	maybe_source_env
	IMAGE_REF="${IMAGE_REF:-${SIGNER_IMAGE_REF:-}}"
	CONTAINER_PORT="${CONTAINER_PORT:-${LUMINA_SIGNER_CONTAINER_PORT:-}}"
	ENV_FILE_PATH="${ENV_FILE_PATH:-${LUMINA_SIGNER_ENV_FILE:-}}"

	require_command nixos-rebuild
	require_command scp
	require_command ssh

	[[ -n "$TARGET_ENV" ]] || die "--target is required"
	image_ref="${IMAGE_REF:-}"

	ssh_target="$(build_ssh_target "$TARGET_ENV" "$(remote_admin_user)")"
	flake_dir="$(repo_root)/packages/signer/infra/nixos"
	ssh_public_key="$(admin_public_key "$TARGET_ENV" || true)"
	[[ -n "$ssh_public_key" ]] || die \
		"Provide LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY or configure an SSH alias identity file before rebuilding."

	if [[ -n "${SSH_PORT:-}" ]]; then
		export NIX_SSHOPTS="-p ${SSH_PORT}"
	fi

	if [[ -n "$image_ref" ]]; then
		release_payload="$(mktemp)"
		cat >"$release_payload" <<EOF
IMAGE_REF=${image_ref}
GIT_SHA=${GIT_SHA:-$(git -C "$(repo_root)" rev-parse HEAD 2>/dev/null || true)}
RELEASED_AT=${RELEASED_AT:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}
EOF

		scp "$release_payload" "${ssh_target}:/tmp/lumina-signer-release.env"
		rm -f "$release_payload"

		run_remote_as "$TARGET_ENV" "$(remote_admin_user)" \
			"sudo install -d -m 700 -o root -g root $(remote_state_dir) && \
			sudo install -m 600 -o root -g root /tmp/lumina-signer-release.env $(remote_release_env_path) && \
			rm -f /tmp/lumina-signer-release.env"
	fi

	log "Applying $(target_host_config "$TARGET_ENV") to ${ssh_target}"
	# Use a path flake so local host modules are evaluated directly from the
	# working tree, including any uncommitted rollout fixes.
	LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY="$ssh_public_key" \
		LUMINA_SIGNER_CI_AUTHORIZED_KEY="$(ci_public_key "$TARGET_ENV" || true)" \
		LUMINA_SIGNER_CONTAINER_PORT="${CONTAINER_PORT:-3001}" \
		LUMINA_SIGNER_ENV_FILE="${ENV_FILE_PATH:-$(remote_runtime_env_path)}" \
		nixos-rebuild switch \
		--option pure-eval false \
		--flake "path:${flake_dir}#$(target_host_config "$TARGET_ENV")" \
		--build-host "$ssh_target" \
		--target-host "$ssh_target" \
		--use-remote-sudo

	run_remote_as "$TARGET_ENV" "$(remote_admin_user)" "sudo systemctl restart lumina-signer"
}

main "$@"
