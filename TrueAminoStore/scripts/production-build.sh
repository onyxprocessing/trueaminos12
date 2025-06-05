#!/bin/bash
# Production build script with performance optimizations
# This applies all optimizations for better performance and smaller bundles

echo "Starting production build with optimizations..."

# Set production environment
export NODE_ENV=production

# Clean any previous build artifacts
echo "Cleaning previous builds..."
rm -rf dist
rm -rf .vite

# Install dependencies if needed
echo "Ensuring dependencies are installed..."
npm install --no-fund --no-audit

# Run CSS optimizations
echo "Optimizing CSS..."
npx postcss client/src/index.css -o client/src/index.optimized.css
mv client/src/index.optimized.css client/src/index.css

# Build with Vite production settings
echo "Running Vite production build..."
npx vite build --mode production

# Optimize server code
echo "Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --minify --outdir=dist

# Apply extra optimizations for JS compression
echo "Applying Terser optimizations..."
npx terser dist/assets/*.js -c passes=3,drop_console=true,drop_debugger=true,ecma=2020 -m -o dist/assets/index.min.js

echo "Production build completed successfully!"