#!/bin/bash

# Make sure we have the environment variables
if [ -z "$AIRTABLE_API_KEY" ]; then
    echo "Error: AIRTABLE_API_KEY is not set. Please add it as a secret in your Replit environment."
    exit 1
fi

# Create .env file with necessary environment variables in the TrueAminoStore directory
cd TrueAminoStore || exit 1

# Create .env file with environment variables
echo "PORT=5000
HOST=0.0.0.0
NODE_ENV=production
AIRTABLE_API_KEY=${AIRTABLE_API_KEY}" > .env

# Fix package.json to remove type: module
echo "Fixing package.json to remove ES module type..."
cp package.json package.json.bak
grep -v '"type": "module"' package.json.bak > package.json

# Install dependencies
npm install

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
exec npm start