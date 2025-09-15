#!/bin/bash
set -e

# Enhanced Next.js entrypoint with validation
# Ensures proper logging to stdout/stderr for both EB logs and CloudWatch

echo "=================================="
echo "⚡ NEXT.JS CONTAINER STARTUP"
echo "=================================="
echo "Timestamp: $(date)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Working directory: $(pwd)"
echo "Container hostname: $(hostname)"
echo "User: $(whoami)"

# Environment validation
echo ""
echo "=== ENVIRONMENT CONFIGURATION ==="
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo "PORT: ${PORT:-not set}"
echo "NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-not set}"
echo "NEXT_TELEMETRY_DISABLED: ${NEXT_TELEMETRY_DISABLED:-not set}"
echo "NODE_OPTIONS: ${NODE_OPTIONS:-not set}"

# Validate build artifacts
echo ""
echo "=== VALIDATING BUILD ARTIFACTS ==="

if [ ! -d ".next" ]; then
    echo "❌ .next directory not found. Build may have failed."
    echo "Available directories:"
    ls -la
    exit 1
else
    echo "✅ .next directory found"
    echo "Build info:"
    if [ -f ".next/BUILD_ID" ]; then
        echo "   Build ID: $(cat .next/BUILD_ID)"
    fi
    if [ -f ".next/build-manifest.json" ]; then
        echo "   Build manifest exists"
    fi
fi

if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
else
    echo "✅ package.json found"
    echo "   App name: $(node -p "require('./package.json').name || 'unknown'")"
    echo "   Version: $(node -p "require('./package.json').version || 'unknown'")"
fi

if [ ! -f "next.config.js" ] && [ ! -f "next.config.ts" ]; then
    echo "⚠️  No Next.js config file found (this may be normal)"
else
    echo "✅ Next.js config file found"
fi

# Validate Node.js can start
echo ""
echo "=== VALIDATING NODE.JS SETUP ==="
node -e "
console.log('✅ Node.js runtime validation successful');
console.log('   Process version:', process.version);
console.log('   Platform:', process.platform);
console.log('   Architecture:', process.arch);
console.log('   Memory usage:', Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB');
" || {
    echo "❌ Node.js validation failed. Container will exit."
    exit 1
}

echo ""
echo "=================================="
echo "🚀 STARTING NEXT.JS SERVER"
echo "=================================="
echo "Command: $@"
echo "All logs will be sent to stdout/stderr for EB and CloudWatch visibility"
echo ""

# Execute the main command (npm start)
# Using exec ensures:
# 1. npm/Next.js becomes PID 1 for proper signal handling
# 2. All output goes to stdout/stderr for both EB logs and CloudWatch
# 3. Container exits when Next.js exits
exec "$@"
