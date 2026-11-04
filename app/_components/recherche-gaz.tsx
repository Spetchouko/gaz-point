"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronDown,
  LocateFixed,
  MapPin,
  Phone,
  Search,
  Shield,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { availabilityLabel } from "@/lib/gaz"
import { authClient } from "@/lib/auth-client"
import type { AvailabilityStatus } from "@/db/schema"
import {
  ReservationModal,
  type ReservationResult,
} from "@/app/_components/reservation-modal"

const selectClass =
  "mt-1.5 h-12 w-full appearance-none rounded-xl border border-bg-background px-3 pr-9 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50"

export type SearchResult = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  brands: string[]
  formats: string[]
  status: AvailabilityStatus | null
  note: string | null
  quantity: number | null
  price: number | null
  format: string | null
  brand: string | null
  expiresAt: string | null
  updatedAt: string | null
  updatedBy: string | null
  source: string | null
  stale: boolean
  expired: boolean
  disponibiliteId: string
}

/**
 * Bloc de recherche de gaz : formulaire (marque / format / zone),
 * résultats en direct et réservation. Partagé entre la page
 * d'accueil (hero) et le dashboard client.
 */
export function RechercheGaz() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [brand, setBrand] = useState("")
  const [format, setFormat] = useState("")
  const [zone, setZone] = useState("")
  const [locationLabel, setLocationLabel] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reservationPoint, setReservationPoint] = useState<SearchResult | null>(null)
  const [defaultAmountType, setDefaultAmountType] = useState<"reservation" | "consigne">("reservation")

  const handleReserve = async (
    amountType: "reservation" | "consigne"
  ): Promise<ReservationResult> => {
    if (!reservationPoint) {
      throw new Error("Aucun point sélectionné")
    }

    const res = await fetch("/api/reservation/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        disponibiliteId: reservationPoint.disponibiliteId,
        brand: reservationPoint.brand,
        format: reservationPoint.format,
        quantity: 1,
        amountType,
      }),
    })

    const data = await res.json()

    if (!res.ok || data.error) {
      throw new Error(data.error || "Erreur lors de la réservation")
    }

    return {
      code: data.reservation.code,
      expiresAt: data.reservation.expiresAt,
      amount: data.reservation.amount,
      amountType: data.reservation.amountType,
      brand: data.reservation.brand,
      format: data.reservation.format,
      quantity: data.reservation.quantity,
    }
  }

  const openReservationModal = (point: SearchResult, defaultType?: "reservation" | "consigne") => {
    setReservationPoint(point)
    setDefaultAmountType(defaultType ?? "reservation")
  }

  const closeReservationModal = () => {
    setReservationPoint(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // La recherche est réservée aux comptes : le visiteur non connecté
    // est redirigé vers le parcours d'inscription existant.
    if (!session?.user) {
      const redirectTo = "/(auth)/inscription/usager"
      router.push(redirectTo)
      return
    }

    // Ici, on pourrait appeler une Server Action ou fetch pour valider le formulaire.
    // Pour l'instant, on redirige simplement.
    router.push("/dashboard")
  }

  const resetState = () => {
    setBrand("")
    setFormat("")
    setZone("")
    setLocationLabel(null)
    setResults(null)
    setLoading(false)
    setError(null)
    setReservationPoint(null)
    setDefaultAmountType("reservation")
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        {/* ---------- Bloc de recherche ---------- */}
        <div className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="recherche-marque" className="block mb-1">
                  Marque
                </label>
                <Input
                  id="recherche-marque"
                  type="text"
                  name="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Total, Bouyguescom, Tradex"
                  className={selectClass}
                />
              </div>
              <div>
                <label htmlFor="recherche-format" className="block mb-1">
                  Format
                </label>
                <Input
                  id="recherche-format"
                  type="text"
                  name="format"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  placeholder="12,5 kg, 6 kg"
                  className={selectClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="recherche-zone" className="block mb-1">
                Zone / Département
              </label>
              <Input
                id="recherche-zone"
                type="text"
                name="zone"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="Ex: Littoral, Ouest"
                className={selectClass}
              />
            </div>

            <Button type="submit" className="w-full h-10">
              Chercher
            </Button>
          </form>
        </div>

        {/* ---------- Résultats de recherche ---------- */}
        <div>
          <h3 className="text-center font-heading text-base sm:text-lg font-semibold text-foreground">
            {results !== null
              ? `${results.length} point${results.length > 1 ? "s" : ""} trouvé${results.length > 1 ? "s" : ""}`
              : "Aucun point trouvé"}
          </h3>

          {results !== null && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((point) => (
                <Card key={point.id} className="shadow-sm border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2 px-4 pt-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <CardTitle className="truncate text-base font-semibold text-foreground leading-snug">
                        {point.name}
                      </CardTitle>
                      {point.status && (
                        <Badge
                          variant="outline"
                          className={
                            point.status === "disponible"
                              ? "border-primary/30 bg-mint text-primary-strong"
                              : point.status === "a_confirmer"
                                ? "border-warning/20 bg-warning/10 text-warning"
                                : "border-destructive/20 bg-destructive/10 text-destructive"
                          }
                        >
                          {availabilityLabel[point.status]}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 pb-3">
                    <div className="flex flex-col sm:flex-row gap-2 text-xs text-muted-foreground">
                      {point.brand && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Marque :</span>
                          <span>{point.brand}</span>
                        </div>
                      )}
                      {point.format && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Grammage :</span>
                          <span>{point.format}</span>
                        </div>
                      )}
                      {point.phone && (
                        <div className="flex items-center gap-1 text-destructive">
                          <Phone className="size-3 shrink-0" />
                          <span>{point.phone}</span>
                        </div>
                      )}
                    </div>
                    <p className="truncate line-clamp-1">
                      {point.district} — {point.address}
                    </p>
                  </CardContent>
                  <div className="px-4 pb-3 border-t border-border">
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full h-10 text-lg font-medium shadow-sm border-primary/25 bg-primary text-primary-strong"
                      onClick={() => openReservationModal(point)}
                      disabled={point.status !== "disponible"
                      }
                    >
                      <Shield className="size-3 mr-2" />
                      Faire une réservation
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {reservationPoint && (
        <ReservationModal
          open={!!reservationPoint}
          onClose={closeReservationModal}
          point={reservationPoint}
          onConfirm={handleReserve}
          defaultAmountType={defaultAmountType}
        />
      )}
    </div>
  )
}