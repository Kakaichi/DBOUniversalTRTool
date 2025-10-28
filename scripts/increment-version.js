const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '..', 'package.json');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Check if we should skip increment (useful for electron-builder which reads the version)
const skipIncrement = process.env.SKIP_VERSION_INCREMENT === 'true';

if (!skipIncrement) {
  // Parse current version
  const [major, minor, patch] = packageJson.version.split('.').map(Number);
  
  // Increment build number (patch version)
  const newVersion = `${major}.${minor}.${patch + 1}`;
  
  // Update version
  packageJson.version = newVersion;
  
  // Write back to package.json
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  
  console.log(`✓ Version updated from ${major}.${minor}.${patch} to ${newVersion}`);
} else {
  console.log(`Version increment skipped (version: ${packageJson.version})`);
}
