#!/bin/bash
set -e

cd TrueAminoStore

# Fix package.json to remove type: module
echo "Fixing package.json..."
cp package.json package.json.bak
grep -v '"type": "module"' package.json.bak > package.json

# Create .env file with environment variables
echo "Setting up environment variables..."
cat > .env << EOL
PORT=5000
HOST=0.0.0.0
NODE_ENV=production
AIRTABLE_API_KEY=${AIRTABLE_API_KEY}
EOL

# Install dependencies
echo "Installing dependencies..."
npm install

# Modify vite.ts to look for the correct build directory
echo "Modifying server code to fix build directory path..."
mkdir -p server/public

# Patch the server/vite.ts file to look for dist/client instead of public
sed -i 's|const distPath = path.resolve(import.meta.dirname, "public");|const distPath = path.resolve("dist/client");|' server/vite.ts

# Build the client and server
echo "Building application..."
npm run build

# Copy built client files where the server expects them
echo "Copying build files to correct location..."
mkdir -p server/public
cp -r dist/client/* server/public/

# Copy favicon to both locations to be safe
if [ -f "../attached_assets/favicon-32x32.png" ]; then
    echo "Adding favicon..."
    mkdir -p dist/client/favicon server/public/favicon
    cp "../attached_assets/favicon-32x32.png" dist/client/favicon-32x32.png
    cp "../attached_assets/favicon-32x32.png" dist/client/favicon-16x16.png
    cp "../attached_assets/favicon-32x32.png" dist/client/favicon.ico
    cp "../attached_assets/favicon-32x32.png" server/public/favicon-32x32.png
    cp "../attached_assets/favicon-32x32.png" server/public/favicon-16x16.png
    cp "../attached_assets/favicon-32x32.png" server/public/favicon.ico
fi

# Start the production server using the original start script
echo "Starting server..."
npm start