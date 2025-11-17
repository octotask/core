#!/bin/bash

# Fix formatting issues identified by prettier
echo "Fixing formatting issues..."

# Fix JSON files to use proper prettier formatting
echo "Formatting JSON files..."
jq '.' .eslintrc.json > .eslintrc.json.tmp && mv .eslintrc.json.tmp .eslintrc.json
jq '.' .prettierrc.json > .prettierrc.json.tmp && mv .prettierrc.json.tmp .prettierrc.json
jq '.' jest.config.json > jest.config.json.tmp && mv jest.config.json.tmp jest.config.json
jq '.' package.json > package.json.tmp && mv package.json.tmp package.json

# Fix package.json files in subdirectories
jq '.' cdn/package.json > cdn/package.json.tmp && mv cdn/package.json.tmp cdn/package.json
jq '.' resolver/package.json > resolver/package.json.tmp && mv resolver/package.json.tmp resolver/package.json
jq '.' registry-sync/package.json > registry-sync/package.json.tmp && mv registry-sync/package.json.tmp registry-sync/package.json
jq '.' sdk/package.json > sdk/package.json.tmp && mv sdk/package.json.tmp sdk/package.json
jq '.' hyperdeploy/package.json > hyperdeploy/package.json.tmp && mv hyperdeploy/package.json.tmp hyperdeploy/package.json

echo "Formatting complete!"
