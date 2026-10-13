import { neon } from '@neon/database';
import { drizzle } from 'drizzle-orm/neon-serverless';

const db = drizzle({ connection: process.env.DATABASE_URL });

async function run() {
  try {
    // Run the ALTER TABLE command directly
    await db.execute(sql`ALTER TABLE "publicite" ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now()`);
    console.log('Success: updated_at column added to publicite table');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();