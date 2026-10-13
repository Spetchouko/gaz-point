import { desc } from "drizzle-orm"
import type { Metadata } from "next"
import { db } from "@/db"
import { avis } from "@/db/schema"
import { AdminAvisBoard } from "@/app/_components/admin-avis-board"
import type { AvisRow } from "@/app/_components/admin-avis-table"
import { requireStaffModule } from "@/lib/session"
import { toAvisStatus } from "@/lib/avis"

export const metadata: Metadata = {
  title: { absolute: "Avis & Témoignages | Administration GAZ POINT" },
}

export default async function AdminAvisPage() {
  await requireStaffModule("avis")

  const rows = await db.select().from(avis).orderBy(desc(avis.createdAt))

  const avisRows: AvisRow[] = rows.map((row) => ({
    id: row.id,
    authorName: row.authorName,
    authorRole: row.authorRole,
    authorImage: row.authorImage,
    city: row.city,
    quote: row.quote,
    status: toAvisStatus(row.status),
    createdAt: row.createdAt,
  }))

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Avis &amp; Témoignages</h1>
        <p className="mt-2 text-muted-foreground">
          Consulte, approuve, refuse ou masque les avis des usagers et des
          vendeurs. Seuls les avis approuvés apparaissent sur la page d&apos;accueil.
        </p>
      </header>

      <AdminAvisBoard avis={avisRows} />
    </div>
  )
}
