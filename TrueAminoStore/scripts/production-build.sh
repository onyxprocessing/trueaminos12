#!/bin/bash

# Production Build Script for TrueAminoStore
# This script prepares the project for production deployment with optimized assets

# Display start message
echo "🚀 Starting production build for TrueAminoStore..."
echo "---------------------------------------------------"

# Set environment to production
export NODE_ENV=production

# Navigate to project root
cd "$(dirname "$0")/.."
ROOT_DIR=$(pwd)

# Clean previous build
echo "🧹 Cleaning previous builds..."
rm -rf dist
mkdir -p dist/public

# Install dependencies if needed
if [ "$1" == "--fresh" ]; then
  echo "📦 Installing fresh dependencies..."
  npm ci
else
  echo "📦 Using existing dependencies..."
fi

# Build the client
echo "🔨 Building client application..."
cd $ROOT_DIR
npm run build

# Optimize images if needed
echo "🖼️  Optimizing images..."
find dist/public -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) -exec sh -c '
  echo "Optimizing $1"
  if [ -x "$(command -v imagemin)" ]; then
    imagemin "$1" > "${1}.tmp" && mv "${1}.tmp" "$1"
  fi
' sh {} \;

# Copy server files
echo "📋 Preparing server files..."
mkdir -p dist/server
cp -r server/ dist/server/
cp -r shared/ dist/shared/
cp express-session.d.ts dist/

# Create production package.json
echo "📝 Creating production package.json..."
node -e "
  const pkg = require('./package.json');
  const prodPkg = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    author: pkg.author,
    license: pkg.license,
    dependencies: pkg.dependencies,
    engines: pkg.engines || { node: '>=16.0.0' },
    scripts: {
      start: 'NODE_ENV=production node --experimental-specifier-resolution=node server-starter.js'
    }
  };
  require('fs').writeFileSync('./dist/package.json', JSON.stringify(prodPkg, null, 2));
"

# Copy main server entry
cp server-starter.js dist/

# Generate compressed versions of JS/CSS files for better CDN delivery
echo "🗜️  Generating compressed asset versions..."
find dist/public -type f \( -name "*.js" -o -name "*.css" \) -exec sh -c '
  echo "Compressing $1"
  gzip -9 -k "$1"
  if [ -x "$(command -v brotli)" ]; then
    brotli -q 11 -k "$1"
  fi
' sh {} \;

# Create .env file with production settings
echo "🔐 Creating production environment configuration..."
cat > dist/.env << EOL
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
EOL

# Create version.txt for deployment tracking
echo "📌 Creating version information..."
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
echo "{\"version\": \"${TIMESTAMP}\", \"git\": \"${GIT_HASH}\", \"build\": \"production\"}" > dist/public/version.json

# Add placeholder for runtime secrets
echo "# Runtime secrets will be injected during deployment" > dist/secrets.env

# Print build stats
echo "📊 Build statistics:"
du -h -d 1 dist/
find dist/public -type f -name "*.js" | wc -l | xargs echo "JavaScript files:"
find dist/public -type f -name "*.css" | wc -l | xargs echo "CSS files:"
find dist/public -type f -name "*.gz" | wc -l | xargs echo "Gzipped files:"
find dist/public -type f -name "*.br" | wc -l | xargs echo "Brotli files:"

echo "✅ Production build completed successfully!"
echo "---------------------------------------------------"
echo "To deploy, copy the 'dist' directory to your production server and run 'npm start'"