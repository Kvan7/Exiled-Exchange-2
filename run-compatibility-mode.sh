#!/bin/bash
# Compatibility mode for systems with sandbox issues
# Use ONLY if the main script fails with sandbox errors

echo ""
echo "⚠️  WARNING: RUNNING IN COMPATIBILITY MODE"
echo "This mode reduces security by disabling Electron sandbox"
echo "Only use if ./auto-update.sh fails with sandbox errors"
echo ""
read -p "Continue with reduced security? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Starting in compatibility mode..."
    EXILED_SANDBOX_ENABLED=false ./auto-update.sh run
else
    echo "❌ Cancelled. Use ./auto-update.sh for secure mode."
fi
