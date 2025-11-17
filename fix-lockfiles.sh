#!/bin/bash

# Fix package-lock.json files for npm ci compatibility
# This script regenerates lock files for packages with old lockfile versions

echo "Fixing package-lock.json files..."

# Fix resolver package lock file
cd resolver
echo "Regenerating resolver package-lock.json..."
npm install --package-lock-only
cd ..

# Fix registry-sync package lock file  
cd registry-sync
echo "Regenerating registry-sync package-lock.json..."
npm install --package-lock-only
cd ..

echo "All package-lock.json files have been regenerated successfully!"
