#!/bin/bash

# Define the target directory
TARGET_DIR="../exiled-exchange-2/dataParser"

# Use rsync to copy files, excluding git-ignored files and the 'data' directory
rsync -av --exclude-from='.gitignore' --exclude='data' --exclude='.git' ./ "$TARGET_DIR"

cp ./data/vendor/config.json "$TARGET_DIR/data/vendor"

echo "Files successfully copied to $TARGET_DIR, excluding git-ignored files and 'data' directory."
