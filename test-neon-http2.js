// Test with Neon HTTP driver - multiple queries
const { neon } = require('@neondatabase/serverless');

const sql = neon("postgresql://neondb_owner:npg_dgpRfv4VGW3D@ep-withered-forest-b5fvjf27-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require");

console.log("Testing Neon HTTP driver - multiple queries...");

async function runTests() {
  try {
    // Test 1
    const r1 = await sql`SELECT 1 as test`
    console.log('Test 1 OK:', r1);
    
    // Test 2 - wait a bit
    await new Promise(r => setTimeout(r, 1000));
    const r2 = await sql`SELECT 2 as test`
    console.log('Test 2 OK:', r2);
    
    // Test 3 - another wait
    await new Promise(r => setTimeout(r, 1000));
    const r3 = await sql`SELECT 3 as test`
    console.log('Test 3 OK:', r3);
    
    // Test 4 - query a real table
    const r4 = await sql`SELECT count(*) as count FROM "user"`
    console.log('Test 4 OK:', r4);
    
    console.log('All tests passed!');
  } catch (e) {
    console.error('Error:', e.message, e.code);
    console.error(e.stack);
  }
}

runTests();