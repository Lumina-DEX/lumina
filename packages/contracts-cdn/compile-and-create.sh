#!/bin/bash
set -e

# Number of lagrange-basis files required
REQUIRED_LAGRANGE_FILES=12

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

compile_network "mina:devnet"
compile_network "mina:mainnet"

echo "Creating the cache bundles ..."
node --experimental-strip-types scripts/create-cache.ts "mina:devnet"
node --experimental-strip-types scripts/create-cache.ts "mina:mainnet"

echo "Done!"
exit 0
