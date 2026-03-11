#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

TARGET_ENV="${TARGET_ENV:-}"

usage() {
	cat <<'EOF'
Usage: check-smoke-host.sh --target <env>
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
	local hostname

	parse_args "$@"
	maybe_source_env

	require_command curl
	require_command ssh

	[[ -n "$TARGET_ENV" ]] || die "--target is required"
	hostname="$(target_hostname "$TARGET_ENV")"
	guard_not_blocked "$hostname" "Target hostname"

	for unit in caddy lumina-signer; do
		[[ "$(run_remote "$TARGET_ENV" "systemctl is-active ${unit}")" == "active" ]] || die \
			"Systemd unit ${unit} is not active on ${TARGET_ENV}."
	done

	# The smoke image serves a simple page; a 200 over HTTPS is enough for this rollout stage.
	curl -fsS "https://${hostname}/" >/dev/null || die "HTTPS smoke check failed for ${hostname}."
	log "Smoke check succeeded for ${TARGET_ENV}."
}

main "$@"
