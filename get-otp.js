const { neon } = require('@neondatabase/serverless');

const sql = neon("postgresql://neondb_owner:npg_dgpRfv4VGW3D@ep-withered-forest-b5fvjf27-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&uselibpqcompat=true");

async function getOtp() {
  try {
    const result = await sql`
      SELECT identifier, value, expires_at, created_at 
      FROM verification 
      WHERE identifier LIKE 'email-verification-otp-%'
      ORDER BY created_at DESC
      LIMIT 5
    `
    console.log('OTP records:', result);
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  }
}

getOtp();