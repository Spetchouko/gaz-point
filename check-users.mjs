import { db } from "./db/index.ts";
import { user } from "./db/schema.ts";

async function main() {
  const users = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
    })
    .from(user)
    .limit(60);
  console.log("USERS:", JSON.stringify(users, null, 1));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("ERR", e);
    process.exit(1);
  });
