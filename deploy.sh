#!/bin/sh
cd TrueAminoStore

# Fix package.json to remove type: module
echo "Fixing package.json to remove ES module type..."
cp package.json package.json.bak
grep -v '"type": "module"' package.json.bak > package.json

# Set up environment variables
echo "PORT=5000
HOST=0.0.0.0
NODE_ENV=production
AIRTABLE_API_KEY=${AIRTABLE_API_KEY}" > .env

# Check if Airtable API key is set
if [ -z "$AIRTABLE_API_KEY" ]; then
    echo "Warning: AIRTABLE_API_KEY is not set. Products may not load correctly."
fi

# Install dependencies
npm install

# Build the client
npm run build

# Copy favicon if it exists
if [ -f "../attached_assets/favicon-32x32.png" ]; then
    mkdir -p public/images public/favicon
    cp "../attached_assets/favicon-32x32.png" ./public/favicon-32x32.png
    cp "../attached_assets/favicon-32x32.png" ./public/favicon-16.png
    cp "../attached_assets/favicon-32x32.png" ./public/favicon-32.png
    cp "../attached_assets/favicon-32x32.png" ./public/images/favicon.png
    cp "../attached_assets/favicon-32x32.png" ./public/favicon/favicon.png
fi

# Start the app
npm start