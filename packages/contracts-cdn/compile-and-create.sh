#!/bin/bash
set -e

REQUIRED_LAGRANGE_FILES=12

check_lagrange_basis() {
  local dir="$1"
  count=$(find "$dir" -maxdepth 1 -type f -name "*lagrange-basis*" | wc -l)
  echo "[$dir] Found $count lagrange-basis files"
  [ "$count" -lt "$REQUIRED_LAGRANGE_FILES" ]
}

compile_network() {
  local network="$1"
  local dir="cache/$network"

  mkdir -p "$dir"

  while check_lagrange_basis "$dir"; do
    echo "[$network] compiling contracts..."
    node --experimental-strip-types scripts/compile-contracts.ts "$network"
    sleep 1
  done

  echo "[$network] cache ready"
}

compile_network "mina:devnet"
compile_network "mina:mainnet"

echo "Creating the cache bundles ..."
node --experimental-strip-types scripts/create-cache.ts "mina:devnet"
node --experimental-strip-types scripts/create-cache.ts "mina:mainnet"

echo "Done!"
exit 0
