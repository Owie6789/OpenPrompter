// clean node_modules with MAX_PATH bypass
const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, 'node_modules');
try {
  fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
  console.log('node_modules removed');
} catch (e) {
  console.error('fs.rmSync failed:', e.message);
  // Fallback: rmdir with \\?\ prefix
  const { execSync } = require('child_process');
  const fullPath = path.resolve(dir);
  try {
    execSync(`rmdir /s /q "\\\\?\\${fullPath}"`, { shell: 'cmd.exe' });
    console.log('node_modules removed via rmdir fallback');
  } catch (e2) {
    console.error('rmdir also failed:', e2.message);
  }
}
