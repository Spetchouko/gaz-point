import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { user, pointDeVente } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"
import { sendVendorApprovalResultEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireAdmin()
    const body = (await req.json().catch(() => null)) as { vendorId?: string } | null

    if (!body?.vendorId) {
      return NextResponse.json({ error: "ID vendeur requis" }, { status: 400 })
    }

    // Get vendor details
    const [vendor] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        approvalStatus: user.approvalStatus,
      })
      .from(user)
      .where(eq(user.id, body.vendorId))
      .limit(1)

    if (!vendor) {
      return NextResponse.json({ error: "Vendeur introuvable" }, { status: 404 })
    }

    if (vendor.approvalStatus === "approved") {
      return NextResponse.json({ error: "Vendeur déjà approuvé" }, { status: 400 })
    }

    // Get vendor's points for location info in email
    const points = await db
      .select({
        district: pointDeVente.district,
        address: pointDeVente.address,
      })
      .from(pointDeVente)
      .where(eq(pointDeVente.vendorId, vendor.id))

    const location = points.length > 0
      ? points.map((p) => `${p.address}, ${p.district}`).join(" ; ")
      : "Non renseigné"

    // Update vendor approval status
    await db
      .update(user)
      .set({
        approvalStatus: "approved",
        approvalProcessedAt: new Date(),
        approvalProcessedBy: currentUser.id,
        updatedAt: new Date(),
      })
      .where(eq(user.id, vendor.id))

    // Send approval email to vendor
    const adminDashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://gazpoints.com"}/dashboard/vendeur`
    try {
      await sendVendorApprovalResultEmail({
        vendorName: vendor.name,
        vendorEmail: vendor.email,
        approved: true,
        adminDashboardUrl,
      })
    } catch (emailError) {
      console.error("[admin/vendors/approve] Failed to send email:", emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ ok: true, message: "Vendeur approuvé avec succès" })
  } catch (err) {
    console.error("[admin/vendors/approve] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de l'approbation" },
      { status: 500 }
    )
  }
}