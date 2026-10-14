import './db/index.ts';
import './db/schema.ts';
import { db } from './db/index.ts';
import { user } from './db/schema.ts';

const users = await db.select().from(user);
console.log('Users:', JSON.stringify(users, null, 2));