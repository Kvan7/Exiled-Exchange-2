#!/bin/bash
set -euo pipefail

# Setup script for Exiled Exchange 2 auto-update

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Setting up Exiled Exchange 2 auto-update..."

# Add cron job to check for updates every 6 hours
CRON_JOB="0 */6 * * * $SCRIPT_DIR/auto-update.sh check >> $SCRIPT_DIR/auto-update.log 2>&1"
if ! crontab -l 2>/dev/null | grep -F -q "$CRON_JOB"; then
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "Cron job added to check for updates every 6 hours"
else
    echo "Cron job already exists - no duplicate created"
fi
echo "The app will auto-start on system boot"
echo ""
echo "Available commands:"
echo "  ./auto-update.sh         - Check for updates and run"
echo "  ./auto-update.sh check   - Only update if new version available"
echo "  ./auto-update.sh run     - Just run the app"
echo "  ./auto-update.sh stop    - Stop the app"
echo "  ./auto-update.sh force-build - Force rebuild and run"
echo ""
echo "Setup complete!"