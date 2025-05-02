import { spawn } from 'child_process';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Add explicit environment variables for the process
const env = {
  ...process.env,
  PORT: '5000',
  HOST: '0.0.0.0',
  NODE_ENV: 'development'
};

// Spawn the server process with explicit host and port
const serverProcess = spawn('node', ['--loader', 'tsx', 'server/index.ts'], {
  env,
  stdio: 'inherit'
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});
