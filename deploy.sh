#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}Starting TrueAminoStore deployment...${NC}"

# Execute the replit.deploy script
if [ -f "./replit.deploy" ]; then
    echo -e "${GREEN}Found replit.deploy script. Starting deployment...${NC}"
    chmod +x ./replit.deploy
    exec ./replit.deploy
else
    echo -e "${RED}Error: replit.deploy script not found. Please ensure it exists in the root directory.${NC}"
    exit 1
fi