// Test with Neon HTTP driver (uses fetch instead of raw TCP)
const { neon } = require('@neondatabase/serverless');

// Use the pooler URL with the Neon HTTP driver
const sql = neon("postgresql://neondb_owner:npg_dgpRfv4VGW3D@ep-withered-forest-b5fvjf27-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require");

console.log("Testing Neon HTTP driver...");

sql`SELECT 1 as test`
  .then(r => {
    console.log('DB OK:', r);
  })
  .catch(e => {
    console.error('DB Error:', e.message, e.code);
  });