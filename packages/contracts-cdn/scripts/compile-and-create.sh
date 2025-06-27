#!/bin/bash

# Number of lagrange-basis files required
REQUIRED_LAGRANGE_FILES=12

check_lagrange_basis() {
    # Count lagrange-basis files in ../cache/
    count=$(find ../cache/ -maxdepth 1 -type f -name "*lagrange-basis*" | wc -l)
    echo "Found $count lagrange-basis files"
    [ "$count" -lt "$REQUIRED_LAGRANGE_FILES" ]
}

# Run your command while there are fewer than required lagrange files
while check_lagrange_basis; do
    echo "Fewer than $REQUIRED_LAGRANGE_FILES lagrange files found, compiling contracts..."
    # Compile the contracts
    node --experimental-strip-types compile-contracts.ts

    # Optional: add a small delay to prevent tight looping
    sleep 1
done

echo "Successfully compiled contracts - $REQUIRED_LAGRANGE_FILES or more lagrange files found"

echo "Creating the cache ..."

node --experimental-strip-types create-cache.ts

echo "Done!"
