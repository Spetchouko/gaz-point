"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  MapPin,
  Navigation,
  Package,
  Phone,
  RotateCcw,
  Truck,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  availabilityBadgeClass,
  formatPrice,
} from "@/lib/gaz"
import { useSafeSession } from "@/lib/auth-session"
import { createClientReservation } from "@/lib/client-reservation"
import type { ClientReservationResult } from "@/lib/client-reservation"
import type { AvailabilityStatus } from "@/db/schema"
import {
  MAX_RESERVATION_QUANTITY,
  normalizeReservationQuantity,
  type DisponibiliteOverlayStep,
} from "@/lib/disponibilite-overlay"
import {
  buildDisponibiliteView,
  listDisponibiliteServices,
  phoneHref,
  type DisponibiliteApiData,
  type DisponibiliteServiceKey,
} from "@/lib/disponibilite-view"
import type { SearchResultItem } from "@/lib/search-service"
import { calculateReservationAmount, RESERVATION_UNIT_AMOUNT } from "@/lib/reservation-amount"
import { copyReservationCode } from "@/lib/reservation-clipboard"
import { cn } from "@/lib/utils"

type DisponibiliteModalProps = {
  item: SearchResultItem
  step: DisponibiliteOverlayStep
  quantity: number
  onStepChange: (step: DisponibiliteOverlayStep) => void
  onQuantityChange: (quantity: number) => void
  onClose: () => void
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium text-foreground">{children}</div>
    </div>
  )
}

function ServiceBadge({
  icon: Icon,
  label,
  detail,
}: {
  icon: typeof Package
  label: string
  detail?: string | null
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground">
      <Icon className="size-3.5 shrink-0 text-primary" aria-hidden />
      {label}
      {detail ? <span className="text-muted-foreground">· {detail}</span> : null}
    </span>
  )
}

const SERVICE_ICONS: Record<DisponibiliteServiceKey, typeof Package> = {
  delivery: Truck,
  exchange: RotateCcw,
  gasSale: Package,
}

/**
 * Fenêtre superposée unique pour les détails d'une disponibilité et sa
 * réservation. Les deux formulaires se remplacent sans démonter le dialogue :
 * l'état saisi (quantité) et la disponibilité sélectionnée sont conservés.
 */
export default function DisponibiliteModal({
  item,
  step,
  quantity,
  onStepChange,
  onQuantityChange,
  onClose,
}: DisponibiliteModalProps) {
  const { data: session, isPending: sessionPending } = useSafeSession()
  const [detail, setDetail] = useState<DisponibiliteApiData | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [reservation, setReservation] = useState<ClientReservationResult | null>(null)
  const [selectedServiceKeys, setSelectedServiceKeys] = useState<DisponibiliteServiceKey[]>([])
  const [codeCopied, setCodeCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    async function loadDetail() {
      try {
        setLoadingDetail(true)
        setLoadError(null)
        const response = await fetch(
          `/api/disponibilite/${encodeURIComponent(item.disponibiliteId)}`,
          {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: controller.signal,
          }
        )
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Disponibilité introuvable"
              : "Détails indisponibles pour le moment"
          )
        }
        const payload = (await response.json()) as DisponibiliteApiData
        if (!payload?.disponibilite || !payload?.pointDeVente) {
          throw new Error("Réponse inattendue du serveur")
        }
        if (!cancelled) setDetail(payload)
      } catch (error) {
        if (!cancelled && !controller.signal.aborted) {
          setLoadError(
            error instanceof Error ? error.message : "Impossible de charger les détails"
          )
        }
      } finally {
        if (!cancelled) setLoadingDetail(false)
      }
    }

    void loadDetail()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [item.disponibiliteId])

  const view = useMemo(() => buildDisponibiliteView(item, detail), [item, detail])
  const availableServices = useMemo(() => listDisponibiliteServices(view), [view])
  const callableHref = phoneHref(view.phone)
  const maxQuantity = normalizeReservationQuantity(
    MAX_RESERVATION_QUANTITY,
    view.availableQuantity
  )
  const reservationAmount = calculateReservationAmount(quantity) ?? RESERVATION_UNIT_AMOUNT
  const clientName = session?.user?.name?.trim() || "Non renseigné"
  const clientEmail = session?.user?.email?.trim() || "Non renseigné"
  const clientPhone = session?.user?.phoneNumber?.trim() || "Non renseigné"

  const handleConfirm = useCallback(async () => {
    if (!session?.user) {
      setSubmitError("Connectez-vous pour réserver cette bouteille.")
      return
    }
    if (!view.isReservable) {
      setSubmitError("Cette disponibilité n'est plus réservable.")
      return
    }
    const calculatedAmount = calculateReservationAmount(quantity)
    if (calculatedAmount === null || quantity > maxQuantity) {
      setSubmitError(`Choisissez une quantité entre 1 et ${maxQuantity}.`)
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    setCodeCopied(false)
    setCopyError(null)
    try {
      const result = await createClientReservation({
        disponibiliteId: item.disponibiliteId,
        brand: view.brand,
        format: view.format,
        quantity,
        amountType: "reservation",
      })
      setReservation(result)
      onStepChange("confirmation")
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "La réservation n'a pas pu être créée"
      )
    } finally {
      setSubmitting(false)
    }
  }, [
    item.disponibiliteId,
    maxQuantity,
    onStepChange,
    quantity,
    session?.user,
    view.brand,
    view.format,
    view.isReservable,
  ])

  const handleCopyCode = async () => {
    if (!reservation?.code) return
    const copied = await copyReservationCode(reservation.code)
    if (copied) {
      setCodeCopied(true)
      setCopyError(null)
    } else {
      setCopyError("La copie n'a pas pu être effectuée. Sélectionnez le code manuellement.")
    }
  }

  const mapsDestination = [view.depotName, view.localisation]
    .filter(Boolean)
    .join(", ")
  const mapsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsDestination)}`

  const title =
    step === "details"
      ? "Détails de la disponibilité"
      : step === "reservation"
        ? "Réserver cette bouteille"
        : "Réservation enregistrée"

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex h-[calc(100dvh-1rem)] max-h-none w-[calc(100%-1rem)] max-w-none flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-popover p-0 text-popover-foreground shadow-2xl sm:h-auto sm:max-h-[min(88dvh,44rem)] sm:w-full sm:max-w-xl md:max-w-xl"
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-border bg-muted/30 px-5 py-4 pr-14 text-left">
          <DialogTitle className="font-heading text-lg font-extrabold tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="truncate text-xs">
            {view.depotName}
          </DialogDescription>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="absolute right-3 top-3 h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
            Fermer
          </Button>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {step === "details" && (
            <div className="space-y-5">
              <section className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "whitespace-nowrap",
                      availabilityBadgeClass[view.status as AvailabilityStatus]
                    )}
                  >
                    {view.statusLabel}
                  </Badge>
                  {view.availableQuantity != null && (
                    <span className="text-xs text-muted-foreground">
                      {view.availableQuantity} bouteille
                      {view.availableQuantity > 1 ? "s" : ""} disponible
                      {view.availableQuantity > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <p className="flex items-start gap-1.5 text-sm text-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {view.localisation || "Localisation non renseignée"}
                </p>
                {view.distanceKm != null && (
                  <p className="pl-5.5 text-xs text-muted-foreground">
                    À {view.distanceKm} km de votre position
                  </p>
                )}
              </section>

              <section className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-muted/20 p-4">
                <DetailRow label="Marque">{view.brand ?? "—"}</DetailRow>
                <DetailRow label="Grammage">
                  {view.format ?? view.weightKg ?? "—"}
                </DetailRow>
                <DetailRow label="Prix renseigné">
                  {view.priceLabel ?? "Non renseigné"}
                </DetailRow>
                <DetailRow label="Quantité">
                  {view.availableQuantity == null
                    ? "Non renseignée"
                    : `${view.availableQuantity} bouteille${view.availableQuantity > 1 ? "s" : ""}`}
                </DetailRow>
                <DetailRow label="Expiration">
                  {view.expiresAtLabel ?? "Non renseignée"}
                </DetailRow>
                <DetailRow label="Mise à jour">
                  {view.updatedAtLabel ?? "Non renseignée"}
                </DetailRow>
              </section>

              <section className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Services disponibles à ce point de vente
                </p>
                {availableServices.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableServices.map((service) => (
                      <ServiceBadge
                        key={service.key}
                        icon={SERVICE_ICONS[service.key]}
                        label={service.label}
                        detail={service.detail}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Aucun service complémentaire activé par ce dépôt.
                  </p>
                )}
              </section>

              <section className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Coordonnées disponibles
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {callableHref ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5 text-xs"
                        nativeButton={false}
                        render={
                          <a href={callableHref}>
                            <Phone className="size-3.5 text-primary" aria-hidden />
                            Appeler le dépôt
                          </a>
                        }
                      />
                      <span className="break-all text-xs text-foreground">
                        {view.phone}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Téléphone non renseigné
                    </span>
                  )}
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-foreground transition-colors hover:bg-muted"
                  >
                    <Navigation className="size-3.5 text-primary" aria-hidden />
                    Itinéraire
                  </a>
                </div>
              </section>

              {view.conditions.length > 0 && (
                <section className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Prix et conditions renseignés par le vendeur
                  </p>
                  <ul className="space-y-1.5 rounded-xl border border-border bg-muted/20 p-3 text-xs text-foreground">
                    {view.conditions.map((condition) => (
                      <li key={condition} className="flex gap-2">
                        <span className="text-primary" aria-hidden>
                          •
                        </span>
                        {condition}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {loadingDetail && (
                <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Actualisation des détails…
                </p>
              )}
              {loadError && (
                <p className="flex items-start gap-2 text-xs text-warning" role="status">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {loadError} — informations affichées à partir du résultat de recherche.
                </p>
              )}

              {view.isReservable ? (
                <Button
                  type="button"
                  onClick={() => onStepChange("reservation")}
                  className="h-11 w-full gap-2 text-sm font-semibold"
                >
                  <Package className="size-4" aria-hidden />
                  Réserver cette bouteille
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Cette disponibilité n&apos;est plus réservable.
                </p>
              )}
            </div>
          )}

          {step === "reservation" && (
            <div className="space-y-5">
              <section className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Package className="size-4 text-primary" aria-hidden />
                  {view.brand ?? "Bouteille"} {view.format ?? ""}
                </p>
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {view.depotName} — {view.localisation}
                </p>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">Quantité</span>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={quantity <= 1}
                      aria-label="Diminuer la quantité"
                      onClick={() => onQuantityChange(quantity - 1)}
                    >
                      −
                    </Button>
                    <span className="min-w-6 text-center text-sm font-semibold" aria-live="polite">
                      {quantity}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={quantity >= maxQuantity}
                      aria-label="Augmenter la quantité"
                      onClick={() => onQuantityChange(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                {view.priceLabel && (
                  <p className="text-xs text-muted-foreground">
                    Prix de la bouteille au dépôt : {view.priceLabel}
                  </p>
                )}
              </section>

              {availableServices.length > 0 && (
                <section className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Services disponibles à ce point de vente
                  </p>
                  <div className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-2">
                    {availableServices.map((service) => {
                      const Icon = SERVICE_ICONS[service.key]
                      return (
                        <label
                          key={service.key}
                          className="flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={selectedServiceKeys.includes(service.key)}
                            onChange={() =>
                              setSelectedServiceKeys((current) =>
                                current.includes(service.key)
                                  ? current.filter((key) => key !== service.key)
                                  : [...current, service.key]
                              )
                            }
                            className="size-4 shrink-0 accent-primary"
                          />
                          <Icon className="size-3.5 shrink-0 text-primary" aria-hidden />
                          <span className="min-w-0 font-medium text-foreground">
                            {service.label}
                          </span>
                          {service.detail ? (
                            <span className="ml-auto shrink-0 text-muted-foreground">
                              {service.detail}
                            </span>
                          ) : null}
                        </label>
                      )
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Sélectionnez ou validez ces services auprès du dépôt. Le prix est
                    discuté ou payé au dépôt.
                  </p>
                </section>
              )}

              <section className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Informations du client
                </p>
                <div className="grid gap-2 rounded-xl border border-border p-4 text-xs sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Nom</p>
                    <p className="font-medium text-foreground">{clientName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Adresse e-mail</p>
                    <p className="break-all font-medium text-foreground">{clientEmail}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Téléphone</p>
                    <p className="font-medium text-foreground">{clientPhone}</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Ces informations proviennent de votre compte GazPoints et sont
                  transmises au vendeur avec la réservation. Vous pouvez les modifier
                  depuis votre profil.
                </p>
              </section>

              <section className="space-y-2 rounded-xl border border-primary/25 bg-primary/5 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Montant à payer au dépôt</span>
                  <span className="font-semibold text-foreground">
                    {formatPrice(reservationAmount)}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Le paiement s&apos;effectue directement auprès du vendeur, au dépôt,
                  après présentation de votre numéro de réservation généré sur
                  GazPoints. Aucun paiement n&apos;est effectué sur la plateforme.
                </p>
              </section>

              {submitError && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {submitError}
                </p>
              )}
            </div>
          )}

          {step === "confirmation" && reservation && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/5 p-4">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Votre réservation a été enregistrée avec succès&nbsp;!
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Présentez ce numéro au vendeur pour récupérer votre réservation
                    et régler directement au dépôt.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Numéro de réservation
                </p>
                <p className="mt-2 select-all font-mono text-xl font-bold tracking-widest text-foreground">
                  {reservation.code}
                </p>
                {copyError ? (
                  <p className="mt-2 text-[11px] text-destructive" role="alert">
                    {copyError}
                  </p>
                ) : codeCopied ? (
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-success">
                    <Check className="size-3.5" aria-hidden />
                    Code copié
                  </p>
                ) : null}
                <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Clock3 className="size-3.5" aria-hidden />
                  Valable jusqu&apos;au{" "}
                  {reservation.expiresAt
                    ? new Date(reservation.expiresAt).toLocaleString("fr-FR")
                    : "—"}
                </p>
              </div>

              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <p>
                  <span className="font-semibold text-foreground">Point de vente : </span>
                  {reservation.pointName}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Bouteille : </span>
                  {reservation.brand} {reservation.format}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Quantité : </span>
                  {reservation.quantity}
                </p>
                <p>
                  <span className="font-semibold text-foreground">
                    Montant à régler au dépôt :{" "}
                  </span>
                  {formatPrice(reservation.amount)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/20 px-5 py-3">
          {step === "details" ? (
            <>
              <Button type="button" variant="ghost" onClick={onClose} className="text-xs">
                Fermer
              </Button>
              {view.isReservable ? (
                <Button
                  type="button"
                  onClick={() => onStepChange("reservation")}
                  className="h-11 flex-1 gap-2 text-sm font-semibold sm:flex-none sm:px-6"
                >
                  <Package className="size-4" aria-hidden />
                  Réserver cette bouteille
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Cette disponibilité n&apos;est plus réservable.
                </p>
              )}
            </>
          ) : null}

          {step === "reservation" ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onStepChange("details")}
                disabled={submitting}
                className="text-xs"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Retour aux détails
              </Button>
              <Button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={submitting || sessionPending || !session?.user}
                className="h-11 flex-1 gap-2 text-sm font-semibold sm:flex-none sm:px-6"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Préparation…
                  </>
                ) : (
                  <>
                    <Package className="size-4" aria-hidden />
                    Confirmer la réservation
                  </>
                )}
              </Button>
            </>
          ) : null}

          {step === "confirmation" ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleCopyCode()}
                disabled={!reservation?.code}
                className="h-11 gap-2 text-sm font-semibold sm:px-5"
              >
                {codeCopied ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  <Copy className="size-4" aria-hidden />
                )}
                {codeCopied ? "Code copié" : "Copier le code"}
              </Button>
              <Button
                type="button"
                onClick={onClose}
                className="h-11 flex-1 gap-2 text-sm font-semibold sm:flex-none sm:px-6"
              >
                Fermer
              </Button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
