import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function applyMigration() {
  try {
    // Add new columns to traffic_event
    await sql`ALTER TABLE traffic_event ADD COLUMN IF NOT EXISTS user_agent text`;
    console.log('✓ Added user_agent column');
    
    await sql`ALTER TABLE traffic_event ADD COLUMN IF NOT EXISTS screen_width integer`;
    console.log('✓ Added screen_width column');
    
    await sql`ALTER TABLE traffic_event ADD COLUMN IF NOT EXISTS screen_height integer`;
    console.log('✓ Added screen_height column');
    
    await sql`ALTER TABLE traffic_event ADD COLUMN IF NOT EXISTS viewport_width integer`;
    console.log('✓ Added viewport_width column');
    
    await sql`ALTER TABLE traffic_event ADD COLUMN IF NOT EXISTS viewport_height integer`;
    console.log('✓ Added viewport_height column');
    
    // Add index
    await sql`CREATE INDEX IF NOT EXISTS traffic_event_user_agent_idx ON traffic_event (user_agent)`;
    console.log('✓ Added user_agent index');
    
    console.log('\n✅ Migration applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();