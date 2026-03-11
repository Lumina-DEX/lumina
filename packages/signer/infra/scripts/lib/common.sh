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

target_host_config() {
	case "${1:-}" in
		zeko-testnet) printf 'zeko-testnet-signer' ;;
		mina-mainnet) printf 'mina-mainnet-signer' ;;
		zeko-mainnet) printf 'zeko-mainnet-signer' ;;
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


build_ssh_target() {
	local target="$1"

	if [[ -n "${SSH_HOST:-}" ]]; then
		if [[ -n "${SSH_USER:-}" ]]; then
			printf '%s@%s' "$SSH_USER" "$SSH_HOST"
		else
			printf '%s' "$SSH_HOST"
		fi
		return 0
	fi

	printf '%s' "$(target_ssh_alias "$target")"
}

build_ssh_command() {
	local -n ssh_command_ref="$1"
	local target="$2"
	local ssh_target

	ssh_target="$(build_ssh_target "$target")"

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
