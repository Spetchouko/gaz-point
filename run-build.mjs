const { execSync } = require('child_process');
const path = require('path');

try {
  const result = execSync('node_modules/.bin/next build', {
    cwd: path.resolve('\\\\wsl.localhost\\Ubuntu-24.04\\home\\solomon\\gaz-point'),
    stdio: 'inherit',
    timeout: 300000,
    env: { ...process.env, NODE_PATH: '' }
  });
  console.log('Build succeeded');
} catch (err) {
  console.error('Build failed:', err.message);
  process.exit(1);
}
