const fs = require('fs');
const path = require('path');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith('.') || e.isDirectory()) return [];
    const p = path.join(dir, e.name);
    if (p.endsWith('.tsx') || p.endsWith('.ts')) yield p;
    return [];
  });
}
['app', 'components'].forEach((c) => {
  const dir = path.join('.', c);
  if (!fs.existsSync(dir)) return;
  console.log(c + ':');
  walk(dir).filter((f) => f.includes('popover')).forEach((f) => console.log('  ' + f));
});
