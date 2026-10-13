import { Metadata } from "next"
import { db } from "@/db"
import { user, pointDeVente, disponibilite } from "@/db/schema"
import { count, eq, desc, ilike, or, sql, and, inArray } from "drizzle-orm"
import { AdminPointsBoard } from "@/app/_components/admin-points-board"
import { AdminSearchFilters } from "@/app/_components/admin-search-filters"
import { requireStaffModule } from "@/lib/session"

export const metadata: Metadata = {
  title: { absolute: "Points de vente | Administration GAZ POINT" },
}

const ITEMS_PER_PAGE = 50

type SearchParams = {
  q?: string
  status?: "all" | "with-vendor" | "without-vendor"
  sort?: "recent" | "oldest" | "name"
  page?: string
}

export default async function AdminPointsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireStaffModule("vendeurs")

  const { q, status = "all", sort = "recent", page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page, 10))
  const offset = (pageNum - 1) * ITEMS_PER_PAGE

  const vendors = await db
    .select({ id: user.id, name: user.name, email: user.email, phoneNumber: user.phoneNumber })
    .from(user)
    .where(eq(user.role, "vendor"))
  const vendorMap = new Map(vendors.map((v) => [v.id, v]))

  const whereConditions = []

  if (q) {
    whereConditions.push(
      or(
        ilike(pointDeVente.name, `%${q}%`),
        ilike(pointDeVente.district, `%${q}%`),
        ilike(pointDeVente.address, `%${q}%`),
        ilike(pointDeVente.phone, `%${q}%`)
      )
    )
  }

  if (status === "with-vendor") {
    whereConditions.push(sql`${pointDeVente.vendorId} IS NOT NULL`)
  } else if (status === "without-vendor") {
    whereConditions.push(sql`${pointDeVente.vendorId} IS NULL`)
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

  const orderClause =
    sort === "oldest"
      ? pointDeVente.createdAt
      : sort === "name"
      ? pointDeVente.name
      : desc(pointDeVente.createdAt)

  const [points, totalResult] = await Promise.all([
    db
      .select()
      .from(pointDeVente)
      .where(whereClause)
      .orderBy(orderClause)
      .limit(ITEMS_PER_PAGE)
      .offset(offset),
    db
      .select({ count: count() })
      .from(pointDeVente)
      .where(whereClause),
  ])

  const total = totalResult[0]?.count ?? 0
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  const pointIds = points.map((p) => p.id)
  const dispoMap = new Map<string, typeof disponibilite.$inferSelect[]>()

  if (pointIds.length > 0) {
    const dispos = await db
      .select()
      .from(disponibilite)
      .where(inArray(disponibilite.pointId, pointIds))
    for (const d of dispos) {
      const existing = dispoMap.get(d.pointId) ?? []
      existing.push(d)
      dispoMap.set(d.pointId, existing)
    }
  }

  const pointsWithData = points.map((p) => {
    const vendor = p.vendorId ? vendorMap.get(p.vendorId) : null
    const dispos = dispoMap.get(p.id) ?? []
    const activeDispos = dispos.filter((d) => d.status === "disponible" && (d.quantity ?? 0) > 0)
    const totalQty = dispos.reduce((sum, d) => sum + (d.quantity ?? 0), 0)
    const latestDispo = dispos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

    return {
      ...p,
      vendorName: vendor?.name ?? null,
      vendorEmail: vendor?.email ?? null,
      vendorPhone: vendor?.phoneNumber ?? null,
      activeDisposCount: activeDispos.length,
      totalQty,
      latestDispoDate: latestDispo?.createdAt ?? null,
      latestDispoStatus: latestDispo?.status ?? null,
      latestDispoFormat: latestDispo?.format ?? null,
      latestDispoQty: latestDispo?.quantity ?? null,
      hasActiveDispo: activeDispos.length > 0,
    }
  })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Points de vente</h1>
        <p className="mt-2 text-muted-foreground">
          Gestion des dépôts et points de vente du réseau GAZ POINT
        </p>
      </header>

<AdminSearchFilters
          searchValue={q ?? ""}
          statusValue={status}
          sortValue={sort}
          statusOptions={[
            { value: "all", label: "Tous" },
            { value: "with-vendor", label: "Avec vendeur" },
            { value: "without-vendor", label: "Sans vendeur" },
          ]}
          sortOptions={[
            { value: "recent", label: "Plus récents" },
            { value: "oldest", label: "Plus anciens" },
            { value: "name", label: "Par nom (A-Z)" },
          ]}
        />

        <AdminPointsBoard
          points={pointsWithData}
          vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
        />

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
          {pageNum > 1 && (
            <a
              href={`?${new URLSearchParams({ ...{ q: q ?? "", status, sort }, page: String(pageNum - 1) }).toString()}`}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Précédent
            </a>
          )}
          <span className="px-3 py-2 text-sm text-muted-foreground">
            Page {pageNum} / {totalPages} — {total} point{total > 1 ? "s" : ""} de vente
          </span>
          {pageNum < totalPages && (
            <a
              href={`?${new URLSearchParams({ ...{ q: q ?? "", status, sort }, page: String(pageNum + 1) }).toString()}`}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Suivant
            </a>
          )}
        </nav>
      )}
    </div>
  )
}