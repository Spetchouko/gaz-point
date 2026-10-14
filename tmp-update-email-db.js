import { neon } from '@neon/database';
import { drizzle } from 'drizzle-orm/neon-serverless';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ connection: process.env.DATABASE_URL });

async function run() {
  try {
    // Update all users' emails to gazpoints@gmail.com
    await db.execute(sql`UPDATE "user" SET email = 'gazpoints@gmail.com'`);
    console.log('Success: Updated all user emails to gazpoints@gmail.com');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}

run();