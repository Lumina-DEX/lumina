#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/signer-fleet-common.sh
source "$SCRIPT_DIR/lib/signer-fleet-common.sh"

assert_fails() {
	local description="$1"
	local command="$2"

	if bash -lc "$command" >/dev/null 2>&1; then
		die "Expected failure: ${description}"
	fi
}

main() {
	local common_script="$SCRIPT_DIR/lib/signer-fleet-common.sh"

	assert_fails \
		"legacy IP guard" \
		"source '$common_script'; guard_not_legacy_host '157.180.50.185' 'test host'"

	assert_fails \
		"legacy alias guard" \
		"source '$common_script'; guard_not_legacy_reference 'lumina' 'test alias'"

	log "Legacy host guard tests passed."
}

main "$@"
