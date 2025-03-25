#!/bin/bash

check_lagrange_basis() {
    # Count lagrange-basis files in ../cache/
    count=$(find ../cache/ -maxdepth 1 -type f -name "*lagrange-basis*" | wc -l)
    echo "Found $count lagrange-basis files"
    [ "$count" -lt 8 ]
}

# Run your command while there are fewer than 8 lagrange files
while check_lagrange_basis; do
    echo "Fewer than 8 lagrange files found, compiling contracts..."
    # Compile the contracts
    node --experimental-strip-types compile-contracts.ts

    # Optional: add a small delay to prevent tight looping
    sleep 1
done

echo "Succesfully compiled contracts - 8 or more lagrange files found"

echo "Creating the cache ..."

node --experimental-strip-types create-cache.ts

echo "Done!"
