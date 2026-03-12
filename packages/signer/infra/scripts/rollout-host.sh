#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

TARGET_ENV="${TARGET_ENV:-}"
IMAGE_REF="${IMAGE_REF:-${SIGNER_IMAGE_REF:-}}"
RUNTIME_ENV_FILE_OVERRIDE="${RUNTIME_ENV_FILE:-}"
SKIP_DNS=0

usage() {
	cat <<'EOF'
Usage: rollout-host.sh --target <env> [--runtime-env-file <path>] [--image-ref <container-image>] [--skip-dns]
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
			--skip-dns)
				SKIP_DNS=1
				shift
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

cloudflare_api() {
	local method="$1"
	local path="$2"
	local data="${3:-}"

	if [[ -n "$data" ]]; then
		curl -fsS -X "$method" "https://api.cloudflare.com/client/v4${path}" \
			-H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
			-H 'Content-Type: application/json' \
			--data "$data"
	else
		curl -fsS -X "$method" "https://api.cloudflare.com/client/v4${path}" \
			-H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
			-H 'Content-Type: application/json'
	fi
}

ensure_dns_record() {
	local hostname="$1"
	local server_ip="$2"
	local zone_id existing_record record_id payload

	zone_id="$(
		cloudflare_api GET "/zones?name=${CLOUDFLARE_ZONE_NAME}" |
			jq -er '.result[0].id'
	)"

	existing_record="$(
		cloudflare_api GET "/zones/${zone_id}/dns_records?type=A&name=${hostname}"
	)"
	record_id="$(jq -r '.result[0].id // empty' <<<"$existing_record")"
	payload="$(
		jq -cn \
			--arg type A \
			--arg name "$hostname" \
			--arg content "$server_ip" \
			'{type: $type, name: $name, content: $content, proxied: true, ttl: 1}'
	)"

	if [[ -n "$record_id" ]]; then
		cloudflare_api PUT "/zones/${zone_id}/dns_records/${record_id}" "$payload" >/dev/null
		log "Updated Cloudflare DNS record for ${hostname}."
	else
		cloudflare_api POST "/zones/${zone_id}/dns_records" "$payload" >/dev/null
		log "Created Cloudflare DNS record for ${hostname}."
	fi
}

host_is_nixos() {
	local target="$1"

	run_remote_as "$target" "$(remote_admin_user)" \
		"source /etc/os-release >/dev/null 2>&1 && [ \"\$ID\" = nixos ]" >/dev/null 2>&1
}

install_nixos_if_needed() {
	local target="$1"
	local image_ref="$2"
	local ssh_public_key="$3"
	local flake_dir hardware_path

	if host_is_nixos "$target"; then
		log "${target} already reports NixOS. Skipping nixos-anywhere."
		return 0
	fi

	flake_dir="$(repo_root)/packages/signer/infra/nixos"
	hardware_path="$(target_generated_hardware_path "$target")"
	mkdir -p "$(dirname "$hardware_path")"

	log "Running nixos-anywhere for ${target}."
	LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY="$ssh_public_key" \
		LUMINA_SIGNER_IMAGE_REF="$image_ref" \
		nixos-anywhere \
		--generate-hardware-config \
		nixos-generate-config \
		"$hardware_path" \
		--flake "path:${flake_dir}#$(target_host_config "$target")" \
		--target-host "$(remote_bootstrap_user)@$(target_ssh_alias "$target")"
}

upload_runtime_env() {
	local target="$1"
	local runtime_env_file="$2"
	local remote_tmp
	local -a scp_command

	remote_tmp="/tmp/lumina-signer-env.$$"

	build_scp_command scp_command
	scp_command+=(
		"$runtime_env_file"
		"$(build_ssh_target "$target" "$(remote_admin_user)"):${remote_tmp}"
	)
	"${scp_command[@]}"

	run_remote_as "$target" "$(remote_admin_user)" \
		"sudo install -d -m 700 -o root -g root /var/lib/lumina-signer && \
		sudo install -m 600 -o root -g root ${remote_tmp} /var/lib/lumina-signer/env && \
		rm -f ${remote_tmp}"
}

main() {
	local hostname server_ip runtime_env_file ssh_public_key

	parse_args "$@"
	maybe_source_env
	IMAGE_REF="${IMAGE_REF:-${SIGNER_IMAGE_REF:-}}"
	RUNTIME_ENV_FILE_OVERRIDE="${RUNTIME_ENV_FILE_OVERRIDE:-${RUNTIME_ENV_FILE:-}}"

	"$SCRIPT_DIR/validate-local-setup.sh" \
		--target "$TARGET_ENV" \
		--runtime-env-file "${RUNTIME_ENV_FILE_OVERRIDE:-$(target_runtime_env_file "$TARGET_ENV" || true)}" \
		--image-ref "$IMAGE_REF"

	hostname="$(target_hostname "$TARGET_ENV")"
	server_ip="$(target_server_ip "$TARGET_ENV" || true)"
	runtime_env_file="${RUNTIME_ENV_FILE_OVERRIDE:-$(target_runtime_env_file "$TARGET_ENV")}"
	ssh_public_key="$(admin_public_key "$TARGET_ENV")"

	if [[ "$SKIP_DNS" -eq 0 ]]; then
		ensure_dns_record "$hostname" "$server_ip"
	fi

	# Bootstrap the machine first, then move into steady-state admin access.
	install_nixos_if_needed "$TARGET_ENV" "$IMAGE_REF" "$ssh_public_key"
	upload_runtime_env "$TARGET_ENV" "$runtime_env_file"
	"$SCRIPT_DIR/rebuild-host.sh" --target "$TARGET_ENV" --image-ref "$IMAGE_REF"
	"$SCRIPT_DIR/check-host.sh" --target "$TARGET_ENV"

	log "Rollout completed for ${TARGET_ENV}."
}

main "$@"
