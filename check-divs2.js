const fs = require('fs');
const c = fs.readFileSync('/home/solomon/gaz-point/app/_components/dashboard/admin-layout.tsx', 'utf8');
const opens = (c.match(/<div\b/g) || []).length;
const closes = (c.match(/<\/div>/g) || []).length;
console.log('Div opens:', opens);
console.log('Div closes:', closes);
console.log('Difference:', opens - closes);