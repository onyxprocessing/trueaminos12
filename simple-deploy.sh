#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}Starting TrueAmino deployment with super-simple approach...${NC}"

# Verify that AIRTABLE_API_KEY is set
if [ -z "$AIRTABLE_API_KEY" ]; then
    echo -e "${RED}Error: AIRTABLE_API_KEY is not set. Please add it as a secret in your Replit environment.${NC}"
    exit 1
fi
echo -e "${GREEN}Using existing AIRTABLE_API_KEY from environment${NC}"

# Create .env file with necessary environment variables
echo "PORT=5000
HOST=0.0.0.0
NODE_ENV=production
AIRTABLE_API_KEY=${AIRTABLE_API_KEY}" > .env

echo -e "${GREEN}Created .env file with necessary environment variables${NC}"

# Start the simple static server
echo -e "${GREEN}Starting simple static server on port 5000...${NC}"
exec node static-server.js