#!/bin/bash
set -e

# Number of lagrange-basis files required
REQUIRED_LAGRANGE_FILES=12

check_lagrange_basis() {
    local cache_path="$1"
    # Count lagrange-basis files in cache
    count=$(find "$cache_path" -maxdepth 1 -type f -name "*lagrange-basis*" | wc -l)
    echo "Found $count lagrange-basis files in $cache_path"
    [ "$count" -lt "$REQUIRED_LAGRANGE_FILES" ]
}

compile_network() {
    local network="$1"
    local cache_path="$2"

    mkdir -p "$cache_path"

    # Run your command while there are fewer than required lagrange files
    while check_lagrange_basis "$cache_path"; do
        echo "Fewer than $REQUIRED_LAGRANGE_FILES lagrange files found, compiling contracts for $network..."
        # Compile the contracts
        node --experimental-strip-types scripts/compile-contracts.ts "$network"

        # Optional: add a small delay to prevent tight looping
        sleep 1
    done

    echo "Successfully compiled contracts - $REQUIRED_LAGRANGE_FILES or more lagrange files found for $network"

    echo "Creating the cache bundle for $network ..."
    node --experimental-strip-types scripts/create-cache.ts "$network"
}

# Legacy bundle (kept as-is): devnet/testnet -> cache/
compile_network "mina:devnet" "cache"

# Mainnet bundle: mina:mainnet -> cache/mina_mainnet/
compile_network "mina:mainnet" "cache/mina_mainnet"

echo "Done!"
exit 0
