#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/signer-fleet-common.sh
source "$SCRIPT_DIR/lib/signer-fleet-common.sh"

TARGET_ENV="${TARGET_ENV:-}"
TARGET_HOSTNAME_OVERRIDE="${TARGET_HOSTNAME_OVERRIDE:-}"
SSH_ALIAS=""
IMAGE_DIGEST="${IMAGE_DIGEST:-}"
GIT_SHA="${GIT_SHA:-}"

usage() {
	cat <<'EOF'
Usage: deploy-image-over-ssh.sh --target <env> --image-digest <sha256 or image-ref> --git-sha <git-sha> [--ssh-alias <alias>] [--hostname <hostname>]
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
			--image-digest)
				[[ $# -ge 2 ]] || die "--image-digest requires a value"
				IMAGE_DIGEST="$2"
				shift 2
				;;
			--git-sha)
				[[ $# -ge 2 ]] || die "--git-sha requires a value"
				GIT_SHA="$2"
				shift 2
				;;
			--ssh-alias)
				[[ $# -ge 2 ]] || die "--ssh-alias requires a value"
				SSH_ALIAS="$2"
				shift 2
				;;
			--hostname)
				[[ $# -ge 2 ]] || die "--hostname requires a value"
				TARGET_HOSTNAME_OVERRIDE="$2"
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

run_remote() {
	local -a ssh_command
	build_ssh_command ssh_command "$SSH_ALIAS"
	"${ssh_command[@]}" "$1"
}

wait_for_service() {
	local attempts=30
	local sleep_seconds=2

	for ((attempt = 1; attempt <= attempts; attempt += 1)); do
		if [[ "$(run_remote "systemctl is-active lumina-signer" || true)" == "active" ]]; then
			return 0
		fi
		sleep "$sleep_seconds"
	done

	return 1
}

probe_https() {
	local hostname="$1"
	local response

	response="$(curl_graphql "https://${hostname}/graphql" 'query Healthcheck { __typename }' '{}' "")"
	jq -e '.data.__typename == "Query"' >/dev/null <<<"$response" || die "HTTPS probe failed for ${hostname}."
}

main() {
	local hostname image_ref released_at

	parse_args "$@"
	maybe_source_fleet_env

	require_command curl
	require_command jq
	require_command ssh

	[[ -n "$TARGET_ENV" ]] || die "--target is required"
	[[ -n "$IMAGE_DIGEST" ]] || die "--image-digest is required"
	[[ -n "$GIT_SHA" ]] || die "--git-sha is required"

	if [[ -z "$SSH_ALIAS" && -z "${SSH_HOST:-}" ]]; then
		SSH_ALIAS="$(target_alias "$TARGET_ENV" service)"
	fi

	if [[ -n "$TARGET_HOSTNAME_OVERRIDE" ]]; then
		hostname="$TARGET_HOSTNAME_OVERRIDE"
	else
		hostname="$(target_hostname "$TARGET_ENV")"
	fi

	image_ref="$(normalize_image_ref "$IMAGE_DIGEST")"
	released_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

	guard_not_legacy_host "$hostname" "Target hostname"
	if [[ -n "$SSH_ALIAS" ]]; then
		guard_not_legacy_host "$SSH_ALIAS" "SSH alias"
	fi

	log "Deploying ${image_ref} to ${TARGET_ENV}"
	run_remote "sudo /run/current-system/sw/bin/lumina-signer-apply-release '${image_ref}' '${GIT_SHA}' '${released_at}'"
	run_remote "sudo /run/current-system/sw/bin/systemctl restart lumina-signer"

	wait_for_service || die "lumina-signer did not become active on ${TARGET_ENV}."
	[[ "$(run_remote "systemctl is-active caddy")" == "active" ]] || die "caddy is not active on ${TARGET_ENV}."

	probe_https "$hostname"
	log "Deployment finished successfully."
}

main "$@"
