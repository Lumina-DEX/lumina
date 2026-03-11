#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/signer-fleet-common.sh
source "$SCRIPT_DIR/lib/signer-fleet-common.sh"

TARGET_ENV="${TARGET_ENV:-}"
TARGET_HOSTNAME_OVERRIDE="${TARGET_HOSTNAME_OVERRIDE:-}"
PAYLOAD_FILE="${BOOTSTRAP_PAYLOAD_FILE:-}"

usage() {
	cat <<'EOF'
Usage: bootstrap-signers.sh --target <env> --payload <bootstrap.json> [--hostname <hostname>]

Bootstrap payload format:
{
  "signers": [
    { "publicKey": "B62...", "permission": 1, "active": true }
  ]
}
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
			--payload)
				[[ $# -ge 2 ]] || die "--payload requires a value"
				PAYLOAD_FILE="$2"
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

graphql_admin() {
	local hostname="$1"
	local query="$2"
	local variables_json="$3"

	curl_graphql \
		"https://${hostname}/graphql" \
		"$query" \
		"$variables_json" \
		"Authorization: Bearer ${SIGNER_API_KEY}"
}

load_payload_entries() {
	jq -ce '
		if type == "array" then .
		elif type == "object" and has("signers") then .signers
		else error("payload must be an array or an object with a signers array")
		end
		| map(
			if (.publicKey | type) != "string" then
				error("publicKey must be a string")
			elif (.permission | type) != "number" then
				error("permission must be a number")
			else
				{
					publicKey: .publicKey,
					permission: (.permission | floor),
					active: (.active // true)
				}
			end
		)
	' "$PAYLOAD_FILE"
}

refresh_signers() {
	local hostname="$1"
	graphql_admin \
		"$hostname" \
		'query ExistingSigners { signers { id publicKey networks { network permission active } } }' \
		'{}'
}

main() {
	local hostname network_enum network_value payload_entries signers_json
	local payload_count=0
	local public_key permission active signer_id network_match current_permission current_active

	parse_args "$@"
	maybe_source_fleet_env

	require_command curl
	require_command jq

	[[ -n "$TARGET_ENV" ]] || die "--target is required"
	[[ -n "${SIGNER_API_KEY:-}" ]] || die "SIGNER_API_KEY is required"
	[[ -n "$PAYLOAD_FILE" ]] || die "--payload is required"
	[[ -f "$PAYLOAD_FILE" ]] || die "Payload file not found: $PAYLOAD_FILE"

	if [[ -n "$TARGET_HOSTNAME_OVERRIDE" ]]; then
		hostname="$TARGET_HOSTNAME_OVERRIDE"
	else
		hostname="$(target_hostname "$TARGET_ENV")"
	fi

	guard_not_legacy_host "$hostname" "Target hostname"

	network_enum="$(target_graphql_enum "$TARGET_ENV")"
	network_value="$(target_network_value "$TARGET_ENV")"
	payload_entries="$(load_payload_entries)"
	payload_count="$(jq 'length' <<<"$payload_entries")"
	[[ "$payload_count" -gt 0 ]] || die "Bootstrap payload is empty."

	log "Bootstrapping ${payload_count} signer entries for ${TARGET_ENV}"
	signers_json="$(refresh_signers "$hostname")"

	while IFS= read -r entry; do
		public_key="$(jq -r '.publicKey' <<<"$entry")"
		permission="$(jq -r '.permission' <<<"$entry")"
		active="$(jq -r '.active' <<<"$entry")"

		signer_id="$(
			jq -er --arg public_key "$public_key" '
				.data.signers[]
				| select(.publicKey == $public_key)
				| .id
			' <<<"$signers_json" 2>/dev/null || true
		)"

		if [[ -z "$signer_id" ]]; then
			signer_id="$(
				graphql_admin \
					"$hostname" \
					'mutation CreateSigner($input: CreateSignerInput!) { createSigner(input: $input) { id } }' \
					"$(jq -cn --arg publicKey "$public_key" '{input: { publicKey: $publicKey }}')" |
					jq -er '.data.createSigner.id'
			)"
			log "Created signer ${public_key} with id ${signer_id}"
			signers_json="$(refresh_signers "$hostname")"
		fi

		network_match="$(
			jq -ec --arg public_key "$public_key" --arg network "$network_value" '
				.data.signers[]
				| select(.publicKey == $public_key)
				| .networks[]
				| select(.network == $network)
			' <<<"$signers_json" 2>/dev/null || true
		)"

		if [[ -z "$network_match" ]]; then
			graphql_admin \
				"$hostname" \
				'mutation CreateSignerNetwork($input: CreateSignerNetworkInput!) { createSignerNetwork(input: $input) { id } }' \
				"$(jq -cn --argjson signerId "$signer_id" --arg network "$network_enum" --argjson permission "$permission" --argjson active "$active" '{input: { signerId: $signerId, network: $network, permission: $permission, active: $active }}')" \
				>/dev/null
			log "Added signer ${public_key} to ${network_value}"
			signers_json="$(refresh_signers "$hostname")"
			continue
		fi

		current_permission="$(jq -r '.permission' <<<"$network_match")"
		current_active="$(jq -r '.active' <<<"$network_match")"

		if [[ "$current_permission" != "$permission" || "$current_active" != "$active" ]]; then
			graphql_admin \
				"$hostname" \
				'mutation UpdateSignerNetwork($signerId: Int!, $network: Network!, $input: UpdateSignerNetworkInput!) { updateSignerNetwork(signerId: $signerId, network: $network, input: $input) { id } }' \
				"$(jq -cn --argjson signerId "$signer_id" --arg network "$network_enum" --argjson permission "$permission" --argjson active "$active" '{signerId: $signerId, network: $network, input: { permission: $permission, active: $active }}')" \
				>/dev/null
			log "Updated signer ${public_key} on ${network_value}"
			signers_json="$(refresh_signers "$hostname")"
		else
			log "Signer ${public_key} already matches ${network_value}"
		fi
	done < <(jq -c '.[]' <<<"$payload_entries")

	signers_json="$(
		graphql_admin \
			"$hostname" \
			'query VerifySigners($network: Network) { signers(network: $network) { publicKey networks { network permission active } } }' \
			"$(jq -cn --arg network "$network_enum" '{network: $network}')"
	)"

	while IFS= read -r entry; do
		public_key="$(jq -r '.publicKey' <<<"$entry")"
		permission="$(jq -r '.permission' <<<"$entry")"
		active="$(jq -r '.active' <<<"$entry")"

		jq -e \
			--arg public_key "$public_key" \
			--arg network "$network_value" \
			--argjson permission "$permission" \
			--argjson active "$active" '
				any(
					.data.signers[];
					.publicKey == $public_key
					and any(.networks[]?; .network == $network and .permission == $permission and .active == $active)
				)
			' <<<"$signers_json" >/dev/null || die \
			"Verification failed for signer ${public_key} on ${network_value}."
	done < <(jq -c '.[]' <<<"$payload_entries")

	log "Bootstrap verification succeeded for ${TARGET_ENV}."
}

main "$@"
