#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}Starting TrueAmino deployment with simplified approach...${NC}"

# Verify that AIRTABLE_API_KEY is set
if [ -z "$AIRTABLE_API_KEY" ]; then
    echo -e "${RED}Error: AIRTABLE_API_KEY is not set. Please add it as a secret in your Replit environment.${NC}"
    exit 1
fi
echo -e "${GREEN}Using existing AIRTABLE_API_KEY from environment${NC}"

# Generate a random string for SESSION_SECRET if not already set
if [ -z "$SESSION_SECRET" ]; then
    SESSION_SECRET=$(openssl rand -hex 32)
    echo -e "${YELLOW}Generated new SESSION_SECRET${NC}"
fi
export SESSION_SECRET="$SESSION_SECRET"

# Repository URL and name
REPO_URL="https://github.com/onyxprocessing/TrueAminoStore.git"
REPO_NAME="TrueAminoStore"

# Check if directory already exists - non-interactive handling
if [ -d "$REPO_NAME" ]; then
    echo -e "${YELLOW}$REPO_NAME directory already exists. Using existing directory.${NC}"
else
    # Clone the repository
    echo -e "${CYAN}Cloning repository from $REPO_URL...${NC}"
    if git clone "$REPO_URL" "$REPO_NAME"; then
        echo -e "${GREEN}Successfully cloned $REPO_NAME repository.${NC}"
    else
        echo -e "${RED}Error: Failed to clone the repository. Please check the URL and your internet connection.${NC}"
        exit 1
    fi
fi

# Create .env file with necessary environment variables in the TrueAminoStore directory
cd "$REPO_NAME" || exit 1
echo "PORT=5000
HOST=0.0.0.0
NODE_ENV=production
AIRTABLE_API_KEY=${AIRTABLE_API_KEY}
SESSION_SECRET=${SESSION_SECRET}" > .env
echo -e "${GREEN}Created .env file with necessary environment variables${NC}"

# Fix package.json by removing type: module
echo -e "${YELLOW}Fixing package.json...${NC}"
mv package.json package.json.bak
grep -v '"type": "module"' package.json.bak > package.json
echo -e "${GREEN}Fixed package.json for CommonJS compatibility${NC}"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Copy favicon from attached_assets if it exists
echo -e "${YELLOW}Setting up favicons...${NC}"
if [ -f "../attached_assets/favicon-32x32.png" ]; then
    cp "../attached_assets/favicon-32x32.png" ./public/favicon-32x32.png
    cp "../attached_assets/favicon-32x32.png" ./public/favicon-16.png
    cp "../attached_assets/favicon-32x32.png" ./public/favicon-32.png
    cp "../attached_assets/favicon-32x32.png" ./public/images/favicon.png
    if command -v convert &> /dev/null; then
        convert "../attached_assets/favicon-32x32.png" ./public/favicon.ico
        convert "../attached_assets/favicon-32x32.png" ./public/favicon/favicon.ico
    fi
    echo -e "${GREEN}Favicons set up successfully${NC}"
fi

# Create a simple HTTP server to bind to port 5000
cat > listen.js << 'EOF'
const http = require('http');
const { spawn } = require('child_process');

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>TrueAminos - Starting Application</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 50px;
        }
        .loader {
          border: 5px solid #f3f3f3;
          border-top: 5px solid #3498db;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 2s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <h1>TrueAminos</h1>
      <p>Application is starting...</p>
      <div class="loader"></div>
    </body>
    </html>
  `);
});

// Start the server
server.listen(5000, '0.0.0.0', () => {
  console.log('Temporary server running on port 5000');
  
  // Start the actual application
  setTimeout(() => {
    const app = spawn('npx', ['tsx', 'server/index.ts'], {
      stdio: 'inherit',
      env: {...process.env, PORT: '5000', HOST: '0.0.0.0'}
    });
    
    // Close this server after a delay
    setTimeout(() => {
      server.close();
    }, 3000);
  }, 2000);
});
EOF

# Start the server
echo -e "${GREEN}Starting application...${NC}"
node listen.js