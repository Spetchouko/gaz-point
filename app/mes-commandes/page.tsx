import { asc, desc, eq } from "drizzle-orm"
import type { Metadata } from "next"
import { db } from "@/db"
import { pointDeVente, recharge } from "@/db/schema"
import { MesCommandes } from "@/app/_components/mes-commandes"
import { ClientLayout } from "@/app/_components/client-layout"
import { requireUser } from "@/lib/session"

export const metadata: Metadata = {
  title: { absolute: "Mes commandes | GazPoints" },
}

export default async function MesCommandesPage() {
  const user = await requireUser()
  const role = (user as unknown as { role?: string | null }).role ?? "client"

  if (role === "admin" || role === "collaborateur") {
    return <div>Accès réservé aux clients.</div>
  }

  const [rows, points] = await Promise.all([
    db
      .select()
      .from(recharge)
      .where(eq(recharge.userId, user.id))
      .orderBy(desc(recharge.purchasedAt)),
    db.select().from(pointDeVente).orderBy(asc(pointDeVente.name)),
  ])

  return (
    <ClientLayout
      clientName={user.name ?? "Usager"}
      clientEmail={user.email}
    >
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <MesCommandes recharges={rows} points={points} pro={false} />
        </div>
      </div>
    </ClientLayout>
  )
}
