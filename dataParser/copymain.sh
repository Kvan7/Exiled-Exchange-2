#!/bin/bash

TARGET_DIR="../exiled-exchange-2/dataParser"

rsync -av --exclude-from='.gitignore' --exclude='data/json' --exclude='data/vendor' --exclude="*.json" --exclude='.git' ./ "$TARGET_DIR"

cp ./data/vendor/config.json "$TARGET_DIR/data/vendor"

echo "Files successfully copied to $TARGET_DIR, excluding git-ignored files and 'data' directory."
