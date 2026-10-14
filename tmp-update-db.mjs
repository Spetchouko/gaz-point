import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neon/database';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql });

async function run() {
  try {
    // Update all users' emails to gazpoints@gmail.com
    await db.update('user').set({ email: 'gazpoints@gmail.com' });
    console.log('Success: Updated all user emails to gazpoints@gmail.com');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}

run();