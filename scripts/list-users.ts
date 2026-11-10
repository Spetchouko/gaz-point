import "dotenv/config"
import { db } from "@/db"
import { user, pointDeVente } from "@/db/schema"
import { eq } from "drizzle-orm"

async function main() {
  const users = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
    })
    .from(user)
    .limit(60)

  console.log("USERS:", JSON.stringify(users, null, 1))

  const points = await db
    .select({ id: pointDeVente.id, name: pointDeVente.name, userId: pointDeVente.vendorId })
    .from(pointDeVente)
    .limit(30)
  console.log("POINTS:", JSON.stringify(points, null, 1))
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("ERR", e)
    process.exit(1)
  })
