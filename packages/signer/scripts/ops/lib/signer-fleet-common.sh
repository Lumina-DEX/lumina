#!/usr/bin/env bash

log() {
	printf '[signer-ops] %s\n' "$*" >&2
}

die() {
	log "ERROR: $*"
	exit 1
}

require_command() {
	local command_name="$1"
	command -v "$command_name" >/dev/null 2>&1 || die "Missing required command: $command_name"
}

maybe_source_fleet_env() {
	local script_dir env_file
	script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
	env_file="${SIGNER_FLEET_ENV_FILE:-$script_dir/signer-fleet.env}"

	if [[ -f "$env_file" ]]; then
		# shellcheck source=/dev/null
		source "$env_file"
	fi
}

target_prefix() {
	case "${1:-}" in
		zeko-testnet) printf 'ZEKO_TESTNET' ;;
		mina-mainnet) printf 'MINA_MAINNET' ;;
		zeko-mainnet) printf 'ZEKO_MAINNET' ;;
		*) die "Unsupported target: ${1:-}" ;;
	esac
}

target_graphql_enum() {
	case "${1:-}" in
		zeko-testnet) printf 'zeko_testnet' ;;
		mina-mainnet) printf 'mina_mainnet' ;;
		zeko-mainnet) printf 'zeko_mainnet' ;;
		*) die "Unsupported target: ${1:-}" ;;
	esac
}

target_network_value() {
	case "${1:-}" in
		zeko-testnet) printf 'zeko:testnet' ;;
		mina-mainnet) printf 'mina:mainnet' ;;
		zeko-mainnet) printf 'zeko:mainnet' ;;
		*) die "Unsupported target: ${1:-}" ;;
	esac
}

target_alias_prefix() {
	case "${1:-}" in
		zeko-testnet) printf 'lumina_signer_zeko_testnet' ;;
		mina-mainnet) printf 'lumina_signer_mina_mainnet' ;;
		zeko-mainnet) printf 'lumina_signer_zeko_mainnet' ;;
		*) die "Unsupported target: ${1:-}" ;;
	esac
}

target_alias() {
	local target="$1"
	local role="$2"
	printf '%s_%s' "$(target_alias_prefix "$target")" "$role"
}

env_get() {
	local name="$1"
	printf '%s' "${!name-}"
}

target_hostname() {
	local prefix specific
	prefix="$(target_prefix "$1")"
	specific="${prefix}_HOSTNAME"

	if [[ -n "$(env_get "$specific")" ]]; then
		env_get "$specific"
		return 0
	fi

	if [[ -n "${TARGET_HOSTNAME:-}" ]]; then
		printf '%s' "$TARGET_HOSTNAME"
		return 0
	fi

	die "Missing hostname for target $1. Set $specific or TARGET_HOSTNAME."
}

target_server_ip() {
	local prefix specific
	prefix="$(target_prefix "$1")"
	specific="${prefix}_SERVER_IP"

	if [[ -n "$(env_get "$specific")" ]]; then
		env_get "$specific"
		return 0
	fi

	if [[ -n "${TARGET_SERVER_IP:-}" ]]; then
		printf '%s' "$TARGET_SERVER_IP"
		return 0
	fi

	return 1
}

signer_image_repository() {
	printf '%s' "${SIGNER_IMAGE_REPOSITORY:-ghcr.io/lumina-dex/lumina-signer}"
}

guard_not_legacy_reference() {
	local value="${1:-}"
	local label="${2:-target}"

	[[ -n "$value" ]] || die "$label is empty"

	case "$value" in
		157.180.50.185 | lumina_root | lumina | dokku_lumina)
			die "$label points at the blocked legacy signer host ($value). Refusing to continue."
			;;
	esac
}

resolve_ipv4() {
	local value="$1"

	if [[ "$value" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
		printf '%s' "$value"
		return 0
	fi

	if command -v dig >/dev/null 2>&1; then
		dig +short A "$value" | awk 'NF { print $1; exit }'
		return 0
	fi

	if command -v getent >/dev/null 2>&1; then
		getent ahostsv4 "$value" | awk 'NR == 1 { print $1 }'
		return 0
	fi

	return 1
}

guard_not_legacy_host() {
	local value="$1"
	local label="${2:-target}"
	local resolved_ip=""

	guard_not_legacy_reference "$value" "$label"
	resolved_ip="$(resolve_ipv4 "$value" || true)"

	if [[ "$resolved_ip" == "157.180.50.185" ]]; then
		die "$label resolves to the blocked legacy signer host (157.180.50.185). Refusing to continue."
	fi
}

ssh_config_value() {
	local alias_name="$1"
	local key="$2"
	ssh -G "$alias_name" 2>/dev/null | awk -v key="$key" '$1 == key { print $2; exit }'
}

assert_alias_configured() {
	local alias_name="$1"
	local expected_ip="${2:-}"
	local resolved_hostname resolved_ip ssh_user

	guard_not_legacy_host "$alias_name" "SSH alias"
	resolved_hostname="$(ssh_config_value "$alias_name" hostname || true)"
	ssh_user="$(ssh_config_value "$alias_name" user || true)"

	[[ -n "$resolved_hostname" ]] || die "SSH alias $alias_name is missing a hostname."
	[[ "$resolved_hostname" != "$alias_name" ]] || die "SSH alias $alias_name is not defined in your SSH config."
	[[ -n "$ssh_user" ]] || die "SSH alias $alias_name is missing a user."

	guard_not_legacy_host "$resolved_hostname" "SSH alias $alias_name hostname"

	if [[ -n "$expected_ip" ]]; then
		resolved_ip="$(resolve_ipv4 "$resolved_hostname" || true)"
		[[ "$resolved_ip" == "$expected_ip" || "$resolved_hostname" == "$expected_ip" ]] || die \
			"SSH alias $alias_name resolves to $resolved_hostname (${resolved_ip:-unresolved}), expected $expected_ip."
	fi
}

build_ssh_command() {
	local -n ssh_command_ref="$1"
	local alias_name="${2:-}"

	if [[ -n "${SSH_HOST:-}" ]]; then
		guard_not_legacy_host "$SSH_HOST" "SSH_HOST"
		ssh_command_ref=(ssh -o BatchMode=yes)
		if [[ -n "${SSH_PORT:-}" ]]; then
			ssh_command_ref+=(-p "$SSH_PORT")
		fi
		if [[ -n "${SSH_USER:-}" ]]; then
			ssh_command_ref+=("${SSH_USER}@${SSH_HOST}")
		else
			ssh_command_ref+=("${SSH_HOST}")
		fi
		return 0
	fi

	[[ -n "$alias_name" ]] || die "An SSH alias is required when SSH_HOST is not set."
	guard_not_legacy_host "$alias_name" "SSH alias"
	ssh_command_ref=(ssh -o BatchMode=yes "$alias_name")
}

normalize_image_ref() {
	local input_ref="$1"
	local repository
	repository="$(signer_image_repository)"

	case "$input_ref" in
		"$repository"@sha256:*)
			printf '%s' "$input_ref"
			;;
		ghcr.io/*@sha256:*)
			die "Image reference must use ${repository}, got ${input_ref}."
			;;
		sha256:*)
			printf '%s@%s' "$repository" "$input_ref"
			;;
		*)
			if [[ "$input_ref" =~ ^[[:xdigit:]]{64}$ ]]; then
				printf '%s@sha256:%s' "$repository" "$input_ref"
			else
				die "Expected a sha256 digest or immutable image ref, got: $input_ref"
			fi
			;;
	esac
}

curl_graphql() {
	local url="$1"
	local query="$2"
	local variables_json="$3"
	local auth_header="${4:-}"
	local response

	if [[ -n "$auth_header" ]]; then
		response="$(
			curl -fsS "$url" \
				-H 'Content-Type: application/json' \
				-H "$auth_header" \
				--data "$(jq -cn --arg query "$query" --argjson variables "$variables_json" '{query: $query, variables: $variables}')"
		)"
	else
		response="$(
			curl -fsS "$url" \
				-H 'Content-Type: application/json' \
				--data "$(jq -cn --arg query "$query" --argjson variables "$variables_json" '{query: $query, variables: $variables}')"
		)"
	fi

	if jq -e '.errors and (.errors | length > 0)' >/dev/null 2>&1 <<<"$response"; then
		die "GraphQL request failed: $(jq -c '.errors' <<<"$response")"
	fi

	printf '%s' "$response"
}
