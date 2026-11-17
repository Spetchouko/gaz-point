/**
 * GeniusPay Server Client
 * 
 * Handles all server-side interactions with GeniusPay API.
 * Never expose API secret or webhook secret to the client.
 */

import { requiredEnv, optionalEnv } from "@/lib/env"

const GENIUSPAY_BASE_URL = "https://geniuspay.ci/api/v1/merchant"

export type GeniusPayEnvironment = "sandbox" | "live"

export interface GeniusPayConfig {
  apiKey: string
  apiSecret: string
  webhookSecret: string
  environment: GeniusPayEnvironment
}

function getConfig(): GeniusPayConfig {
  const environment = (optionalEnv("GENIUSPAY_ENV") as GeniusPayEnvironment) ?? "sandbox"
  
  if (environment === "live") {
    return {
      apiKey: requiredEnv("GENIUSPAY_API_KEY"),
      apiSecret: requiredEnv("GENIUSPAY_API_SECRET"),
      webhookSecret: requiredEnv("GENIUSPAY_WEBHOOK_SECRET"),
      environment: "live",
    }
  }
  
  return {
    apiKey: requiredEnv("GENIUSPAY_API_KEY"),
    apiSecret: requiredEnv("GENIUSPAY_API_SECRET"),
    webhookSecret: requiredEnv("GENIUSPAY_WEBHOOK_SECRET"),
    environment: "sandbox",
  }
}

export interface InitiatePaymentRequest {
  amount: number // in XAF (5000 for vendor subscription)
  currency?: "XAF" | "XOF" | "EUR" | "USD"
  description: string
  customer: {
    name: string
    email: string
    phone?: string
    country?: string // ISO2 code, e.g., "CM" for Cameroon
  }
  successUrl: string
  errorUrl: string
  metadata: Record<string, string>
  // Omit payment_method to use GeniusPay checkout page
}

export interface InitiatePaymentResponse {
  success: boolean
  data?: {
    id: number
    reference: string // MTX-XXXXXXXXXX
    amount: number
    currency: string
    status: string
    checkout_url: string
    payment_url: string
    environment: string
    expires_at: string
    metadata: Record<string, string>
  }
  error?: {
    code: string
    message: string
  }
}

export interface PaymentDetails {
  id: number
  reference: string
  amount: number
  currency: string
  fees: number
  net_amount: number
  status: "pending" | "processing" | "completed" | "failed" | "cancelled" | "expired" | "refunded"
  payment_method: string | null
  payment_provider: string | null
  environment: "sandbox" | "live"
  customer: {
    name: string
    email: string
    phone: string
  }
  success_url: string
  error_url: string
  metadata: Record<string, string>
  created_at: string
  completed_at: string | null
}

export interface GetPaymentResponse {
  success: boolean
  data?: PaymentDetails
  error?: {
    code: string
    message: string
  }
}

export interface ListPaymentsResponse {
  success: boolean
  data?: Array<{
    id: number
    reference: string
    amount: number
    currency: string
    status: string
    payment_method: string
    customer_name: string
    created_at: string
  }>
  meta?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
  error?: {
    code: string
    message: string
  }
}

/**
 * Initiate a payment with GeniusPay
 * Returns checkout_url for redirecting the customer
 */
export async function initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
  const config = getConfig()
  
  const response = await fetch(`${GENIUSPAY_BASE_URL}/payments`, {
    method: "POST",
    headers: {
      "X-API-Key": config.apiKey,
      "X-API-Secret": config.apiSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: request.amount,
      currency: request.currency ?? "XAF",
      description: request.description,
      customer: request.customer,
      success_url: request.successUrl,
      error_url: request.errorUrl,
      metadata: request.metadata,
      // payment_method omitted to use GeniusPay checkout page
    }),
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    console.error("[GeniusPay] Initiate payment failed:", data)
    return {
      success: false,
      error: data.error ?? { code: "UNKNOWN_ERROR", message: "Payment initiation failed" },
    }
  }
  
  return data as InitiatePaymentResponse
}

/**
 * Get payment details by GeniusPay reference (MTX-XXXXXXXXXX)
 */
export async function getPayment(reference: string): Promise<GetPaymentResponse> {
  const config = getConfig()
  
  const response = await fetch(`${GENIUSPAY_BASE_URL}/payments/${reference}`, {
    method: "GET",
    headers: {
      "X-API-Key": config.apiKey,
      "X-API-Secret": config.apiSecret,
      "Content-Type": "application/json",
    },
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    console.error("[GeniusPay] Get payment failed:", data)
    return {
      success: false,
      error: data.error ?? { code: "UNKNOWN_ERROR", message: "Failed to retrieve payment" },
    }
  }
  
  return data as GetPaymentResponse
}

/**
 * List payments with optional filters
 */
export async function listPayments(params?: {
  status?: string
  payment_method?: string
  from?: string // YYYY-MM-DD
  to?: string // YYYY-MM-DD
  search?: string
  per_page?: number
}): Promise<ListPaymentsResponse> {
  const config = getConfig()
  
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set("status", params.status)
  if (params?.payment_method) searchParams.set("payment_method", params.payment_method)
  if (params?.from) searchParams.set("from", params.from)
  if (params?.to) searchParams.set("to", params.to)
  if (params?.search) searchParams.set("search", params.search)
  if (params?.per_page) searchParams.set("per_page", String(params.per_page))
  
  const response = await fetch(`${GENIUSPAY_BASE_URL}/payments?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      "X-API-Key": config.apiKey,
      "X-API-Secret": config.apiSecret,
      "Content-Type": "application/json",
    },
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    console.error("[GeniusPay] List payments failed:", data)
    return {
      success: false,
      error: data.error ?? { code: "UNKNOWN_ERROR", message: "Failed to list payments" },
    }
  }
  
  return data as ListPaymentsResponse
}

/**
 * Get merchant account info
 */
export async function getAccount() {
  const config = getConfig()
  
  const response = await fetch(`${GENIUSPAY_BASE_URL}/account`, {
    method: "GET",
    headers: {
      "X-API-Key": config.apiKey,
      "X-API-Secret": config.apiSecret,
      "Content-Type": "application/json",
    },
  })
  
  return response.json()
}

/**
 * Get merchant balance
 */
export async function getBalance() {
  const config = getConfig()
  
  const response = await fetch(`${GENIUSPAY_BASE_URL}/account/balance`, {
    method: "GET",
    headers: {
      "X-API-Key": config.apiKey,
      "X-API-Secret": config.apiSecret,
      "Content-Type": "application/json",
    },
  })
  
  return response.json()
}

/**
 * Get available PawaPay providers for a country
 */
export async function getPawaPayProviders(country?: string) {
  const config = getConfig()
  
  const url = country
    ? `${GENIUSPAY_BASE_URL}/pawapay/providers?country=${country}`
    : `${GENIUSPAY_BASE_URL}/pawapay/providers`
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-API-Key": config.apiKey,
      "X-API-Secret": config.apiSecret,
      "Content-Type": "application/json",
    },
  })
  
  return response.json()
}

/**
 * Subscription amount for vendor (fixed server-side)
 */
export const VENDOR_SUBSCRIPTION_AMOUNT = 5000 // XAF/FCFA
export const VENDOR_SUBSCRIPTION_CURRENCY = "XAF" as const
export const VENDOR_SUBSCRIPTION_DESCRIPTION = "Abonnement mensuel vendeur GazPoints"

/**
 * Build metadata for vendor subscription payment
 */
export function buildVendorSubscriptionMetadata(vendorId: string, vendorEmail: string): Record<string, string> {
  return {
    type: "vendor_subscription",
    vendor_id: vendorId,
    vendor_email: vendorEmail,
    plan: "monthly",
    amount: String(VENDOR_SUBSCRIPTION_AMOUNT),
    currency: VENDOR_SUBSCRIPTION_CURRENCY,
  }
}