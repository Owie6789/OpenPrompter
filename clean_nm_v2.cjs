const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, 'node_modules');
const { execSync } = require('child_process');

// Try rmdir via cmd.exe with extended-length path
const fullPath = path.resolve(dir);
try {
  execSync(`rmdir /s /q "${fullPath}"`, { shell: 'cmd.exe', stdio: 'pipe', timeout: 120000 });
  console.log('node_modules removed via rmdir');
} catch (e) {
  console.error('First try failed:', e.message);
  // Try with \\?\ prefix
  try {
    execSync(`rmdir /s /q "\\\\?\\${fullPath}"`, { shell: 'cmd.exe', stdio: 'pipe', timeout: 120000 });
    console.log('node_modules removed via \\\\?\\ rmdir');
  } catch (e2) {
    console.error('Both failed:', e2.message);
  }
}

if (fs.existsSync(dir)) {
  console.log('node_modules still present');
  // List large subdirs
  const items = fs.readdirSync(dir).filter(f => !f.startsWith('.'));
  console.log('Top-level dirs:', items.length);
  items.slice(0, 10).forEach(f => {
    try { console.log(`  ${f}: ${fs.readdirSync(path.join(dir, f)).length} items`); } catch(e) { console.log(`  ${f}: ${e.message}`); }
  });
} else {
  console.log('node_modules confirmed removed');
}
