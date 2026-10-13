import { asc, desc, eq } from "drizzle-orm"
import type { Metadata } from "next"
import { db } from "@/db"
import { pointDeVente, recharge } from "@/db/schema"
import { MesCommandes } from "@/app/_components/mes-commandes"
import { requireUser } from "@/lib/session"

export const metadata: Metadata = {
  title: { absolute: "Mes commandes | GazPoints" },
}

export default async function MesCommandesPage() {
  const user = await requireUser()
  const role = (user as unknown as { role?: string | null }).role ?? "client"
  const isPro = role === "vendor" || role === "admin"

  const [rows, points] = await Promise.all([
    db
      .select()
      .from(recharge)
      .where(eq(recharge.userId, user.id))
      .orderBy(desc(recharge.purchasedAt)),
    db.select().from(pointDeVente).orderBy(asc(pointDeVente.name)),
  ])

  return <MesCommandes recharges={rows} points={points} pro={isPro} />
}
