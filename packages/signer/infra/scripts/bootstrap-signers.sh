#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

TARGET_ENV="${TARGET_ENV:-}"
PAYLOAD_FILE="${BOOTSTRAP_PAYLOAD_FILE:-}"
DATABASE_URL_INPUT="${DATABASE_URL:-}"

usage() {
	cat <<'EOF'
Usage: bootstrap-signers.sh --target <env> --payload <bootstrap.json> [--database-url <postgres-url>]

Payload format:
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
			--database-url)
				[[ $# -ge 2 ]] || die "--database-url requires a value"
				DATABASE_URL_INPUT="$2"
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

load_entries() {
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

upsert_signer() {
	local public_key="$1"
	local network="$2"
	local permission="$3"
	local active="$4"

	psql "$DATABASE_URL_INPUT" \
		-v ON_ERROR_STOP=1 \
		-v public_key="$public_key" \
		-v network="$network" \
		-v permission="$permission" \
		-v active="$active" \
		<<'SQL'
INSERT INTO "Network" ("network")
VALUES (:'network')
ON CONFLICT ("network") DO NOTHING;

WITH existing_signer AS (
	SELECT "id"
	FROM "SignerMerkle"
	WHERE "public_key" = :'public_key'
),
inserted_signer AS (
	INSERT INTO "SignerMerkle" ("public_key")
	SELECT :'public_key'
	WHERE NOT EXISTS (SELECT 1 FROM existing_signer)
	RETURNING "id"
),
resolved_signer AS (
	SELECT "id" FROM existing_signer
	UNION ALL
	SELECT "id" FROM inserted_signer
),
updated_network AS (
	UPDATE "SignerMerkleNetwork"
	SET
		"permission" = :'permission'::integer,
		"active" = :'active'::boolean
	WHERE
		"signer_id" = (SELECT "id" FROM resolved_signer LIMIT 1)
		AND "network" = :'network'
	RETURNING "id"
)
INSERT INTO "SignerMerkleNetwork" ("signer_id", "network", "permission", "active")
SELECT
	(SELECT "id" FROM resolved_signer LIMIT 1),
	:'network',
	:'permission'::integer,
	:'active'::boolean
WHERE NOT EXISTS (SELECT 1 FROM updated_network);
SQL
}

verify_signer() {
	local public_key="$1"
	local network="$2"
	local permission="$3"
	local active="$4"

	psql "$DATABASE_URL_INPUT" -At -v ON_ERROR_STOP=1 \
		-v public_key="$public_key" \
		-v network="$network" \
		-v permission="$permission" \
		-v active="$active" \
		<<'SQL' | grep -qx '1'
SELECT 1
FROM "SignerMerkle" s
JOIN "SignerMerkleNetwork" sn ON sn."signer_id" = s."id"
WHERE
	s."public_key" = :'public_key'
	AND sn."network" = :'network'
	AND sn."permission" = :'permission'::integer
	AND sn."active" = :'active'::boolean
LIMIT 1;
SQL
}

main() {
	local network_value payload entries_count=0
	local public_key permission active

	parse_args "$@"
	maybe_source_env

	require_command jq
	require_command psql

	[[ -n "$TARGET_ENV" ]] || die "--target is required"
	[[ -n "$PAYLOAD_FILE" ]] || die "--payload is required"
	[[ -f "$PAYLOAD_FILE" ]] || die "Payload file not found: $PAYLOAD_FILE"
	[[ -n "$DATABASE_URL_INPUT" ]] || die "DATABASE_URL or --database-url is required"

	network_value="$(target_network_value "$TARGET_ENV")"
	entries="$(load_entries)"
	entries_count="$(jq 'length' <<<"$entries")"
	[[ "$entries_count" -gt 0 ]] || die "Bootstrap payload is empty."

	log "Writing ${entries_count} signer rows for ${TARGET_ENV} (${network_value})"
	while IFS= read -r entry; do
		public_key="$(jq -r '.publicKey' <<<"$entry")"
		permission="$(jq -r '.permission' <<<"$entry")"
		active="$(jq -r '.active' <<<"$entry")"

		upsert_signer "$public_key" "$network_value" "$permission" "$active"
		verify_signer "$public_key" "$network_value" "$permission" "$active" || die \
			"Verification failed for signer ${public_key}"
	done < <(jq -c '.[]' <<<"$entries")

	log "Signer bootstrap completed successfully."
}

main "$@"
