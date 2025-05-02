const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
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
    </head>
    <body>
      <div class="logo">TrueAminos</div>
      <div class="message">Application is running!</div>
      <div class="loader"></div>
      <p>The static server is running on port 5000.</p>
    </body>
    </html>
  `);
});

// Start the server
console.log('Starting static server on port 5000');
server.listen(5000, '0.0.0.0', () => {
  console.log('Static server running on port 5000');
});