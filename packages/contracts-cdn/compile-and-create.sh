#!/bin/bash
set -e

# Number of lagrange-basis files required
REQUIRED_LAGRANGE_FILES=12
MAX_BUNDLE_VALIDATION_RETRIES=2

check_lagrange_basis() {
  local dir="$1"
  # Count lagrange-basis files in cache
  count=$(find "$dir" -maxdepth 1 -type f -name "*lagrange-basis*" | wc -l)
  echo "[$dir] Found $count lagrange-basis files"
  [ "$count" -lt "$REQUIRED_LAGRANGE_FILES" ]
}

compile_network() {
  local network="$1"
  local dir="cache/$network"

  mkdir -p "$dir"

  # Run your command while there are fewer than required lagrange files
  while check_lagrange_basis "$dir"; do
    echo "[$network] compiling contracts..."
    # Compile the contracts
    node --experimental-strip-types scripts/compile-contracts.ts "$network"
    sleep 1
  done

  echo "[$network] cache ready"
}

run_create_cache() {
  local network="$1"

  if [ -n "${CONTRACTS_VERSION_OVERRIDE:-}" ]; then
    node --experimental-strip-types scripts/create-cache.ts "$network" "$CONTRACTS_VERSION_OVERRIDE"
  else
    node --experimental-strip-types scripts/create-cache.ts "$network"
  fi
}

run_bundle_validation() {
  local network="$1"

  if [ -n "${CONTRACTS_VERSION_OVERRIDE:-}" ]; then
    node --experimental-strip-types scripts/validate-bundle.ts "$network" "$CONTRACTS_VERSION_OVERRIDE"
  else
    node --experimental-strip-types scripts/validate-bundle.ts "$network"
  fi
}

build_and_validate_network() {
  local network="$1"
  local attempt=0

  compile_network "$network"
  run_create_cache "$network"

  until run_bundle_validation "$network"; do
    attempt=$((attempt + 1))
    if [ "$attempt" -gt "$MAX_BUNDLE_VALIDATION_RETRIES" ]; then
      echo "[$network] bundle validation failed after $MAX_BUNDLE_VALIDATION_RETRIES retries"
      return 1
    fi

    echo "[$network] bundle validation failed, recompiling contracts (attempt $attempt/$MAX_BUNDLE_VALIDATION_RETRIES)..."
    node --experimental-strip-types scripts/compile-contracts.ts "$network"
    sleep 1
    run_create_cache "$network"
  done
}

echo "Creating the cache bundles ..."
build_and_validate_network "mina:devnet"
build_and_validate_network "mina:mainnet"

echo "Done!"
exit 0
