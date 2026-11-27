import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { vendorSubscription, paymentTransaction, user } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireUser } from "@/lib/session"
import { randomUUID } from "node:crypto"

const SUBSCRIPTION_AMOUNT = 5000
const SUBSCRIPTION_CURRENCY = "XAF"
const SUBSCRIPTION_DESCRIPTION = "Abonnement mensuel vendeur GazPoints (DEMO)"

type DemoResultType = "completed" | "failed" | "cancelled"

interface DemoInitiateRequest {
  vendorId?: string
  vendorEmail?: string
  vendorName?: string
  resultType: DemoResultType
  reference: string
}

function buildDemoMetadata(vendorId: string, vendorEmail: string, resultType: DemoResultType): Record<string, string> {
  return {
    type: "vendor_subscription",
    vendor_id: vendorId,
    vendor_email: vendorEmail,
    plan: "monthly",
    amount: String(SUBSCRIPTION_AMOUNT),
    currency: SUBSCRIPTION_CURRENCY,
    demo_mode: "true",
    demo_result: resultType,
  }
}

/**
 * POST /api/payment/demo/initiate
 * Initiate a DEMO payment for vendor subscription
 * 
 * Body: { vendorId, vendorEmail, vendorName, resultType, reference }
 * Returns: { success: true, reference, checkoutUrl }
 */
export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireUser()
    
    // Only vendors can initiate subscription payments
    if (currentUser.role !== "vendor") {
      return NextResponse.json(
        { error: "Seuls les vendeurs peuvent souscrire un abonnement" },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => null) as DemoInitiateRequest | null
    
    if (!body || !body.resultType || !body.reference) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      )
    }

    // Use current user's info if not provided
    const vendorId = body.vendorId ?? currentUser.id
    const vendorEmail = body.vendorEmail ?? currentUser.email
    const vendorName = body.vendorName ?? currentUser.name ?? "Vendeur GazPoints"
    const { resultType, reference } = body

    // Verify the vendor matches current user
    if (vendorId !== currentUser.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      )
    }

    // Validate resultType
    if (!["completed", "failed", "cancelled"].includes(resultType)) {
      return NextResponse.json(
        { error: "Type de résultat invalide" },
        { status: 400 }
      )
    }

    // Check if vendor already has an active subscription
    const [existingSub] = await db
      .select()
      .from(vendorSubscription)
      .where(eq(vendorSubscription.vendorId, vendorId))
      .limit(1)

    if (existingSub && existingSub.status === "active") {
      return NextResponse.json(
        { error: "Abonnement déjà actif" },
        { status: 400 }
      )
    }

    // Create demo checkout URL (simulated)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    const successUrl = `${siteUrl}/paiement/succes?ref=${reference}`
    const errorUrl = `${siteUrl}/paiement/echec?ref=${reference}`
    const cancelUrl = `${siteUrl}/paiement/annule?ref=${reference}`

    // Store pending transaction
    await db.insert(paymentTransaction).values({
      id: randomUUID(),
      vendorId,
      geniuspayReference: reference,
      geniuspayId: null, // DEMO has no real GeniusPay ID
      amount: SUBSCRIPTION_AMOUNT,
      currency: SUBSCRIPTION_CURRENCY,
      fees: 0,
      netAmount: SUBSCRIPTION_AMOUNT,
      status: "pending",
      paymentMethod: resultType === "completed" ? "mtn_money" : resultType === "failed" ? "orange_money" : "cancelled",
      paymentProvider: "demo",
      customerName: vendorName,
      customerEmail: vendorEmail,
      customerPhone: currentUser.phoneNumber ?? undefined,
      checkoutUrl: `${siteUrl}/paiement/demo?ref=${reference}&result=${resultType}`,
      successUrl,
      errorUrl,
      metadata: JSON.stringify(buildDemoMetadata(vendorId, vendorEmail, resultType)),
      environment: "sandbox",
      initiatedAt: new Date(),
    })

    // Create or update subscription record (pending)
    if (!existingSub) {
      await db.insert(vendorSubscription).values({
        id: randomUUID(),
        vendorId,
        status: "inactive",
        amount: SUBSCRIPTION_AMOUNT,
        currency: SUBSCRIPTION_CURRENCY,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    return NextResponse.json({
      success: true,
      reference,
      checkoutUrl: `${siteUrl}/paiement/demo?ref=${reference}&result=${resultType}`,
      message: "Paiement DEMO initialisé",
    })
  } catch (err) {
    console.error("[payment/demo/initiate] Error:", err)
    return NextResponse.json(
      { error: "Erreur serveur lors de l'initialisation du paiement DEMO" },
      { status: 500 }
    )
  }
}