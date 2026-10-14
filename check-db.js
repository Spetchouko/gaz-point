const { neon } = require('neon');
const { drizzle } = require('drizzle-orm/neon-http');

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql });

db.select({ count: sql`count(*)` }).from(`traffic_event`).then(r => {
  console.log('Traffic events count:', r);
}).catch(e => {
  console.error('Error:', e);
});

db.select({ count: sql`count(*)` }).from(`user`).then(r => {
  console.log('User count:', r);
}).catch(e => {
  console.error('Error:', e);
});

db.select({ count: sql`count(*)` }).from(`publicite_event`).then(r => {
  console.log('Publicite events count:', r);
}).catch(e => {
  console.error('Error:', e);
});