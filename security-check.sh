#!/bin/bash
# Quick security check script

echo "🔍 Exiled Exchange 2 Security Check"
echo "===================================="

# Check sandbox status
echo ""
echo "🛡️  Sandbox Status:"
if grep -q 'SANDBOX_ENABLED="${EXILED_SANDBOX_ENABLED:-true}"' auto-update.sh; then
    echo "   ✅ Sandbox ENABLED by default (secure)"
else
    echo "   ❌ Sandbox DISABLED by default (insecure)"
fi

# Check for JWT tokens (specifically whisper_token)
echo ""
echo "🔐 JWT Token Status:"
if grep -q "REDACTED_WHISPER_TOKEN" renderer/src/web/price-check/trade/sample-response.json 2>/dev/null; then
    echo "   ✅ JWT tokens sanitized"
else
    echo "   ⚠️  Checking for actual JWT whisper tokens..."
    if grep -q "whisper_token.*eyJ" renderer/src/web/price-check/trade/sample-response.json 2>/dev/null; then
        echo "   ❌ Real JWT tokens found in whisper_token fields"
    else
        echo "   ✅ No JWT tokens detected"
    fi
fi

# Check permissions
echo ""
echo "🔒 File Permissions:"
if [ -x "auto-update.sh" ]; then
    echo "   ✅ Scripts are executable"
else
    echo "   ❌ Scripts may have permission issues"
fi

# Check for running instance
echo ""
echo "🚀 Application Status:"
if pgrep -f "Exiled Exchange 2" > /dev/null; then
    echo "   ✅ Application is running"
else
    echo "   ℹ️  Application not currently running"
fi

echo ""
echo "📋 Usage:"
echo "  Secure mode:       ./auto-update.sh run"
echo "  Compatibility:     ./run-compatibility-mode.sh"
echo "  Security check:    ./security-check.sh"
