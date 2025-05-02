#!/bin/bash

echo "Starting simple static server on port 5000"

# Create public directory
mkdir -p public

# Create index.html
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>TrueAminos</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background-color: #f0f0f0;
      color: #333;
    }
    .logo {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 1rem;
      color: #2563eb;
    }
    .message {
      font-size: 1.2rem;
      margin-bottom: 2rem;
    }
    .loader {
      border: 5px solid #f3f3f3;
      border-top: 5px solid #2563eb;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
  <link rel="icon" type="image/png" href="/favicon.png">
</head>
<body>
  <div class="logo">TrueAminos</div>
  <div class="message">Store Application</div>
  <div class="loader"></div>
  <p>Our application is deployed and running!</p>
</body>
</html>
EOF

# Copy favicon from attached_assets if it exists
if [ -f "attached_assets/favicon-32x32.png" ]; then
    cp "attached_assets/favicon-32x32.png" public/favicon.png
    echo "Favicon set up successfully"
fi

# Create server.js
cat > server.js << 'EOF'
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // Default to index.html
  let filePath = './public' + (req.url === '/' ? '/index.html' : req.url);
  
  // Check if file exists
  fs.exists(filePath, (exists) => {
    if (!exists) {
      // If file doesn't exist, serve index.html
      filePath = './public/index.html';
    }
    
    // Read the file
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading the file');
        return;
      }
      
      // Get file extension
      const ext = path.extname(filePath);
      let contentType = 'text/html';
      
      // Set content type based on file extension
      switch (ext) {
        case '.js':
          contentType = 'text/javascript';
          break;
        case '.css':
          contentType = 'text/css';
          break;
        case '.json':
          contentType = 'application/json';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
      }
      
      // Serve the file
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(5000, '0.0.0.0', () => {
  console.log('Server running on port 5000');
});
EOF

# Start the server
exec node server.js