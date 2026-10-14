import { Metadata } from "next"
import { db } from "@/db"
import { publicite } from "@/db/schema"
import { desc } from "drizzle-orm"
import { AdminPubliciteBoard } from "@/app/_components/admin-publicite-board"
import { AdminPubliciteStats } from "@/app/_components/admin-publicite-stats"
import { requireStaffModule } from "@/lib/session"
import { getPubliciteStats } from "@/lib/publicite-stats"
import { resolveAnalyticsRange } from "@/lib/publicite-analytics"
import type { PubliciteRow } from "@/app/_components/admin-publicite-table"

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

export default async function AdminMarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}) {
  await requireStaffModule("marketing")

  const params = await searchParams
  const range = resolveAnalyticsRange(params.period, params.from, params.to)

  const [publicites, stats] = await Promise.all([
    db.select().from(publicite).orderBy(desc(publicite.createdAt)),
    getPubliciteStats(range),
  ])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Marketing & publicités</h1>
        <p className="mt-2 text-muted-foreground">
          Deux emplacements sur l&apos;accueil : sous la bannière d&apos;accueil et
          au-dessus de « Trouver mon Gaz ».
        </p>
      </header>

      <AdminPubliciteBoard publicites={toRows(publicites)} />

      <AdminPubliciteStats
        periodKey={range.key}
        fromInput={range.fromInput}
        toInput={range.toInput}
        stats={stats}
      />
    </div>
  )
}