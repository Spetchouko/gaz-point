const { Pool } = require('pg');

// Use the exact connection string from the debug output
const connectionString = "postgresql://neondb_owner:npg_dgpRfv4VGW3D@ep-withered-forest-b5fvjf27.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&uselibpqcompat=true";

const pool = new Pool({ connectionString, max: 1 });

console.log("Testing connection...");

pool.query('SELECT 1 as test')
  .then(r => {
    console.log('DB OK:', r.rows);
    return pool.end();
  })
  .catch(e => {
    console.error('DB Error:', e.message, e.code);
    return pool.end();
  });