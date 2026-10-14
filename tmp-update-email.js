const { neon } = require('@neon/database');
const { drizzle } = require('drizzle-orm/neon-serverless');

const db = drizzle({ connection: process.env.DATABASE_URL });

async function run() {
  try {
    // Update all users' emails to gazpoints@gmail.com
    await db.update('user').set({ email: 'gazpoints@gmail.com' });
    console.log('Updated all user emails to gazpoints@gmail.com');
    
    // Verify
    const [row] = await db.select({ email: 'email' }).from('user').limit(1);
    console.log('Sample user email:', row);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}

run();