import { Metadata } from "next"
import { db } from "@/db"
import { publicite } from "@/db/schema"
import { desc, eq, gte, lte } from "drizzle-orm"
import { AdminPubliciteBoard } from "@/app/_components/admin-publicite-board"
import { requireStaffModule } from "@/lib/session"
import type { PubliciteRow } from "@/app/_components/admin-publicite-table"

// Statuts disponibles pour le filtrage
const PUBLICITE_STATUS_OPTIONS = [
  { value: null as string | null, label: "Toutes" },
  { value: "draft", label: "Brouillons" },
  { value: "scheduled", label: "Programmées" },
  { value: "active", label: "En cours" },
  { value: "expired", label: "Terminées" },
  { value: "suspended", label: "Suspendues" },
]

export const metadata: Metadata = {
  title: { absolute: "Marketing & publicités | Administration GAZ POINT" },
}

function toRows(rows: (typeof publicite.$inferSelect)[]): PubliciteRow[] {
  const now = Date.now()
  return rows.map((ad) => {
    const startMs = ad.startAt ? new Date(ad.startAt).getTime() : null
    const endMs = ad.endAt ? new Date(ad.endAt).getTime() : null
    return {
      id: ad.id,
      title: ad.title,
      description: ad.description,
      image: ad.image,
      price: ad.price,
      priceLabel: ad.priceLabel,
      location: ad.location,
      phone: ad.phone,
      linkUrl: ad.linkUrl,
      slot: ad.slot,
      status: ad.status,
      startAt: ad.startAt,
      endAt: ad.endAt,
      future: startMs !== null ? startMs > now : false,
      past: endMs !== null ? endMs < now : false,
      createdAt: ad.createdAt,
    }
  })
}

export default async function AdminMarketingPage() {
  await requireStaffModule("marketing")

  const publicites = await db.select().from(publicite).orderBy(desc(publicite.createdAt))

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Marketing & publicités</h1>
        <p className="mt-2 text-muted-foreground">
          Bannières d&apos;information et promotions affichées sur l&apos;accueil et la page À propos.
        </p>
      </header>

      <AdminPubliciteBoard publicites={toRows(publicites)} />
    </div>
  )
}