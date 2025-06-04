const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// GitHub API upload script
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'onyxprocessing';
const REPO_NAME = 'trueaminos909';

async function uploadToGitHub() {
  try {
    console.log('Starting GitHub upload...');
    
    // Use curl to create files via GitHub API
    const files = [
      'package.json',
      'package-lock.json',
      'README.md',
      'vite.config.ts',
      'tailwind.config.ts',
      'tsconfig.json'
    ];
    
    for (const file of files) {
      if (fs.existsSync(file)) {
        console.log(`Uploading ${file}...`);
        const content = fs.readFileSync(file, 'utf8');
        const base64Content = Buffer.from(content).toString('base64');
        
        const curlCmd = `curl -X PUT \
          -H "Authorization: token ${GITHUB_TOKEN}" \
          -H "Content-Type: application/json" \
          -d '{
            "message": "Add ${file}",
            "content": "${base64Content}"
          }' \
          "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${file}"`;
        
        try {
          execSync(curlCmd, { stdio: 'inherit' });
        } catch (error) {
          console.log(`Error uploading ${file}, continuing...`);
        }
      }
    }
    
    console.log('Upload completed!');
  } catch (error) {
    console.error('Upload failed:', error.message);
  }
}

uploadToGitHub();