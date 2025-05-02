#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}Starting TrueAmino server...${NC}"

# Navigate to the TrueAminoStore directory
cd TrueAminoStore || exit 1

# Install dependencies
echo -e "${CYAN}Installing dependencies...${NC}"
npm install

# Create a temporary server that binds to port 5000 immediately
node -e "
const http = require('http');
const { spawn } = require('child_process');

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('Starting TrueAmino application...');
});

// Start the server
server.listen(5000, '0.0.0.0', () => {
  console.log('Temporary server running on port 5000');
  
  // Start the actual application
  setTimeout(() => {
    const app = spawn('npx', ['tsx', 'server/index.ts'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: '5000', 
        HOST: '0.0.0.0',
        NODE_ENV: 'production'
      }
    });
    
    // Close the temporary server after the app starts
    setTimeout(() => {
      server.close();
    }, 3000);
  }, 2000);
});"