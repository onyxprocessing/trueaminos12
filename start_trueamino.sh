#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

REPO_NAME="TrueAminoStore"

echo -e "${CYAN}Starting TrueAmino Application...${NC}"

# Check if directory exists
if [ ! -d "$REPO_NAME" ]; then
    echo -e "${RED}Error: $REPO_NAME directory not found. Please run the deployment script first.${NC}"
    exit 1
fi

# Change to the TrueAminoStore directory
cd "$REPO_NAME" || exit 1

# Set environment variables
export PORT=5000
export HOST=0.0.0.0
export NODE_ENV=development

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Start the development server
echo -e "${GREEN}Starting the application...${NC}"
NODE_ENV=development PORT=5000 HOST=0.0.0.0 npx tsx server/index.ts