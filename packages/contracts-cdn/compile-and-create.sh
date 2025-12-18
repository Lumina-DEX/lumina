#!/bin/bash
set -e

REQUIRED_LAGRANGE_FILES=12

check_lagrange_basis() {
  local dir="$1"
  count=$(find "$dir" -maxdepth 1 -type f -name "*lagrange-basis*" | wc -l)
  echo "[$dir] Found $count lagrange-basis files"
  [ "$count" -lt "$REQUIRED_LAGRANGE_FILES" ]
}

compile_one() {
  local network="$1"
  local dir="cache/$network"

  mkdir -p "$dir"

  while check_lagrange_basis "$dir"; do
    echo "[$network] compiling contracts..."
    NETWORK_TYPE="$network" CACHE_DIR="$dir" \
      node --experimental-strip-types scripts/compile-contracts.ts
    sleep 1
  done

  echo "[$network] cache ready"
}

compile_one "testnet"
compile_one "mainnet"

echo "Creating the cache bundles ..."
# Ici, ton create-cache.ts doit aussi accepter NETWORK_TYPE + CACHE_DIR (voir ci-dessous)
NETWORK_TYPE="testnet" CACHE_DIR="cache/testnet" node --experimental-strip-types scripts/create-cache.ts
NETWORK_TYPE="mainnet" CACHE_DIR="cache/mainnet" node --experimental-strip-types scripts/create-cache.ts

echo "Done!"
exit 0
