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
	local os_id

	os_id="$(
		run_remote_as "$target" "$(remote_admin_user)" \
			"source /etc/os-release >/dev/null 2>&1 && printf '%s' \"\$ID\"" 2>/dev/null || true
	)"
	[[ "$os_id" == "nixos" ]]
}

bootstrap_host_os() {
	local target="$1"

	run_remote_as "$target" "$(remote_bootstrap_user)" \
		"source /etc/os-release >/dev/null 2>&1 && printf '%s' \"\$ID\"" 2>/dev/null || true
}

install_nixos_if_needed() {
	local target="$1"
	local ssh_public_key="$2"
	local ci_public_key="$3"
	local flake_dir bootstrap_os

	if host_is_nixos "$target"; then
		log "${target} already reports NixOS. Skipping nixos-anywhere."
		return 1
	fi

	bootstrap_os="$(bootstrap_host_os "$target")"
	if [[ "$bootstrap_os" == "nixos" ]]; then
		die "${target} already reports NixOS over bootstrap SSH. Fix admin SSH instead of rerunning nixos-anywhere."
	fi
	[[ -n "$bootstrap_os" ]] || die \
		"Unable to determine the remote OS for ${target}. Refusing to run nixos-anywhere blindly."

	flake_dir="$(repo_root)/packages/signer/infra/nixos"
	log "Running nixos-anywhere with disko for ${target}."
	LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY="$ssh_public_key" \
		LUMINA_SIGNER_CI_AUTHORIZED_KEY="$ci_public_key" \
		nixos-anywhere \
		--build-on remote \
		--option pure-eval false \
		--flake "path:${flake_dir}#$(target_host_config "$target")" \
		--target-host "$(remote_bootstrap_user)@$(target_ssh_alias "$target")"
	return 0
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
		"sudo install -d -m 700 -o root -g root $(remote_state_dir) && \
		sudo install -m 600 -o root -g root ${remote_tmp} $(remote_runtime_env_path) && \
		rm -f ${remote_tmp}"
}

upload_release_env() {
	local target="$1"
	local image_ref="$2"
	local release_file
	local -a scp_command

	release_file="$(mktemp)"
	cat >"$release_file" <<EOF
IMAGE_REF=${image_ref}
GIT_SHA=${GIT_SHA:-$(git -C "$(repo_root)" rev-parse HEAD 2>/dev/null || true)}
RELEASED_AT=${RELEASED_AT:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}
EOF

	build_scp_command scp_command
	scp_command+=(
		"$release_file"
		"$(build_ssh_target "$target" "$(remote_admin_user)"):/tmp/lumina-signer-release.env"
	)
	"${scp_command[@]}"
	rm -f "$release_file"

	run_remote_as "$target" "$(remote_admin_user)" \
		"sudo install -d -m 700 -o root -g root $(remote_state_dir) && \
		sudo install -m 600 -o root -g root /tmp/lumina-signer-release.env $(remote_release_env_path) && \
		rm -f /tmp/lumina-signer-release.env"
}

main() {
	local hostname server_ip runtime_env_file ssh_public_key ci_key fresh_install

	parse_args "$@"
	maybe_source_env
	IMAGE_REF="${IMAGE_REF:-${SIGNER_IMAGE_REF:-}}"
	RUNTIME_ENV_FILE_OVERRIDE="${RUNTIME_ENV_FILE_OVERRIDE:-${RUNTIME_ENV_FILE:-}}"

	[[ -n "$TARGET_ENV" ]] || die "--target is required"

	hostname="$(target_hostname "$TARGET_ENV")"
	server_ip="$(target_server_ip "$TARGET_ENV" || true)"
	runtime_env_file="${RUNTIME_ENV_FILE_OVERRIDE:-$(target_runtime_env_file "$TARGET_ENV")}"
	ssh_public_key="$(admin_public_key "$TARGET_ENV")"
	ci_key="$(ci_public_key "$TARGET_ENV" || true)"

	[[ -n "$ssh_public_key" ]] || die \
		"Provide LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY or configure an SSH alias identity file."

	if [[ "$SKIP_DNS" -eq 0 ]]; then
		ensure_dns_record "$hostname" "$server_ip"
	fi

	# install_nixos_if_needed returns 0 if nixos-anywhere ran successfully,
	# 1 if the host is already NixOS (skip). Any other failure is fatal.
	local install_rc=0
	install_nixos_if_needed "$TARGET_ENV" "$ssh_public_key" "$ci_key" || install_rc=$?
	fresh_install=0
	if [[ "$install_rc" -eq 0 ]]; then
		fresh_install=1
	elif [[ "$install_rc" -ne 1 ]]; then
		die "install_nixos_if_needed failed with exit code ${install_rc}"
	fi

	upload_runtime_env "$TARGET_ENV" "$runtime_env_file"
	upload_release_env "$TARGET_ENV" "$IMAGE_REF"

	if [[ "$fresh_install" -eq 1 ]]; then
		# nixos-anywhere already installed the full config; just start the service.
		run_remote_as "$TARGET_ENV" "$(remote_admin_user)" "sudo systemctl restart lumina-signer"
	else
		"$SCRIPT_DIR/rebuild-host.sh" --target "$TARGET_ENV" --image-ref "$IMAGE_REF"
	fi

	"$SCRIPT_DIR/check-host.sh" --target "$TARGET_ENV"

	log "Rollout completed for ${TARGET_ENV}."
}

main "$@"
