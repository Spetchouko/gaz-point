"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageLoading, Spinner } from "@/app/_components/spinner"
import {
  isUnauthenticatedRequest,
  requestJson,
} from "@/lib/client-request"

type ReturnState =
  | "loading"
  | "pending"
  | "payment_error"
  | "success"
  | "failed"
  | "error"

type ReservationStatusResponse = {
  reservations?: Array<{
    id: string
    reservationCode: string
    status: string
    brand: string
    format: string
    pointName: string | null
    pointDistrict: string | null
    expiresAt: string | null
  }>
}

const MAX_AUTOMATIC_CHECKS = 4

function PaiementRetourPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reservationId = searchParams.get("reservation")?.trim() ?? ""
  const paymentError = searchParams.get("status") === "error"
  const [state, setState] = useState<ReturnState>("loading")
  const [message, setMessage] = useState("")
  const [reservation, setReservation] = useState<
    NonNullable<ReservationStatusResponse["reservations"]>[number] | null
  >(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!reservationId) {
      setState("error")
      setMessage("La réservation à vérifier est introuvable dans le lien de retour.")
      return
    }

    const controller = new AbortController()
    let cancelled = false

    async function loadReservationStatus() {
      if (attempt === 0) setState("loading")

      try {
        const params = new URLSearchParams({
          reservation: reservationId,
          page: "1",
          pageSize: "1",
        })
        const data = await requestJson<ReservationStatusResponse>(
          `/api/reservation/my?${params.toString()}`,
          {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: controller.signal,
          }
        )

        if (cancelled) return

        const row = data.reservations?.find((item) => item.id === reservationId)
        if (!row) {
          setState("error")
          setMessage("Cette réservation est introuvable pour votre compte.")
          return
        }

        setReservation(row)

        if (row.status === "confirmed" || row.status === "collected") {
          setState("success")
          setMessage(
            row.status === "collected"
              ? "Cette réservation a déjà été récupérée."
              : "Le paiement est confirmé et votre réservation est prête."
          )
          return
        }

        if (row.status === "pending") {
          if (paymentError) {
            setState("payment_error")
            setMessage(
              "Le paiement n’a pas été finalisé. La réservation reste en attente tant que le prestataire n’a pas confirmé un état final."
            )
          } else {
            setState("pending")
            setMessage(
              "Le paiement a été reçu. Nous attendons sa confirmation définitive avant de valider la réservation."
            )
          }
          return
        }

        setState("failed")
        setMessage(
          row.status === "expired"
            ? "La réservation a expiré et le stock a été libéré."
            : "Le paiement n’a pas abouti. La réservation a été annulée."
        )
      } catch (requestError) {
        if (cancelled) return

        if (isUnauthenticatedRequest(requestError)) {
          const destination = `/dashboard/reservations?reservation=${encodeURIComponent(reservationId)}`
          router.replace(`/connexion?redirect=${encodeURIComponent(destination)}`)
          return
        }

        setState("error")
        setMessage(
          requestError instanceof Error
            ? requestError.message
            : "Impossible de vérifier le paiement. Réessayez."
        )
      }
    }

    void loadReservationStatus()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [attempt, paymentError, reservationId, router])

  useEffect(() => {
    if (
      (state !== "pending" && state !== "payment_error") ||
      attempt >= MAX_AUTOMATIC_CHECKS
    ) {
      return
    }

    const timer = window.setTimeout(() => {
      setAttempt((value) => value + 1)
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [attempt, state])

  const reservationHref = `/dashboard/reservations?reservation=${encodeURIComponent(reservationId)}`

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="container mx-auto max-w-md">
        <Card className="shadow-sm">
          <CardHeader className="pb-3 text-center">
            {state === "loading" && (
              <>
                <Spinner size="lg" />
                <CardTitle className="text-xl font-bold">
                  Vérification du paiement
                </CardTitle>
              </>
            )}
            {state === "pending" && (
              <>
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-warning/10 text-warning">
                  <Clock3 className="size-7" />
                </div>
                <CardTitle className="text-xl font-bold">
                  Confirmation en cours
                </CardTitle>
              </>
            )}
            {state === "payment_error" && (
              <>
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-warning/10 text-warning">
                  <ShieldAlert className="size-7" />
                </div>
                <CardTitle className="text-xl font-bold">
                  Paiement non finalisé
                </CardTitle>
              </>
            )}
            {state === "success" && (
              <>
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
                  <CheckCircle2 className="size-7" />
                </div>
                <CardTitle className="text-xl font-bold">
                  Réservation confirmée
                </CardTitle>
              </>
            )}
            {state === "failed" && (
              <>
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertCircle className="size-7" />
                </div>
                <CardTitle className="text-xl font-bold">
                  Réservation non validée
                </CardTitle>
              </>
            )}
            {state === "error" && (
              <>
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertCircle className="size-7" />
                </div>
                <CardTitle className="text-xl font-bold">
                  Vérification impossible
                </CardTitle>
              </>
            )}
            <CardDescription>{message}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {reservation && (
              <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Réservation</span>
                  <span className="font-mono font-semibold">
                    {reservation.reservationCode}
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Bouteille</span>
                  <span className="text-right font-medium">
                    {reservation.brand} {reservation.format}
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Point de vente</span>
                  <span className="text-right font-medium">
                    {reservation.pointName ?? "—"}
                  </span>
                </div>
              </div>
            )}

            {state === "success" && (
              <Button
                nativeButton={false}
                render={<Link href={reservationHref} />}
                className="h-11 w-full text-base"
              >
                Voir ma réservation
              </Button>
            )}

            {(state === "pending" || state === "payment_error") && (
              <>
                <Button
                  className="h-11 w-full gap-2 text-base"
                  onClick={() => setAttempt((value) => value + 1)}
                >
                  <RefreshCw className="size-4" />
                  Vérifier à nouveau
                </Button>
                <Button
                  nativeButton={false}
                  render={<Link href={reservationHref} />}
                  variant="outline"
                  className="h-11 w-full text-base"
                >
                  Voir mes réservations
                </Button>
              </>
            )}

            {state === "failed" && (
              <Button
                nativeButton={false}
                render={<Link href={reservationHref} />}
                variant="outline"
                className="h-11 w-full text-base"
              >
                Voir le détail de la réservation
              </Button>
            )}

            {state === "error" && (
              <>
                {reservationId && (
                  <Button
                    className="h-11 w-full gap-2 text-base"
                    onClick={() => setAttempt((value) => value + 1)}
                  >
                    <RefreshCw className="size-4" />
                    Réessayer
                  </Button>
                )}
                <Button
                  nativeButton={false}
                  render={<Link href="/contact" />}
                  variant="outline"
                  className="h-11 w-full text-base"
                >
                  Contacter le support
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function PaiementRetourPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PaiementRetourPageContent />
    </Suspense>
  )
}
