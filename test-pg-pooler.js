const { Pool } = require('pg');

// Use the exact pooler connection string with uselibpqcompat
const connectionString = "postgresql://neondb_owner:npg_dgpRfv4VGW3D@ep-withered-forest-b5fvjf27-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&uselibpqcompat=true";

const pool = new Pool({ 
  connectionString, 
  max: 1,
  ssl: { rejectUnauthorized: false },
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
});

console.log("Testing pg pooler connection...");

pool.query('SELECT 1 as test')
  .then(r => {
    console.log('DB OK:', r.rows);
    return pool.end();
  })
  .catch(e => {
    console.error('DB Error:', e.message, e.code);
    console.error(e.stack);
    return pool.end();
  });