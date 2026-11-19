const fs = require('fs');
const c = fs.readFileSync('/home/solomon/gaz-point/app/_components/dashboard/admin-layout.tsx', 'utf8');

// Find all <div> openings with line numbers
const openRegex = /<div\b[^>]*>/g;
const closeRegex = /<\/div>/g;

console.log('=== DIV OPENINGS ===');
let match;
let lineNum = 0;
while ((match = openRegex.exec(c)) !== null) {
  lineNum = c.substring(0, match.index).split('\n').length;
  const selfClose = match[0].includes('/>');
  console.log('Line ' + lineNum + ': ' + match[0].substring(0, 60) + (selfClose ? ' [self-closing]' : ''));
}

// Find all closing </div> with line numbers
console.log('\n=== DIV CLOSINGS ===');
lineNum = 0;
while ((match = closeRegex.exec(c)) !== null) {
  lineNum = c.substring(0, match.index).split('\n').length;
  console.log('Line ' + lineNum + ': ' + match[0]);
}