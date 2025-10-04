const fs = require('fs');
const path = require('path');

const packageJson = require('../package.json');

const buildInfo = {
  name: packageJson.name,
  version: packageJson.version,
  buildTime: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || 'unknown',
};

const outputPath = path.join(__dirname, '../dist/build-info.json');

fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));
console.log('Build info generated:', outputPath);
