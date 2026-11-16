require("dotenv").config();
const { db } = require("./db/index");
const { user } = require("./db/schema");
const { eq } = require("drizzle-orm");

async function main() {
  try {
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
    console.log("USERS:", JSON.stringify(users, null, 2));
  } catch (e) {
    console.error("ERR", e);
  }
  process.exit(0);
}

main();
