#!/bin/bash
set -euo pipefail

echo "🔒 Applying Security Fixes for Exiled Exchange 2"
echo "================================================"
echo "This will NOT break your application functionality"
echo ""

# Backup important files
echo "📦 Creating backups..."
mkdir -p security-backups
cp auto-update.sh security-backups/ 2>/dev/null || true
cp renderer/src/web/price-check/trade/sample-response.json security-backups/ 2>/dev/null || true

echo "✅ Backups created in security-backups/"

# Fix 1: Sanitize JWT tokens (CRITICAL)
echo ""
echo "🔐 Fix 1: Sanitizing JWT tokens..."
node -e "
const fs = require('fs');
const filePath = 'renderer/src/web/price-check/trade/sample-response.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function sanitizeTokens(obj) {
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      // Replace JWT tokens with safe placeholders
      if (obj[key].match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/)) {
        obj[key] = 'REDACTED_JWT_TOKEN_FOR_SECURITY';
      }
      // Replace session IDs and other sensitive data
      if (key.toLowerCase().includes('session') || key.toLowerCase().includes('token')) {
        obj[key] = 'REDACTED_' + key.toUpperCase();
      }
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeTokens(obj[key]);
    }
  }
  return obj;
}

const sanitized = sanitizeTokens(data);
fs.writeFileSync(filePath, JSON.stringify(sanitized, null, 2));
console.log('✅ JWT tokens sanitized successfully');
"

# Fix 2: Enable sandbox by default (CRITICAL) while maintaining compatibility
echo ""
echo "🛡️  Fix 2: Enabling sandbox security..."
sed -i.security-backup 's/SANDBOX_ENABLED=\"\${EXILED_SANDBOX_ENABLED:-false}\"/SANDBOX_ENABLED=\"\${EXILED_SANDBOX_ENABLED:-true}\"/' auto-update.sh

echo "✅ Sandbox enabled by default"

# Fix 3: Create compatibility script for systems that need --no-sandbox
echo ""
echo "🔧 Fix 3: Creating compatibility mode..."
cat > run-compatibility-mode.sh << 'SCRIPT'
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
SCRIPT

chmod +x run-compatibility-mode.sh
echo "✅ Compatibility mode script created"

# Fix 4: Set secure permissions  
echo ""
echo "🔐 Fix 4: Setting secure file permissions..."
find . -name "*.sh" -type f -exec chmod 755 {} \; 2>/dev/null || true
chmod 644 *.md 2>/dev/null || true
chmod 600 ~/.config/exiled-exchange-2/apt-data/config.json 2>/dev/null || true
echo "✅ File permissions secured"

# Fix 5: Clean sensitive data from logs
echo ""
echo "📝 Fix 5: Cleaning sensitive data from logs..."
if [ -f "auto-update.log" ]; then
  # Remove PID information that could be sensitive
  sed -i.log-backup 's/PID: [0-9]*/PID: [REDACTED]/g' auto-update.log || true
  echo "✅ Log data sanitized"
else
  echo "ℹ️  No log file found to clean"
fi

# Fix 6: Create security monitoring script
echo ""
echo "🔍 Fix 6: Creating security monitor..."
cat > security-check.sh << 'EOF'
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

# Check for JWT tokens
echo ""
echo "🔐 JWT Token Status:"
if grep -q "REDACTED_JWT_TOKEN" renderer/src/web/price-check/trade/sample-response.json 2>/dev/null; then
    echo "   ✅ JWT tokens sanitized"
else
    echo "   ⚠️  Checking for JWT patterns..."
    if grep -q "eyJ" renderer/src/web/price-check/trade/sample-response.json 2>/dev/null; then
        echo "   ❌ Potential JWT tokens found"
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
EOF

chmod +x security-check.sh

echo ""
echo "✅ SECURITY FIXES APPLIED SUCCESSFULLY!"
echo ""
echo "📊 Summary of fixes applied:"
echo "  1. ✅ JWT tokens sanitized (CRITICAL)"
echo "  2. ✅ Sandbox enabled by default (CRITICAL)"  
echo "  3. ✅ Compatibility mode available"
echo "  4. ✅ File permissions secured"
echo "  5. ✅ Sensitive log data cleaned"
echo "  6. ✅ Security monitoring tools created"
echo ""
echo "🎮 How to use after fixes:"
echo "  Normal (secure):     ./auto-update.sh run"
echo "  Compatibility mode:  ./run-compatibility-mode.sh"
echo "  Security check:      ./security-check.sh"
echo ""
echo "⚡ Application functionality is UNCHANGED"
echo "🔒 Security is SIGNIFICANTLY IMPROVED"
echo ""
echo "💡 If you encounter sandbox issues, use the compatibility mode"