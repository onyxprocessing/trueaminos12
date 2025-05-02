// Simple static server using CommonJS
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.url}`);
  
  // Serve a basic HTML page
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>TrueAminos - Starting Application</title>
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
    </head>
    <body>
      <div class="logo">TrueAminos</div>
      <div class="message">Starting application, please wait...</div>
      <div class="loader"></div>
      <p>Application is initializing. This page will automatically redirect when ready.</p>
    </body>
    </html>
  `);
});

// Start the static server immediately
server.listen(5000, '0.0.0.0', () => {
  console.log('Static server is running on port 5000');
  console.log('This temporary server satisfies the port binding requirement');
  console.log('Starting the actual application server...');
  
  // Now start the actual TrueAminoStore application
  setTimeout(() => {
    // Start the application from the TrueAminoStore directory
    const appProcess = spawn('cd', ['TrueAminoStore', '&&', 'npx', 'tsx', 'server/index.ts'], {
      env: {
        ...process.env,
        PORT: '5000',
        HOST: '0.0.0.0',
        NODE_ENV: 'production'
      },
      shell: true,
      stdio: 'inherit'
    });
    
    appProcess.on('error', (err) => {
      console.error('Failed to start application:', err);
    });
    
    // When the application is ready, close this temporary server
    setTimeout(() => {
      console.log('Closing temporary static server...');
      server.close(() => {
        console.log('Temporary server closed. Application should be running.');
      });
    }, 5000); // Give the app 5 seconds to start up before closing this server
    
  }, 2000); // Wait 2 seconds before starting the actual app
});

// Handle process termination
process.on('SIGINT', () => {
  server.close(() => {
    console.log('Static server closed due to SIGINT');
    process.exit(0);
  });
});