#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

TARGET_ENV="${TARGET_ENV:-}"
IMAGE_REF="${IMAGE_REF:-${SIGNER_IMAGE_REF:-}}"
RUNTIME_ENV_FILE_OVERRIDE="${RUNTIME_ENV_FILE:-}"

usage() {
	cat <<'EOF'
Usage: validate-local-setup.sh --target <env> [--runtime-env-file <path>] [--image-ref <container-image>]
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
			--runtime-env-file)
				[[ $# -ge 2 ]] || die "--runtime-env-file requires a value"
				RUNTIME_ENV_FILE_OVERRIDE="$2"
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
	local hostname server_ip ssh_alias identity_file resolved_hostname runtime_env_file ssh_public_key

	parse_args "$@"
	maybe_source_env
	IMAGE_REF="${IMAGE_REF:-${SIGNER_IMAGE_REF:-}}"
	RUNTIME_ENV_FILE_OVERRIDE="${RUNTIME_ENV_FILE_OVERRIDE:-${RUNTIME_ENV_FILE:-}}"

	require_command curl
	require_command jq
	require_command nixos-anywhere
	require_command nixos-rebuild
	require_command scp
	require_command ssh
	require_command ssh-keygen

	[[ -n "$TARGET_ENV" ]] || die "--target is required"
	[[ -n "$IMAGE_REF" ]] || die "--image-ref or SIGNER_IMAGE_REF is required"

	hostname="$(target_hostname "$TARGET_ENV")"
	server_ip="$(target_server_ip "$TARGET_ENV" || true)"
	ssh_alias="$(target_ssh_alias "$TARGET_ENV")"
	runtime_env_file="${RUNTIME_ENV_FILE_OVERRIDE:-$(target_runtime_env_file "$TARGET_ENV" || true)}"

	[[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] || die "Missing CLOUDFLARE_API_TOKEN"
	[[ -n "${CLOUDFLARE_ZONE_NAME:-}" ]] || die "Missing CLOUDFLARE_ZONE_NAME"
	[[ -n "$server_ip" ]] || die "Missing server IP for ${TARGET_ENV}."
	[[ -n "$runtime_env_file" ]] || die \
		"Provide --runtime-env-file or set $(target_prefix "$TARGET_ENV")_RUNTIME_ENV_FILE."

	require_env_keys_in_file \
		"$runtime_env_file" \
		DATABASE_URL \
		INFISICAL_ENVIRONMENT \
		INFISICAL_PROJECT_ID \
		INFISICAL_CLIENT_ID \
		INFISICAL_CLIENT_SECRET

	resolved_hostname="$(ssh_config_value "$ssh_alias" hostname)"
	[[ -n "$resolved_hostname" ]] || die "SSH alias $ssh_alias is not configured."
	[[ "$resolved_hostname" == "$server_ip" ]] || die \
		"SSH alias $ssh_alias should point to $server_ip, got $resolved_hostname."

	identity_file="$(target_identity_file "$TARGET_ENV" || true)"
	[[ -n "$identity_file" && -f "$identity_file" ]] || die \
		"SSH alias $ssh_alias must define an existing IdentityFile."

	ssh_public_key="$(admin_public_key "$TARGET_ENV" || true)"
	[[ -n "$ssh_public_key" ]] || die "Unable to derive admin public key from $identity_file."

	log "Local setup is ready for ${TARGET_ENV}."
	log "Hostname: ${hostname}"
	log "Server IP: ${server_ip}"
	log "SSH alias: ${ssh_alias}"
	log "Runtime env file: ${runtime_env_file}"
}

main "$@"
