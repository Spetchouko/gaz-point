import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getAdminUser } from "@/lib/session"
import { sendVendorApprovalResultEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getAdminUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Accès réservé à l'administration" }, { status: 403 })
    }
    const body = (await req.json().catch(() => null)) as { vendorId?: string; reason?: string } | null

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

    if (vendor.approvalStatus === "rejected") {
      return NextResponse.json({ error: "Vendeur déjà refusé" }, { status: 400 })
    }

    if (vendor.approvalStatus === "approved") {
      return NextResponse.json({ error: "Impossible de refuser un vendeur déjà approuvé" }, { status: 400 })
    }

    // Update vendor approval status
    await db
      .update(user)
      .set({
        approvalStatus: "rejected",
        approvalProcessedAt: new Date(),
        approvalProcessedBy: currentUser.id,
        rejectionReason: body.reason?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, vendor.id))

    // Send rejection email to vendor
    const adminDashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://gazpoints.com"}/dashboard/vendeur`
    try {
      await sendVendorApprovalResultEmail({
        vendorName: vendor.name,
        vendorEmail: vendor.email,
        approved: false,
        rejectionReason: body.reason?.trim() || undefined,
        adminDashboardUrl,
      })
    } catch (emailError) {
      console.error("[admin/vendors/reject] Failed to send email:", emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ ok: true, message: "Demande refusée" })
  } catch (err) {
    console.error("[admin/vendors/reject] error:", err)
    return NextResponse.json(
      { error: "Erreur lors du refus" },
      { status: 500 }
    )
  }
}