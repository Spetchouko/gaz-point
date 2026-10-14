import './db/index.ts';
import './db/schema.ts';
import './lib/session.ts';

async function main() {
  const { db } = await import('./db/index.ts');
  const { user: userTable, eq } = await import('./db/schema.ts');
  const { getCurrentUser } = await import('./lib/session.ts');
  
  const currentUser = await getCurrentUser();
  console.log('Current user:', JSON.stringify(currentUser, null, 2));
  
  if (currentUser) {
    const [row] = await db.select({ id: userTable.id, email: userTable.email }).from(userTable).where(eq(userTable.id, currentUser.id)).limit(1);
    console.log('Current row from DB:', JSON.stringify(row, null, 2));
  }
}

main().then(() => {}).catch(e => console.error('Error:', e));