#!/bin/bash

# This script pushes data from our data/en directory to the actual data/en directory 

# Get the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Get the data directory
DATA_DIR="./data/en"

# Get all *.ndjson files in the data directory
FILES=$(find $DATA_DIR -name "*.ndjson")

# Loop through each file and push it to the actual data directory, overwriting any existing files
for file in $FILES; do
    echo "Pushing $file to data/en"
    cp $file ../data/en
done