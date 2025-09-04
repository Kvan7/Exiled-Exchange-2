#!/bin/bash

# Copy files from vendor to parser
sh copy-tables.sh

# Build data
echo "Building data"
python ./vendor/client/parserRunner.py

# Copy to data folder
echo "Copying ndjson to data folder"
sh copy-py-ndjson.sh

# Add pseudo mods
echo "Adding pseudo mods"
python ./vendor/pseudo-stats/add-to-new.py

# Add images
echo "Adding temporary images"
python ./data/imageFix.py

# Push ndjson to main data folder
echo "Pushing ndjson to main data folder"
sh push-ndjson.sh