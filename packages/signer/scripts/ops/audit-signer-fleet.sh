#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/signer-fleet-common.sh
source "$SCRIPT_DIR/lib/signer-fleet-common.sh"

MODE="full"
TARGETS=()

usage() {
	cat <<'EOF'
Usage: audit-signer-fleet.sh [--preflight-only | --remote-only | --full] [--target <env>]

Targets:
  zeko-testnet
  mina-mainnet
  zeko-mainnet
EOF
}

parse_args() {
	while [[ $# -gt 0 ]]; do
		case "$1" in
			--preflight-only)
				MODE="preflight"
				shift
				;;
			--remote-only)
				MODE="remote"
				shift
				;;
			--full)
				MODE="full"
				shift
				;;
			--target)
				[[ $# -ge 2 ]] || die "--target requires a value"
				TARGETS+=("$2")
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

ensure_targets() {
	if [[ "${#TARGETS[@]}" -eq 0 ]]; then
		TARGETS=(zeko-testnet mina-mainnet zeko-mainnet)
	fi

	if [[ -n "${SSH_HOST:-}" && "${#TARGETS[@]}" -ne 1 ]]; then
		die "SSH_HOST-based remote checks require exactly one --target."
	fi
}

require_resolver() {
	if command -v dig >/dev/null 2>&1 || command -v getent >/dev/null 2>&1; then
		return 0
	fi

	die "Preflight audits require either dig or getent for hostname resolution."
}

require_preflight_env() {
	maybe_source_fleet_env
	[[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] || die "CLOUDFLARE_API_TOKEN is required for preflight audits."
	[[ -n "${CLOUDFLARE_ZONE_NAME:-}" ]] || die "CLOUDFLARE_ZONE_NAME is required for preflight audits."
}

cloudflare_zone_id() {
	local response
	response="$(
		curl -fsS "https://api.cloudflare.com/client/v4/zones?name=${CLOUDFLARE_ZONE_NAME}" \
			-H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
			-H 'Content-Type: application/json'
	)"

	jq -er '.result[0].id' <<<"$response"
}

preflight_target() {
	local target="$1"
	local hostname expected_ip zone_id dns_response record_ip proxied
	local root_alias admin_alias service_alias

	log "Preflight audit for $target"
	hostname="$(target_hostname "$target")"
	expected_ip="$(target_server_ip "$target" || true)"
	[[ -n "$expected_ip" ]] || die "Missing server IP for target $target."

	guard_not_legacy_host "$hostname" "Target hostname"
	guard_not_legacy_host "$expected_ip" "Target server IP"

	root_alias="$(target_alias "$target" root)"
	admin_alias="$(target_alias "$target" admin)"
	service_alias="$(target_alias "$target" service)"

	assert_alias_configured "$root_alias" "$expected_ip"
	assert_alias_configured "$admin_alias" "$expected_ip"
	assert_alias_configured "$service_alias" "$expected_ip"

	zone_id="$(cloudflare_zone_id)"
	[[ -n "$zone_id" ]] || die "Unable to resolve Cloudflare zone ID for ${CLOUDFLARE_ZONE_NAME}."

	dns_response="$(
		curl -fsS "https://api.cloudflare.com/client/v4/zones/${zone_id}/dns_records?type=A&name=${hostname}" \
			-H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
			-H 'Content-Type: application/json'
	)"
	record_ip="$(jq -er '.result[0].content' <<<"$dns_response")"
	proxied="$(jq -er '.result[0].proxied' <<<"$dns_response")"

	[[ "$record_ip" == "$expected_ip" ]] || die "Cloudflare record for $hostname points to $record_ip, expected $expected_ip."
	[[ "$proxied" == "true" ]] || die "Cloudflare record for $hostname must be proxied."
}

run_remote() {
	local target="$1"
	local command="$2"
	local -a ssh_command

	if [[ -n "${SSH_HOST:-}" ]]; then
		build_ssh_command ssh_command
	else
		build_ssh_command ssh_command "$(target_alias "$target" admin)"
	fi

	"${ssh_command[@]}" "$command"
}

probe_https_graphql() {
	local hostname="$1"
	local response
	response="$(curl_graphql "https://${hostname}/graphql" 'query Healthcheck { __typename }' '{}' "")"
	jq -e '.data.__typename == "Query"' >/dev/null <<<"$response" || die "HTTPS GraphQL probe failed for ${hostname}."
}

probe_authenticated_graphql() {
	local target="$1"
	local hostname="$2"
	local network_enum response

	[[ -n "${SIGNER_API_KEY:-}" ]] || return 0

	network_enum="$(target_graphql_enum "$target")"
	response="$(
		curl_graphql \
			"https://${hostname}/graphql" \
			'query AuditSigners($network: Network) { signers(network: $network) { id publicKey networks { network permission active } } }' \
			"$(jq -cn --arg network "$network_enum" '{network: $network}')" \
			"Authorization: Bearer ${SIGNER_API_KEY}"
	)"
	jq -e '.data.signers | type == "array"' >/dev/null <<<"$response" || die "Authenticated signer query failed for ${hostname}."
}

remote_target() {
	local target="$1"
	local hostname ports

	log "Remote audit for $target"
	hostname="$(target_hostname "$target")"

	guard_not_legacy_host "$hostname" "Target hostname"
	run_remote "$target" "true" >/dev/null
	run_remote "$target" "grep -Eq '^ID=nixos$' /etc/os-release"

	ports="$(run_remote "$target" "nixos-option networking.firewall.allowedTCPPorts 2>/dev/null | tr -cd '0-9 \n'")"
	for required_port in 22 80 443; do
		grep -Eq "(^|[[:space:]])${required_port}($|[[:space:]])" <<<"$ports" || die \
			"Firewall check failed for $target. Missing TCP port ${required_port}."
	done

	for unit in fail2ban caddy lumina-signer; do
		[[ "$(run_remote "$target" "systemctl is-active ${unit}")" == "active" ]] || die \
			"Systemd unit ${unit} is not active on ${target}."
	done

	probe_https_graphql "$hostname"
	probe_authenticated_graphql "$target" "$hostname"
}

main() {
	parse_args "$@"
	ensure_targets

	require_command curl
	require_command jq
	require_command ssh

	if [[ "$MODE" != "remote" ]]; then
		require_resolver
		require_preflight_env
	fi

	for target in "${TARGETS[@]}"; do
		case "$MODE" in
			preflight)
				preflight_target "$target"
				;;
			remote)
				maybe_source_fleet_env
				remote_target "$target"
				;;
			full)
				require_preflight_env
				preflight_target "$target"
				remote_target "$target"
				;;
		esac
	done

	log "Audit completed successfully."
}

main "$@"
