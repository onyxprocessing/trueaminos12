#!/bin/bash

# Production deployment script for optimized compute usage
echo "Starting production deployment optimizations..."

# Set production environment
export NODE_ENV=production
export DISABLE_LOGGING=true

# Build with production optimizations
npm run build

# Copy static assets to Replit's static folder
mkdir -p /home/runner/static
cp -r public/* /home/runner/static/
cp static/* /home/runner/static/ 2>/dev/null || true

# Set appropriate cache headers for static assets
echo "Static assets moved to /home/runner/static for efficient serving"

echo "Production deployment complete!"