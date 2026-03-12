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
	local ssh_target flake_dir image_ref ssh_public_key

	parse_args "$@"
	maybe_source_env
	IMAGE_REF="${IMAGE_REF:-${SIGNER_IMAGE_REF:-}}"
	CONTAINER_PORT="${CONTAINER_PORT:-${LUMINA_SIGNER_CONTAINER_PORT:-}}"
	ENV_FILE_PATH="${ENV_FILE_PATH:-${LUMINA_SIGNER_ENV_FILE:-}}"

	require_command nixos-rebuild
	require_command ssh

	[[ -n "$TARGET_ENV" ]] || die "--target is required"
	[[ -n "$IMAGE_REF" ]] || die "--image-ref or SIGNER_IMAGE_REF is required"
	image_ref="$IMAGE_REF"

	ssh_target="$(build_ssh_target "$TARGET_ENV" "$(remote_admin_user)")"
	flake_dir="$(repo_root)/packages/signer/infra/nixos"
	ssh_public_key="$(admin_public_key "$TARGET_ENV" || true)"
	[[ -n "$ssh_public_key" ]] || die \
		"Provide LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY or configure an SSH alias identity file before rebuilding."

	if [[ -n "${SSH_PORT:-}" ]]; then
		export NIX_SSHOPTS="-p ${SSH_PORT}"
	fi

	# Fetch hardware config from target if not present locally (e.g. in CI).
	local hardware_path
	hardware_path="$(target_generated_hardware_path "$TARGET_ENV")"
	if [[ ! -f "$hardware_path" ]]; then
		log "Hardware config not found locally — fetching from ${ssh_target}..."
		mkdir -p "$(dirname "$hardware_path")"
		local -a ssh_cmd
		build_ssh_command ssh_cmd "$TARGET_ENV" "$(remote_admin_user)"
		"${ssh_cmd[@]}" "sudo nixos-generate-config --show-hardware-config" >"$hardware_path"
	fi

	# nixos-rebuild --target-host uses ssh:// transport, which runs
	# nix-store --serve --write on the remote.  This checks require-sigs
	# (not trusted-users) and rejects unsigned locally-built paths.
	# Patch the remote nix.conf to accept unsigned paths before deploying.
	# On NixOS /etc/nix/nix.conf is an immutable store symlink, so we
	# replace it with a mutable copy.  After nixos-rebuild switch succeeds
	# the system activation restores the proper symlink (which now includes
	# the setting from our NixOS module).
	local -a patch_cmd
	build_ssh_command patch_cmd "$TARGET_ENV" "$(remote_admin_user)"
	"${patch_cmd[@]}" \
		'if ! grep -q "^require-sigs = false" /etc/nix/nix.conf 2>/dev/null; then
			sudo cp --dereference /etc/nix/nix.conf /tmp/nix.conf.patched 2>/dev/null || sudo cp /etc/nix/nix.conf /tmp/nix.conf.patched
			printf "\ntrusted-users = root @wheel\nrequire-sigs = false\n" | sudo tee -a /tmp/nix.conf.patched >/dev/null
			sudo mv /tmp/nix.conf.patched /etc/nix/nix.conf
			sudo systemctl restart nix-daemon
		fi' \
		|| log "Warning: could not patch remote nix.conf (non-fatal)"

	log "Applying $(target_host_config "$TARGET_ENV") to ${ssh_target}"
	# Use a path flake so local generated hardware files are visible even though
	# they stay gitignored.
	LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY="$ssh_public_key" \
		LUMINA_SIGNER_IMAGE_REF="$image_ref" \
		LUMINA_SIGNER_CONTAINER_PORT="${CONTAINER_PORT:-3001}" \
		LUMINA_SIGNER_ENV_FILE="${ENV_FILE_PATH:-/var/lib/lumina-signer/env}" \
		nixos-rebuild switch \
		--flake "path:${flake_dir}#$(target_host_config "$TARGET_ENV")" \
		--target-host "$ssh_target" \
		--use-remote-sudo \
		--impure
}

main "$@"
