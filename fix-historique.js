const fs = require('fs');
const file = '/home/solomon/gaz-point/app/dashboard/historique/page.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/Confirm\u01B8e/g, 'Confirmée')
  .replace(/R\u01B8cup\u01B8r\u01B8e/g, 'Récupérée')
  .replace(/Annul\u01B8e/g, 'Annulée')
  .replace(/R\u01B8serv\u01B8e/g, 'Réservée')
  .replace(/R\u01B8cup\u01B8r\u01B8e/g, 'Récupérée')
  .replace(/}<\/p>}/g, '</p>')
  .replace(/R\u01B8cup\u01B8r\u01B8e :/g, 'Récupérée :')
  .replace(/Annul\u01B8e :/g, 'Annulée :');
fs.writeFileSync(file, content);
console.log('Fixed historique page');