import { db } from './db/index.ts';
import { user } from './db/schema.ts';
import { eq } from 'drizzle-orm';

async function main() {
  const rows = await db.select().from(user);
  console.log('Users:', rows);
}

main().then(() => {}).catch(e => console.error(e));