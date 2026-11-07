/* Reproduit les requêtes Drizzle du dashboard admin pour capturer l'erreur réelle. */
require("dotenv").config();
const { neon } = require("@neondatabase/serverless");
const { drizzle } = require("drizzle-orm/neon-http");
const { count, eq, desc, sql, gte, and, inArray } = require("drizzle-orm");

const url = process.env.DATABASE_URL;
const client = neon(url);
const db = drizzle({ client });

// Schéma minimal reproduisant db/schema.ts
const user = require("drizzle-orm/pg-core").pgTable("user", {
  id: require("drizzle-orm/pg-core").text("id").primaryKey(),
  name: require("drizzle-orm/pg-core").text("name"),
  email: require("drizzle-orm/pg-core").text("email"),
  role: require("drizzle-orm/pg-core").text("role"),
  createdAt: require("drizzle-orm/pg-core").timestamp("created_at").notNull().defaultNow(),
});

const disponibilite = require("drizzle-orm/pg-core").pgTable("disponibilite", {
  id: require("drizzle-orm/pg-core").text("id").primaryKey(),
  pointId: require("drizzle-orm/pg-core").text("point_id").notNull(),
  status: require("drizzle-orm/pg-core").text("status").notNull(),
  quantity: require("drizzle-orm/pg-core").integer("quantity"),
  createdAt: require("drizzle-orm/pg-core").timestamp("created_at").notNull().defaultNow(),
});

async function main() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. count users role=client
  try {
    const r = await db.select({ count: count() }).from(user).where(eq(user.role, "client"));
    console.log("OK abonnes:", JSON.stringify(r));
  } catch (e) {
    console.error("FAIL abonnes:", e.message, "\n  cause:", e.cause?.message ?? e.cause);
  }

  // 2. recentDispos — la requête exacte qui échoue dans les logs
  try {
    const r = await db.select().from(disponibilite).where(gte(disponibilite.createdAt, sevenDaysAgo)).orderBy(desc(disponibilite.createdAt)).limit(5);
    console.log("OK recentDispos:", r.length, "rows");
  } catch (e) {
    console.error("FAIL recentDispos:", e.message, "\n  cause:", e.cause?.message ?? e.cause);
  }

  // 3. select * from user (comme recentUsers)
  try {
    const r = await db.select().from(user).where(gte(user.createdAt, sevenDaysAgo)).orderBy(desc(user.createdAt)).limit(5);
    console.log("OK recentUsers:", r.length, "rows");
  } catch (e) {
    console.error("FAIL recentUsers:", e.message, "\n  cause:", e.cause?.message ?? e.cause);
  }

  // 4. La requête du log avec les dates d'octobre (statistiques ?)
  try {
    const r = await db.select({ count: count() }).from(user).where(and(eq(user.role, "vendor"), gte(user.createdAt, new Date("2026-10-14T22:00:00.000Z"))));
    console.log("OK october vendor count:", JSON.stringify(r));
  } catch (e) {
    console.error("FAIL october vendor count:", e.message, "\n  cause:", e.cause?.message ?? e.cause);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error("FATAL", e.message); process.exit(1); });
