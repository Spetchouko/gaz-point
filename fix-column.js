import { neon } from '@neon/database';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const client = await pool.connect();
    try {
      await client.query('ALTER TABLE "publicite" ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now()');
      console.log('✅ Successfully added updated_at column to publicite table');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Failed to add column:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();