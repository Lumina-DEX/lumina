#!/usr/bin/env bash

log() {
	printf '[signer-infra] %s\n' "$*" >&2
}

die() {
	log "ERROR: $*"
	exit 1
}

require_command() {
	local command_name="$1"
	command -v "$command_name" >/dev/null 2>&1 || die "Missing required command: $command_name"
}

script_dir() {
	cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd
}

repo_root() {
	cd -- "$(script_dir)/../../../.." && pwd
}

maybe_source_env() {
	local env_file
	env_file="${SIGNER_FLEET_ENV_FILE:-$(script_dir)/signer-fleet.env}"

	if [[ -f "$env_file" ]]; then
		set -a
		# shellcheck source=/dev/null
		source "$env_file"
		set +a
	fi
}

default_admin_user() {
	printf 'lumina-admin'
}

default_bootstrap_user() {
	printf 'root'
}

remote_admin_user() {
	if [[ -n "${SSH_USER:-}" ]]; then
		printf '%s' "$SSH_USER"
	else
		default_admin_user
	fi
}

remote_bootstrap_user() {
	if [[ -n "${BOOTSTRAP_SSH_USER:-}" ]]; then
		printf '%s' "$BOOTSTRAP_SSH_USER"
	else
		default_bootstrap_user
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

target_host_config() {
	case "${1:-}" in
		zeko-testnet) printf 'zeko-testnet-signer' ;;
		mina-mainnet) printf 'mina-mainnet-signer' ;;
		zeko-mainnet) printf 'zeko-mainnet-signer' ;;
		*) die "Unsupported target: ${1:-}" ;;
	esac
}

target_generated_hardware_path() {
	printf '%s/packages/signer/infra/nixos/hosts/generated/%s-hardware.nix' \
		"$(repo_root)" \
		"$(target_host_config "$1")"
}

target_network_value() {
	case "${1:-}" in
		zeko-testnet) printf 'zeko:testnet' ;;
		mina-mainnet) printf 'mina:mainnet' ;;
		zeko-mainnet) printf 'zeko:mainnet' ;;
		*) die "Unsupported target: ${1:-}" ;;
	esac
}

env_get() {
	local name="$1"
	printf '%s' "${!name-}"
}

target_hostname() {
	local prefix variable_name
	prefix="$(target_prefix "$1")"
	variable_name="${prefix}_HOSTNAME"

	if [[ -n "$(env_get "$variable_name")" ]]; then
		env_get "$variable_name"
		return 0
	fi

	if [[ -n "${TARGET_HOSTNAME:-}" ]]; then
		printf '%s' "$TARGET_HOSTNAME"
		return 0
	fi

	die "Missing hostname for target $1."
}

target_server_ip() {
	local prefix variable_name
	prefix="$(target_prefix "$1")"
	variable_name="${prefix}_SERVER_IP"

	if [[ -n "$(env_get "$variable_name")" ]]; then
		env_get "$variable_name"
		return 0
	fi

	if [[ -n "${TARGET_SERVER_IP:-}" ]]; then
		printf '%s' "$TARGET_SERVER_IP"
		return 0
	fi

	return 1
}

target_ssh_alias() {
	local prefix variable_name
	prefix="$(target_prefix "$1")"
	variable_name="${prefix}_SSH_ALIAS"

	if [[ -n "$(env_get "$variable_name")" ]]; then
		env_get "$variable_name"
		return 0
	fi

	printf 'lumina_signer_%s' "${1//-/_}"
}

target_runtime_env_file() {
	local prefix variable_name
	prefix="$(target_prefix "$1")"
	variable_name="${prefix}_RUNTIME_ENV_FILE"

	if [[ -n "$(env_get "$variable_name")" ]]; then
		env_get "$variable_name"
		return 0
	fi

	if [[ -n "${RUNTIME_ENV_FILE:-}" ]]; then
		printf '%s' "$RUNTIME_ENV_FILE"
		return 0
	fi

	return 1
}

ssh_config_value() {
	local ssh_alias="$1"
	local key="$2"

	ssh -G "$ssh_alias" 2>/dev/null | awk -v key="$key" '$1 == key { print $2; exit }'
}

target_identity_file() {
	local target="$1"
	local ssh_alias identity_file

	ssh_alias="$(target_ssh_alias "$target")"
	identity_file="$(ssh_config_value "$ssh_alias" identityfile)"
	[[ -n "$identity_file" ]] || return 1
	printf '%s' "$identity_file"
}

admin_public_key() {
	local target="$1"
	local identity_file="${LUMINA_SIGNER_ADMIN_IDENTITY_FILE:-}"

	if [[ -n "${LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY:-}" ]]; then
		printf '%s' "$LUMINA_SIGNER_ADMIN_AUTHORIZED_KEY"
		return 0
	fi

	if [[ -z "$identity_file" ]]; then
		identity_file="$(target_identity_file "$target" 2>/dev/null || true)"
	fi

	if [[ -z "$identity_file" && -f "${HOME}/.ssh/id_ed25519" ]]; then
		identity_file="${HOME}/.ssh/id_ed25519"
	fi

	[[ -n "$identity_file" && -f "$identity_file" ]] || return 1
	ssh-keygen -y -f "$identity_file"
}

build_ssh_target() {
	local target="$1"
	local remote_user="${2:-}"

	if [[ -n "${SSH_HOST:-}" ]]; then
		if [[ -n "$remote_user" ]]; then
			printf '%s@%s' "$remote_user" "$SSH_HOST"
		elif [[ -n "${SSH_USER:-}" ]]; then
			printf '%s@%s' "$SSH_USER" "$SSH_HOST"
		else
			printf '%s' "$SSH_HOST"
		fi
		return 0
	fi

	if [[ -n "$remote_user" ]]; then
		printf '%s@%s' "$remote_user" "$(target_ssh_alias "$target")"
		return 0
	fi

	printf '%s' "$(target_ssh_alias "$target")"
}

build_ssh_command() {
	local -n ssh_command_ref="$1"
	local target="$2"
	local remote_user="${3:-}"
	local ssh_target

	ssh_target="$(build_ssh_target "$target" "$remote_user")"

	ssh_command_ref=(ssh -o BatchMode=yes)
	if [[ -n "${SSH_PORT:-}" ]]; then
		ssh_command_ref+=(-p "$SSH_PORT")
	fi
	ssh_command_ref+=("$ssh_target")
}

run_remote() {
	local target="$1"
	local remote_command="$2"
	local -a ssh_command

	build_ssh_command ssh_command "$target"
	"${ssh_command[@]}" "$remote_command"
}

run_remote_as() {
	local target="$1"
	local remote_user="$2"
	local remote_command="$3"
	local -a ssh_command

	build_ssh_command ssh_command "$target" "$remote_user"
	"${ssh_command[@]}" "$remote_command"
}

build_scp_command() {
	local -n scp_command_ref="$1"

	scp_command_ref=(scp -o BatchMode=yes)
	if [[ -n "${SSH_PORT:-}" ]]; then
		scp_command_ref+=(-P "$SSH_PORT")
	fi
}

require_env_keys_in_file() {
	local file_path="$1"
	shift

	[[ -f "$file_path" ]] || die "Missing file: $file_path"

	while [[ $# -gt 0 ]]; do
		grep -Eq "^$1=" "$file_path" || die "Missing required key $1 in $file_path"
		shift
	done
}
