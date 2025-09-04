#!/bin/bash

# A Script to perform all update steps for the dataParser.
# We fetch data from POE's API, Get Data from the Game, and handle all exporting
# Finally we build the index files for the renderer

echo "Fetching data from POE API"
sh pull-json.sh

echo "Getting data from POE"
npm run get-game-data

echo "Exporting Data"
sh export-data.sh

echo "Building Index Files"
cd ../renderer && npm run make-index-files

echo "Update Complete!"