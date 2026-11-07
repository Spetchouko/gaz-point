const { execSync } = require('child_process');
try {
  const result = execSync('pnpm build', { cwd: '/home/solomon/gaz-point', encoding: 'utf8', timeout: 120000 });
  console.log('Build succeeded!');
  console.log(result);
  process.exit(0);
} catch (e) {
  console.error('Build failed:');
  console.error(e.stderr || e.message);
  process.exit(1);
}