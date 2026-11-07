import { Metadata } from "next"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { user, pointDeVente, disponibilite } from "@/db/schema"
import { eq } from "drizzle-orm"
import { AdminPointDetail } from "@/app/_components/admin-point-detail"
import { requireStaffModule } from "@/lib/session"

export const metadata: Metadata = {
  title: { absolute: "Point de vente | Administration GAZ POINT" },
}

export default async function AdminPointDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireStaffModule("vendeurs")
  const { id } = await params

  const rows = await db.select().from(pointDeVente).where(eq(pointDeVente.id, id)).limit(1)
  const point = rows[0]
  if (!point) redirect("/admin/points-de-vente")

  const vendors = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.role, "vendor"))

  let vendorInfo: { id: string; name: string; email: string } | null = null
  const dispos = await db
    .select()
    .from(disponibilite)
    .where(eq(disponibilite.pointId, id))
    .orderBy(disponibilite.createdAt)

  if (point.vendorId) {
    const [v] = await db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .where(eq(user.id, point.vendorId))
      .limit(1)
    vendorInfo = v ?? null
  }

  return (
    <AdminPointDetail
      point={{
        id: point.id,
        name: point.name,
        district: point.district,
        address: point.address,
        phone: point.phone,
        brands: point.brands,
        formats: point.formats,
        isActive: point.isActive,
        createdAt: point.createdAt,
        vendorId: point.vendorId,
        vendorName: vendorInfo?.name ?? null,
        vendorEmail: vendorInfo?.email ?? null,
      }}
      dispos={dispos.map((d) => ({
        id: d.id,
        status: d.status,
        quantity: d.quantity,
        format: d.format,
        brand: d.brand,
        note: d.note,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }))}
      vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
    />
  )
}