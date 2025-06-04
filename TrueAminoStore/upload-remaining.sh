#!/bin/bash

# Upload key client files
echo "Uploading client files..."
curl -X PUT -H "Authorization: token ${GITHUB_TOKEN}" -H "Content-Type: application/json" -d "{\"message\": \"Add client/index.html\", \"content\": \"$(base64 -w 0 client/index.html)\"}" "https://api.github.com/repos/onyxprocessing/trueaminos909/contents/client/index.html"
curl -X PUT -H "Authorization: token ${GITHUB_TOKEN}" -H "Content-Type: application/json" -d "{\"message\": \"Add client/main.tsx\", \"content\": \"$(base64 -w 0 client/main.tsx)\"}" "https://api.github.com/repos/onyxprocessing/trueaminos909/contents/client/main.tsx"
curl -X PUT -H "Authorization: token ${GITHUB_TOKEN}" -H "Content-Type: application/json" -d "{\"message\": \"Add client/App.tsx\", \"content\": \"$(base64 -w 0 client/App.tsx)\"}" "https://api.github.com/repos/onyxprocessing/trueaminos909/contents/client/App.tsx"

# Upload key server files
echo "Uploading server files..."
curl -X PUT -H "Authorization: token ${GITHUB_TOKEN}" -H "Content-Type: application/json" -d "{\"message\": \"Add server/db.ts\", \"content\": \"$(base64 -w 0 server/db.ts)\"}" "https://api.github.com/repos/onyxprocessing/trueaminos909/contents/server/db.ts"
curl -X PUT -H "Authorization: token ${GITHUB_TOKEN}" -H "Content-Type: application/json" -d "{\"message\": \"Add server/routes.ts\", \"content\": \"$(base64 -w 0 server/routes.ts)\"}" "https://api.github.com/repos/onyxprocessing/trueaminos909/contents/server/routes.ts"

# Upload environment template
echo "Uploading environment template..."
curl -X PUT -H "Authorization: token ${GITHUB_TOKEN}" -H "Content-Type: application/json" -d "{\"message\": \"Add .env.example\", \"content\": \"$(echo 'DATABASE_URL=your_postgresql_url
STRIPE_SECRET_KEY=your_stripe_secret
AIRTABLE_API_KEY=your_airtable_key
AIRTABLE_BASE_ID=your_base_id
NODE_ENV=development
PORT=5000
HOST=0.0.0.0' | base64 -w 0)\"}" "https://api.github.com/repos/onyxprocessing/trueaminos909/contents/.env.example"

echo "Upload batch completed!"