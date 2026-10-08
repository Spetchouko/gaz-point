import { Metadata } from "next"
import { db } from "@/db"
import { user, pointDeVente, disponibilite } from "@/db/schema"
import { count, eq, desc, ilike, or, sql, and, inArray } from "drizzle-orm"
import { AdminDisponibilitesTable } from "@/app/_components/admin-disponibilites-table"
import { AdminSearchFilters } from "@/app/_components/admin-search-filters"

export const metadata: Metadata = {
  title: { absolute: "Disponibilités | Administration GazPoint" },
}

const ITEMS_PER_PAGE = 50

type SearchParams = {
  q?: string
  status?: "all" | "disponible" | "indisponible" | "a_confirmer"
  source?: "all" | "vendeur" | "administration"
  sort?: "recent" | "oldest"
  page?: string
}

export default async function AdminDisponibilitesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { q, status = "all", source = "all", sort = "recent", page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page, 10))
  const offset = (pageNum - 1) * ITEMS_PER_PAGE

  const vendors = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.role, "vendor"))

  const vendorIds = vendors.map((v) => v.id)
  const vendorMap = new Map(vendors.map((v) => [v.id, v]))

  let points: (typeof pointDeVente.$inferSelect)[] = []
  let pointMap = new Map<string, typeof pointDeVente.$inferSelect>()

  if (vendorIds.length > 0) {
    points = await db
      .select()
      .from(pointDeVente)
      .where(inArray(pointDeVente.vendorId, vendorIds))
    pointMap = new Map(points.map((p) => [p.id, p]))
  }

  const pointIds = points.map((p) => p.id)

  const whereConditions = []

  if (pointIds.length > 0) {
    whereConditions.push(inArray(disponibilite.pointId, pointIds))
  } else {
    whereConditions.push(sql`false`)
  }

  if (q) {
    whereConditions.push(
      or(
        ilike(disponibilite.format, `%${q}%`),
        ilike(disponibilite.note, `%${q}%`),
        ilike(disponibilite.phone, `%${q}%`)
      )
    )
  }

  if (status !== "all") {
    whereConditions.push(eq(disponibilite.status, status))
  }

  if (source !== "all") {
    whereConditions.push(eq(disponibilite.source, source))
  }

  const whereClause = and(...whereConditions)

  const orderClause = sort === "oldest" ? disponibilite.createdAt : desc(disponibilite.createdAt)

  const [dispos, totalResult] = await Promise.all([
    db
      .select()
      .from(disponibilite)
      .where(whereClause)
      .orderBy(orderClause)
      .limit(ITEMS_PER_PAGE)
      .offset(offset),
    db
      .select({ count: count() })
      .from(disponibilite)
      .where(whereClause),
  ])

  const total = totalResult[0]?.count ?? 0
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  const disposWithData = dispos.map((d) => {
    const point = pointMap.get(d.pointId)
    const vendor = point?.vendorId ? vendorMap.get(point.vendorId) : null
    return {
      ...d,
      pointName: point?.name ?? "—",
      pointDistrict: point?.district ?? "—",
      pointAddress: point?.address ?? "—",
      vendorName: vendor?.name ?? "—",
      vendorEmail: vendor?.email ?? "—",
    }
  })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Disponibilités</h1>
        <p className="mt-2 text-muted-foreground">
          Toutes les disponibilités publiées par les vendeurs et l'administration
        </p>
      </header>

      <AdminSearchFilters
        searchValue={q ?? ""}
        statusValue={status}
        sortValue={sort}
        statusOptions={[
          { value: "all", label: "Tous statuts" },
          { value: "disponible", label: "Disponible" },
          { value: "indisponible", label: "Indisponible" },
          { value: "a_confirmer", label: "À confirmer" },
        ]}
        sortOptions={[
          { value: "recent", label: "Plus récentes" },
          { value: "oldest", label: "Plus anciennes" },
        ]}
        extraFilters={
          <select
            value={source}
            onChange={(e) => {
              const params = new URLSearchParams({ q: q ?? "", status, source: e.target.value, sort, page: "1" })
              window.location.search = params.toString()
            }}
            className="h-10 px-3 rounded-lg border bg-background text-sm"
          >
            <option value="all">Toutes sources</option>
            <option value="vendeur">Vendeur</option>
            <option value="administration">Administration</option>
          </select>
        }
      />

      <AdminDisponibilitesTable dispos={disposWithData} />

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
          {pageNum > 1 && (
            <a
              href={`?${new URLSearchParams({ ...{ q, status, source, sort }, page: String(pageNum - 1) }).toString()}`}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Précédent
            </a>
          )}
          <span className="px-3 py-2 text-sm text-muted-foreground">
            Page {pageNum} / {totalPages} — {total} disponibilité{total > 1 ? "s" : ""}
          </span>
          {pageNum < totalPages && (
            <a
              href={`?${new URLSearchParams({ ...{ q, status, source, sort }, page: String(pageNum + 1) }).toString()}`}
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