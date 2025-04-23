#!/usr/bin/env node

/**
 * Script to copy README.md to packages/deepdown/README.md
 * This ensures the npm package has the same documentation as the main repo
 */

const fs = require('fs');
const path = require('path');

const sourceFile = path.resolve(__dirname, '..', 'README.md');
const targetFile = path.resolve(__dirname, '..', 'packages', 'deepdown', 'README.md');

// Create the deepdown directory if it doesn't exist
const targetDir = path.dirname(targetFile);
if (!fs.existsSync(targetDir)) {
  console.error(`Target directory ${targetDir} does not exist.`);
  process.exit(1);
}

// Copy the file
try {
  fs.copyFileSync(sourceFile, targetFile);
  console.log(`Successfully copied README.md to packages/deepdown/README.md`);
} catch (error) {
  console.error(`Error copying README: ${error.message}`);
  process.exit(1);
} 