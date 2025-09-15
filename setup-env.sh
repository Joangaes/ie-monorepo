#!/bin/bash

# Setup script for local environment variable substitution
# This script helps test the docker-compose.yml with environment variables locally

echo "🔧 Setting up environment for local testing..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create one based on github-secrets.md"
    echo "💡 You can copy github-secrets.md examples to create a .env file"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

echo "✅ Environment variables loaded from .env file"

# Substitute environment variables in docker-compose.yml
echo "🔄 Substituting environment variables in docker-compose.yml..."
envsubst < docker-compose.yml > docker-compose-local.yml

echo "✅ Created docker-compose-local.yml with substituted values"
echo ""
echo "🚀 You can now run:"
echo "   docker-compose -f docker-compose-local.yml up"
echo ""
echo "🧹 To clean up:"
echo "   rm docker-compose-local.yml"
