#!/bin/bash
set -e

echo "Setting up git configuration..."
git config --global user.email "action@github.com"
git config --global user.name "GitHub Actions"

echo "Checking git status..."
git status

echo "Adding remote with token authentication..."
git remote remove origin 2>/dev/null || true
git remote add origin https://${GITHUB_TOKEN}@github.com/onyxprocessing/trueaminos33.git

echo "Pushing to GitHub..."
git push --set-upstream origin main --force

echo "Successfully pushed to GitHub!"