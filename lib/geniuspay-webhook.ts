/**
 * GeniusPay Webhook Verification
 * 
 * Verifies HMAC-SHA256 signature of incoming webhooks.
 * Never trust webhook data without verification.
 */

import { requiredEnv, optionalEnv } from "@/lib/env"
import { createHmac, timingSafeEqual } from "crypto"

export interface GeniusPayWebhookPayload {
  id: string // UUID
  event: string // e.g., "payment.success", "payment.failed"
  timestamp: number // Unix timestamp
  created_at: string // ISO 8601
  data: {
    object: "transaction"
    id: number // GeniusPay internal ID
    reference: string // MTX-XXXXXXXXXX
    amount: number
    currency: string
    fees: number
    net_amount: number
    status: string
    payment_method: string
    provider: string
    customer_name: string
    customer_phone: string
    merchant_id: number
    metadata: Record<string, string>
  }
  environment: "sandbox" | "live"
  api_version: string
}

export interface WebhookHeaders {
  signature: string // X-Webhook-Signature
  timestamp: string // X-Webhook-Timestamp
  event: string // X-Webhook-Event
  deliveryId?: string // X-Webhook-Delivery
  environment: string // X-Webhook-Environment
}

/**
 * Get webhook secret from environment
 */
function getWebhookSecret(): string {
  const environment = (optionalEnv("GENIUSPAY_ENV") as "sandbox" | "live") ?? "sandbox"
  return requiredEnv("GENIUSPAY_WEBHOOK_SECRET")
}

/**
 * Verify webhook signature using HMAC-SHA256
 * 
 * Format: signature = HMAC-SHA256(timestamp + "." + json_payload, secret)
 * 
 * @param payload - Raw request body as string
 * @param headers - Webhook headers
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  headers: WebhookHeaders
): boolean {
  const secret = getWebhookSecret()
  
  // Build the signed data: timestamp + "." + json_payload
  const signedData = `${headers.timestamp}.${payload}`
  
  // Calculate expected signature
  const expectedSignature = createHmac("sha256", secret)
    .update(signedData)
    .digest("hex")
  
  // Compare signatures using timing-safe comparison
  try {
    return timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(headers.signature, "hex")
    )
  } catch {
    return false
  }
}

/**
 * Verify webhook timestamp to prevent replay attacks
 * Default tolerance: 5 minutes (300 seconds)
 * 
 * @param timestamp - Unix timestamp from X-Webhook-Timestamp header
 * @param toleranceSeconds - Max age in seconds (default 300)
 * @returns true if timestamp is within tolerance
 */
export function verifyWebhookTimestamp(
  timestamp: string,
  toleranceSeconds = 300
): boolean {
  const webhookTime = parseInt(timestamp, 10)
  if (isNaN(webhookTime)) return false
  
  const now = Math.floor(Date.now() / 1000)
  const diff = Math.abs(now - webhookTime)
  
  return diff <= toleranceSeconds
}

/**
 * Extract and validate webhook headers
 * 
 * @param headers - Request headers object
 * @returns Parsed headers or null if invalid
 */
export function parseWebhookHeaders(headers: Headers): WebhookHeaders | null {
  const signature = headers.get("X-Webhook-Signature")
  const timestamp = headers.get("X-Webhook-Timestamp")
  const event = headers.get("X-Webhook-Event")
  const deliveryId = headers.get("X-Webhook-Delivery")
  const environment = headers.get("X-Webhook-Environment")
  
  if (!signature || !timestamp || !event) {
    return null
  }
  
  return {
    signature,
    timestamp,
    event,
    deliveryId: deliveryId ?? undefined,
    environment: environment ?? "unknown",
  }
}

/**
 * Fully verify a webhook request
 * 
 * @param payload - Raw request body as string
 * @param headers - Request headers
 * @returns Parsed payload if valid, throws if invalid
 */
export function verifyWebhook(
  payload: string,
  headers: Headers
): GeniusPayWebhookPayload {
  // Parse headers
  const webhookHeaders = parseWebhookHeaders(headers)
  if (!webhookHeaders) {
    throw new Error("Missing required webhook headers")
  }
  
  // Verify timestamp (replay protection)
  if (!verifyWebhookTimestamp(webhookHeaders.timestamp)) {
    throw new Error("Webhook timestamp too old or invalid")
  }
  
  // Verify signature
  if (!verifyWebhookSignature(payload, webhookHeaders)) {
    throw new Error("Invalid webhook signature")
  }
  
  // Parse and validate payload
  let parsed: GeniusPayWebhookPayload
  try {
    parsed = JSON.parse(payload)
  } catch {
    throw new Error("Invalid JSON payload")
  }
  
  // Verify environment matches
  const configEnv = (optionalEnv("GENIUSPAY_ENV") as "sandbox" | "live") ?? "sandbox"
  if (parsed.environment !== configEnv) {
    console.warn(
      `[GeniusPay] Webhook environment mismatch: expected ${configEnv}, got ${parsed.environment}`
    )
    // Don't throw - allow processing but log warning
  }
  
  // Validate required fields
  if (!parsed.data?.reference || !parsed.data?.metadata) {
    throw new Error("Webhook payload missing required fields")
  }
  
  return parsed
}

/**
 * Check if webhook event is a payment completion event
 */
export function isPaymentCompletedEvent(event: string): boolean {
  return event === "payment.success"
}

/**
 * Check if webhook event is a payment failure event
 */
export function isPaymentFailedEvent(event: string): boolean {
  return ["payment.failed", "payment.cancelled", "payment.expired"].includes(event)
}

/**
 * Extract vendor ID from webhook metadata
 */
export function extractVendorIdFromMetadata(metadata: Record<string, string>): string | null {
  return metadata.vendor_id ?? null
}

/**
 * Extract subscription type from webhook metadata
 */
export function extractSubscriptionTypeFromMetadata(metadata: Record<string, string>): string | null {
  return metadata.type ?? null
}