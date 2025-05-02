// This is a CommonJS module to start the server
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Express server to immediately bind to port 5000
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>TrueAminos - Starting</title>
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
      <link rel="icon" type="image/png" href="/favicon-32x32.png">
    </head>
    <body>
      <div class="logo">TrueAminos</div>
      <div class="message">Starting the application...</div>
      <div class="loader"></div>
      <p>Please wait while the server initializes.</p>
    </body>
    </html>
  `);
});

function removeTypeModule() {
  const packageJsonPath = path.join(__dirname, 'TrueAminoStore', 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.type === 'module') {
        delete packageJson.type;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('Removed "type": "module" from package.json');
      }
    } catch (error) {
      console.error('Error modifying package.json:', error);
    }
  }
}

console.log('Starting temporary server on port 5000...');
server.listen(5000, '0.0.0.0', () => {
  console.log('Temporary server is running on port 5000');
  
  // Remove type: module from package.json
  removeTypeModule();
  
  // Start the actual TrueAminoStore application
  setTimeout(() => {
    console.log('Starting TrueAminoStore application...');
    const proc = spawn('cd', ['TrueAminoStore', '&&', 'npm', 'install', '&&', 'npx', 'tsx', 'server/index.ts'], {
      env: {
        ...process.env,
        PORT: '5000',
        HOST: '0.0.0.0',
        NODE_ENV: 'production'
      },
      shell: true,
      stdio: 'inherit'
    });
    
    proc.on('error', (err) => {
      console.error('Failed to start application:', err);
    });
    
    proc.on('exit', (code) => {
      console.log(`TrueAminoStore exited with code ${code}`);
    });
    
    // Close the temporary server after a delay
    setTimeout(() => {
      server.close(() => {
        console.log('Temporary server closed');
      });
    }, 5000); // 5 seconds
  }, 2000); // 2 seconds delay
});