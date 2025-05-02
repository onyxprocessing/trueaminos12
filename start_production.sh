#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

cd TrueAminoStore

# Remove type: module from package.json to avoid ESM issues
echo "Fixing package.json..."
sed -i '/"type": "module"/d' package.json

# Create .env file with necessary environment variables
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

# Build the client and server
echo "Building application..."
npm run build

# Copy favicon to public directory
if [ -f "../attached_assets/favicon-32x32.png" ]; then
    echo "Adding favicon..."
    mkdir -p dist/client/favicon
    cp "../attached_assets/favicon-32x32.png" dist/client/favicon-32x32.png
    cp "../attached_assets/favicon-32x32.png" dist/client/favicon-16x16.png
    cp "../attached_assets/favicon-32x32.png" dist/client/favicon.ico
fi

# Start the production server
echo "Starting server..."
node dist/index.js