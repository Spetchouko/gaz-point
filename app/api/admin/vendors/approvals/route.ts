import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { user, pointDeVente } from "@/db/schema"
import { eq, inArray, desc, or } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    // Get all vendors with their approval status
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

    return NextResponse.json({ approvals })
  } catch (err) {
    console.error("[admin/vendors/approvals] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des demandes" },
      { status: 500 }
    )
  }
}