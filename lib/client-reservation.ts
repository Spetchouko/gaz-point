import { requestJson } from "@/lib/client-request"

export type ClientReservationResult = {
  status: "confirmed"
  code: string
  expiresAt: string
  amount: number
  brand: string
  format: string
  quantity: number
  pointName: string
  pointDistrict: string
  reservedAt: string
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
}

function readText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function readNumber(value: unknown, fallback = 0): number {
  const numeric = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

/**
 * Crée une réservation et retourne les informations affichées dans la fenêtre
 * de confirmation. Le code et le montant doivent provenir du serveur : une
 * réponse incomplète est une erreur visible, jamais une fausse confirmation.
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

  const code = readText(reservation.code).trim()
  const amount = readNumber(reservation.amount)
  const quantity = readNumber(reservation.quantity, input.quantity ?? 1)

  if (!code || amount <= 0 || quantity < 1) {
    throw new Error("La réservation n’a pas pu être confirmée.")
  }

  return {
    status: "confirmed",
    code,
    expiresAt: readText(reservation.expiresAt),
    amount,
    brand: readText(reservation.brand),
    format: readText(reservation.format),
    quantity,
    pointName: readText(reservation.pointName),
    pointDistrict: readText(reservation.pointDistrict),
    reservedAt: readText(reservation.reservedAt),
  }
}
