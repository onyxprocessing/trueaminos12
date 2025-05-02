#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}Starting TrueAminoStore application...${NC}"

# Set environment variables directly 
export PORT=5000
export HOST=0.0.0.0
export NODE_ENV=development

# Change to the TrueAminoStore directory
cd TrueAminoStore || exit 1

# Check if npm dependencies are installed
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Start the development server directly
echo -e "${GREEN}Starting the development server...${NC}"
NODE_ENV=development PORT=5000 HOST=0.0.0.0 npx tsx server/index.ts