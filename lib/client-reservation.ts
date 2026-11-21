import { requestJson } from "@/lib/client-request"
import { validatePaymentCheckoutUrl } from "@/lib/payment-checkout"

export type ClientReservationResult = {
  status: "pending"
  code: string
  expiresAt: string
  amount: number
  brand: string
  format: string
  quantity: number
  pointName: string
  pointDistrict: string
  reservedAt: string
  checkoutUrl: string
  paymentReference?: string
}

type CreateReservationInput = {
  disponibiliteId: string
  brand?: string | null
  format?: string | null
  quantity?: number
  amountType?: "reservation" | "consigne" | "mixed"
}

type CreateReservationResponse = {
  reservation?: {
    code?: unknown
    expiresAt?: unknown
    amount?: unknown
    brand?: unknown
    format?: unknown
    quantity?: unknown
    pointName?: unknown
    pointDistrict?: unknown
    reservedAt?: unknown
  }
  payment?: {
    checkoutUrl?: unknown
    reference?: unknown
  }
}

function readText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function readNumber(value: unknown, fallback = 0): number {
  const numeric = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

/**
 * Crée une réservation et retourne les informations nécessaires à la modale.
 * La réponse doit contenir une URL de checkout HTTPS valide. Une URL absente
 * ou invalide est une erreur visible, jamais une fausse confirmation.
 */
export async function createClientReservation(
  input: CreateReservationInput
): Promise<ClientReservationResult> {
  const data = await requestJson<CreateReservationResponse>(
    "/api/reservation/create",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        disponibiliteId: input.disponibiliteId,
        brand: input.brand ?? undefined,
        format: input.format ?? undefined,
        quantity: input.quantity ?? 1,
        amountType: input.amountType ?? "reservation",
      }),
    }
  )

  const reservation = data.reservation
  if (!reservation) {
    throw new Error("La réservation n’a pas pu être créée.")
  }

  const checkoutUrl = validatePaymentCheckoutUrl(data.payment?.checkoutUrl)

  return {
    status: "pending",
    code: readText(reservation.code),
    expiresAt: readText(reservation.expiresAt),
    amount: readNumber(reservation.amount),
    brand: readText(reservation.brand),
    format: readText(reservation.format),
    quantity: readNumber(reservation.quantity, 1),
    pointName: readText(reservation.pointName),
    pointDistrict: readText(reservation.pointDistrict),
    reservedAt: readText(reservation.reservedAt),
    checkoutUrl,
    paymentReference:
      typeof data.payment?.reference === "string"
        ? data.payment.reference
        : undefined,
  }
}
