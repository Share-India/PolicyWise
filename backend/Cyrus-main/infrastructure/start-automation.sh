#!/bin/bash

# CYRUS.PRO - n8n Automation Starter
# This script handles Docker initialization and public HTTPS tunneling 

echo "🚀 Initializing CYRUS n8n Production-Lite Stack..."

# 1. Load environment variables for Docker
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

# 2. Start Unified Docker Stack (App + n8n + Postgres)
# Removing 'version' attribute warning by using docker-compose natively
docker compose up -d --build

echo "✅ Docker Services are initializing in the background."
echo "🔗 Creating a secure HTTPS tunnel via LocalTunnel..."

# 3. Start LocalTunnel for n8n Webhooks (HTTPS)
# This will output a public URL you can use in your .env.local
npx -y localtunnel --port 5678
