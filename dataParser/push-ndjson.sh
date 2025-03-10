#!/bin/bash

# This script pushes data from our data/en directory to the actual data/en directory 

# Get the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Get the data directory
DATA_DIR="./data"
SUPPORTED_LANG=("en" "ru" "ko" "cmn-Hant" "ja" "de" "es")
# Get all *.ndjson files in the data directory

echo "current dir: $DIR"

for lang in "${SUPPORTED_LANG[@]}"; do
    FILES=$(find $DATA_DIR/$lang -name "*.ndjson")

    # Loop through each file and push it to the actual data directory, overwriting any existing files
    for file in $FILES; do
        echo "Pushing $file to data/$lang"
        cp $file ../renderer/public/data/$lang
    done
done

echo "Pushing generic data to ./data"
cp $DIR/data/generic/* ../renderer/public/data