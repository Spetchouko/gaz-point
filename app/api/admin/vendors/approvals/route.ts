import { NextResponse } from "next/server"
import { db } from "@/db"
import { user, pointDeVente } from "@/db/schema"
import { eq, inArray, desc } from "drizzle-orm"
import { getAdminUser } from "@/lib/session"

export async function GET(req: Request) {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: "Accès réservé à l'administration" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") ?? "1", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10) || 20

    // Get all vendors with their approval status
    const totalResult = await db
      .count()
      .from(user)
      .where(eq(user.role, "vendor"))
      .catch(() => ({ count: 0 }))
    const total = totalResult.count ?? 0

    const vendors = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        approvalStatus: user.approvalStatus,
        approvalRequestedAt: user.approvalRequestedAt,
        approvalProcessedAt: user.approvalProcessedAt,
        rejectionReason: user.rejectionReason,
      })
      .from(user)
      .where(eq(user.role, "vendor"))
      .orderBy(desc(user.createdAt))
      .limit(Math.max(pageSize, 1))
      .offset((page - 1) * pageSize)

    // Get points for each vendor
    const vendorIds = vendors.map((v) => v.id)
    let pointsMap: Record<string, Array<{ id: string; name: string; district: string; address: string }>> = {}

    if (vendorIds.length > 0) {
      const points = await db
        .select({
          id: pointDeVente.id,
          vendorId: pointDeVente.vendorId,
          name: pointDeVente.name,
          district: pointDeVente.district,
          address: pointDeVente.address,
        })
        .from(pointDeVente)
        .where(inArray(pointDeVente.vendorId, vendorIds))

      pointsMap = points.reduce((acc, point) => {
        if (!acc[point.vendorId!]) {
          acc[point.vendorId!] = []
        }
        acc[point.vendorId!].push({
          id: point.id,
          name: point.name,
          district: point.district,
          address: point.address,
        })
        return acc
      }, {} as Record<string, Array<{ id: string; name: string; district: string; address: string }>>)
    }

    const approvals = vendors.map((vendor) => ({
      ...vendor,
      points: pointsMap[vendor.id] || [],
    }))

    return NextResponse.json({
      approvals,
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (err) {
    console.error("[admin/vendors/approvals] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des demandes" },
      { status: 500 }
    )
  }
}