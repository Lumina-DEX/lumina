#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

assert_fails() {
	local description="$1"
	local command="$2"

	if bash -lc "$command" >/dev/null 2>&1; then
		die "Expected failure: ${description}"
	fi
}

main() {
	local common_script="$SCRIPT_DIR/lib/common.sh"

	assert_fails \
		"blocklist exact match" \
		"export LEGACY_SIGNER_BLOCKLIST='legacy.internal,198.51.100.99'; source '$common_script'; guard_not_blocked 'legacy.internal' 'legacy host'"

	assert_fails \
		"blocklist resolved ip match" \
		"export LEGACY_SIGNER_BLOCKLIST='198.51.100.99'; source '$common_script'; resolve_ipv4() { printf '198.51.100.99'; }; guard_not_blocked 'new-host.internal' 'legacy host'"

	log "Blocklist guard tests passed."
}

main "$@"
