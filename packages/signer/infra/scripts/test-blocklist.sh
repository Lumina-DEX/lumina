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
		"legacy host exact match" \
		"export LEGACY_SIGNER_HOST='legacy.internal'; export LEGACY_SIGNER_IP='198.51.100.99'; source '$common_script'; guard_not_legacy_target 'legacy.internal' 'legacy host'"

	assert_fails \
		"legacy ip resolved match" \
		"export LEGACY_SIGNER_HOST='legacy.internal'; export LEGACY_SIGNER_IP='198.51.100.99'; source '$common_script'; resolve_ipv4() { printf '198.51.100.99'; }; guard_not_legacy_target 'new-host.internal' 'legacy host'"

	log "Legacy target guard tests passed."
}

main "$@"
