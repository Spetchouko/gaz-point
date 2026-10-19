import { Metadata } from "next"
import { db } from "@/db"
import { user, pointDeVente, disponibilite } from "@/db/schema"
import { eq, desc, inArray } from "drizzle-orm"
import { AdminVendeursTable } from "@/app/_components/admin-vendeurs-table"
import { AdminSearchFilters } from "@/app/_components/admin-search-filters"
import { requireStaffModule } from "@/lib/session"
import { ExportVendorsButton } from "./ExportVendorsButton"

export const metadata: Metadata = {
  title: { absolute: "Vendeurs | Administration GAZ POINT" },
}

const ITEMS_PER_PAGE = 50

type SearchParams = {
  q?: string
  status?: "all" | "active" | "inactive" | "with-dispo" | "without-dispo"
  sort?: "recent" | "oldest"
  page?: string
}

export default async function AdminVendeursPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireStaffModule("vendeurs")

  const { q, status = "all", sort = "recent", page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page, 10))
  const offset = (pageNum - 1) * ITEMS_PER_PAGE

  const vendors = await db
    .select()
    .from(user)
    .where(eq(user.role, "vendor"))
    .orderBy(desc(user.createdAt))

  const vendorIds = vendors.map((v) => v.id)

  const pointsMap = new Map<string, typeof pointDeVente.$inferSelect[]>()
  const dispoMap = new Map<string, typeof disponibilite.$inferSelect[]>

  if (vendorIds.length > 0) {
    const points = await db
      .select()
      .from(pointDeVente)
      .where(inArray(pointDeVente.vendorId, vendorIds))
    for (const p of points) {
      if (p.vendorId) {
        const existing = pointsMap.get(p.vendorId) ?? []
        existing.push(p)
        pointsMap.set(p.vendorId, existing)
      }
    }

    const pointIds = points.map((p) => p.id)
    if (pointIds.length > 0) {
      const dispos = await db
        .select()
        .from(disponibilite)
        .where(inArray(disponibilite.pointId, pointIds))
      for (const d of dispos) {
        const point = points.find((p) => p.id === d.pointId)
        if (point?.vendorId) {
          const existing = dispoMap.get(point.vendorId) ?? []
          existing.push(d)
          dispoMap.set(point.vendorId, existing)
        }
      }
    }
  }

  let filteredVendors = vendors

  if (q) {
    const lowerQ = q.toLowerCase()
    filteredVendors = filteredVendors.filter(
      (v) =>
        v.name.toLowerCase().includes(lowerQ) ||
        v.email.toLowerCase().includes(lowerQ) ||
        (v.phoneNumber ?? "").includes(lowerQ) ||
        pointsMap.get(v.id)?.some((p) => p.name.toLowerCase().includes(lowerQ) || p.district.toLowerCase().includes(lowerQ) || p.address.toLowerCase().includes(lowerQ))
    )
  }

  if (status === "active") {
    filteredVendors = filteredVendors.filter((v) => {
      const dispos = dispoMap.get(v.id) ?? []
      return dispos.some((d) => d.status === "disponible" && (d.quantity ?? 0) > 0)
    })
  } else if (status === "inactive") {
    filteredVendors = filteredVendors.filter((v) => {
      const dispos = dispoMap.get(v.id) ?? []
      return !dispos.some((d) => d.status === "disponible" && (d.quantity ?? 0) > 0)
    })
  } else if (status === "with-dispo") {
    filteredVendors = filteredVendors.filter((v) => (dispoMap.get(v.id) ?? []).length > 0)
  } else if (status === "without-dispo") {
    filteredVendors = filteredVendors.filter((v) => (dispoMap.get(v.id) ?? []).length === 0)
  }

  if (sort === "oldest") {
    filteredVendors.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  } else {
    filteredVendors.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const total = filteredVendors.length
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const paginatedVendors = filteredVendors.slice(offset, offset + ITEMS_PER_PAGE)

  const vendorsWithData = paginatedVendors.map((v) => {
    const points = pointsMap.get(v.id) ?? []
    const dispos = dispoMap.get(v.id) ?? []
    const activeDispos = dispos.filter((d) => d.status === "disponible" && (d.quantity ?? 0) > 0)
    const totalQty = dispos.reduce((sum, d) => sum + (d.quantity ?? 0), 0)
    const latestDispo = dispos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

    return {
      ...v,
      points,
      dispos,
      activeDisposCount: activeDispos.length,
      totalQty,
      latestDispoDate: latestDispo?.createdAt ?? null,
      hasActiveDispo: activeDispos.length > 0,
    }
  })

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendeurs</h1>
          <p className="mt-2 text-muted-foreground">
            Gestion des comptes vendeurs et de leurs dépôts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportVendorsButton />
        </div>
      </header>

      <AdminSearchFilters
        searchValue={q ?? ""}
        statusValue={status}
        sortValue={sort}
        statusOptions={[
          { value: "all", label: "Tous" },
          { value: "active", label: "Actifs (avec dispo)" },
          { value: "inactive", label: "Inactifs (sans dispo)" },
          { value: "with-dispo", label: "Avec disponibilité" },
          { value: "without-dispo", label: "Sans disponibilité" },
        ]}
        sortOptions={[
          { value: "recent", label: "Plus récents" },
          { value: "oldest", label: "Plus anciens" },
        ]}
      />

      <AdminVendeursTable vendors={vendorsWithData} />

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
            Page {pageNum} / {totalPages} — {total} vendeur{total > 1 ? "s" : ""}
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