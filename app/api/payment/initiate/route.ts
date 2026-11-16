import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { vendorSubscription, paymentTransaction } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireUser } from "@/lib/session"
import {
  initiatePayment,
  buildVendorSubscriptionMetadata,
  VENDOR_SUBSCRIPTION_AMOUNT,
  VENDOR_SUBSCRIPTION_CURRENCY,
  VENDOR_SUBSCRIPTION_DESCRIPTION,
} from "@/lib/geniuspay"
import { optionalEnv } from "@/lib/env"

/**
 * POST /api/payment/initiate
 * Initiate a GeniusPay payment for vendor subscription
 * 
 * Body: { vendorId?: string } - optional, defaults to current user
 * Returns: { checkoutUrl: string, reference: string }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    
    // Only vendors can initiate subscription payments
    if (user.role !== "vendor") {
      return NextResponse.json(
        { error: "Seuls les vendeurs peuvent souscrire un abonnement" },
        { status: 403 }
      )
    }
    
    const body = await req.json().catch(() => ({}))
    const vendorId = body.vendorId ?? user.id
    
    // Verify the vendor exists and matches current user (or is admin)
    if (vendorId !== user.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
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
    
    // Build URLs
    const siteUrl = optionalEnv("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000"
    const successUrl = `${siteUrl}/paiement/succes`
    const errorUrl = `${siteUrl}/paiement/echec`
    
    // Initiate payment with GeniusPay
    const result = await initiatePayment({
      amount: VENDOR_SUBSCRIPTION_AMOUNT,
      currency: VENDOR_SUBSCRIPTION_CURRENCY,
      description: VENDOR_SUBSCRIPTION_DESCRIPTION,
      customer: {
        name: user.name ?? "Vendeur GazPoints",
        email: user.email,
        phone: user.phoneNumber ?? undefined,
        country: "CM", // Cameroon
      },
      successUrl,
      errorUrl,
      metadata: buildVendorSubscriptionMetadata(vendorId, user.email),
    })
    
    if (!result.success || !result.data) {
      console.error("[payment/initiate] GeniusPay error:", result.error)
      return NextResponse.json(
        { error: result.error?.message ?? "Échec de l'initialisation du paiement" },
        { status: 500 }
      )
    }
    
    // Store pending transaction
    await db.insert(paymentTransaction).values({
      id: crypto.randomUUID(),
      vendorId,
      geniuspayReference: result.data.reference,
      geniuspayId: result.data.id,
      amount: result.data.amount,
      currency: result.data.currency,
      status: result.data.status,
      checkoutUrl: result.data.checkout_url,
      successUrl,
      errorUrl,
      metadata: JSON.stringify(result.data.metadata),
      environment: result.data.environment,
      initiatedAt: new Date(),
    })
    
    // Create or update subscription record (pending)
    if (!existingSub) {
      await db.insert(vendorSubscription).values({
        id: crypto.randomUUID(),
        vendorId,
        status: "inactive",
        amount: VENDOR_SUBSCRIPTION_AMOUNT,
        currency: VENDOR_SUBSCRIPTION_CURRENCY,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
    
    return NextResponse.json({
      checkoutUrl: result.data.checkout_url,
      reference: result.data.reference,
    })
  } catch (err) {
    console.error("[payment/initiate] Error:", err)
    return NextResponse.json(
      { error: "Erreur serveur lors de l'initialisation du paiement" },
      { status: 500 }
    )
  }
}