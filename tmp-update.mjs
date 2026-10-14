import { db } from './db/index.ts';
import { user } from './db/schema.ts';
import { eq } from 'drizzle-orm';

async function main() {
  // Update all users' emails to gazpoints@gmail.com
  await db.update(user).set({ email: 'gazpoints@gmail.com' }).execute();
  console.log('Updated all user emails to gazpoints@gmail.com');
  
  // Also verify
  const users = await db.select().from(user);
  console.log('Users:', JSON.stringify(users, null, 2));
}

main().then(() => {}).catch(e => console.error('Error:', e));