#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Repository URL
REPO_URL="https://github.com/onyxprocessing/TrueAminoStore.git"
REPO_NAME="TrueAminoStore"

echo -e "${CYAN}Starting import of ${REPO_NAME} repository...${NC}"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: Git is not installed. Please install git first.${NC}"
    exit 1
fi

# Check if directory already exists
if [ -d "$REPO_NAME" ]; then
    echo -e "${YELLOW}Warning: $REPO_NAME directory already exists.${NC}"
    read -p "Do you want to remove it and clone again? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Removing existing directory...${NC}"
        rm -rf "$REPO_NAME"
    else
        echo -e "${YELLOW}Import cancelled by user.${NC}"
        exit 0
    fi
fi

# Clone the repository with all branches
echo -e "${CYAN}Cloning repository from $REPO_URL...${NC}"
if git clone --mirror "$REPO_URL" "$REPO_NAME.git"; then
    cd "$REPO_NAME.git" || exit 1
    git config --bool core.bare false
    cd ..
    git clone "$REPO_NAME.git" "$REPO_NAME"
    rm -rf "$REPO_NAME.git"
    
    # Verify the clone was successful
    if [ -d "$REPO_NAME" ] && [ -d "$REPO_NAME/.git" ]; then
        echo -e "${GREEN}Successfully imported $REPO_NAME repository.${NC}"
        echo -e "${CYAN}Repository is available in the $REPO_NAME directory.${NC}"
        echo -e "${CYAN}All original branches and commit history have been preserved.${NC}"
        
        # List the contents of the repository
        echo -e "${CYAN}Repository structure:${NC}"
        ls -la "$REPO_NAME"
        
        # Get repository stats
        echo -e "${CYAN}Repository statistics:${NC}"
        cd "$REPO_NAME" || exit 1
        echo -e "Branches:"
        git branch -a
        echo -e "\nLast 5 commits:"
        git log -n 5 --oneline
        cd ..
    else
        echo -e "${RED}Error: Failed to verify the cloned repository.${NC}"
        exit 1
    fi
else
    echo -e "${RED}Error: Failed to clone the repository. Please check the URL and your internet connection.${NC}"
    exit 1
fi

echo -e "${GREEN}Import completed successfully. You can now navigate to the $REPO_NAME directory.${NC}"
