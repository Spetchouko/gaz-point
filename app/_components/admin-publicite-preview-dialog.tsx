"use client"

import { Calendar, ExternalLink, MapPin, Phone, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  PublicitePreview,
  type PubliciteBannerData,
} from "@/app/_components/publicite-banner"
import { formatDateTime } from "@/lib/gaz"
import {
  PUBLICITE_SLOTS,
  PUBLICITE_SLOT_VALUES,
  PUBLICITE_STATUS_LABELS,
  isPubliciteImageUrl,
  isPubliciteStatus,
  publiciteSlotLabel,
} from "@/lib/publicite-config"
import type { PubliciteRow } from "@/app/_components/admin-publicite-table"

function statusLabel(status: string): string {
  return isPubliciteStatus(status) ? PUBLICITE_STATUS_LABELS[status] : status
}

export function AdminPublicitePreviewDialog({
  ad,
  open,
  onClose,
}: {
  ad: PubliciteRow | null
  open: boolean
  onClose: () => void
}) {
  if (!ad) return null

  const banner: PubliciteBannerData = {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    image: isPubliciteImageUrl(ad.image) ? ad.image : null,
    price: ad.price,
    priceLabel: ad.priceLabel,
    location: ad.location,
    phone: ad.phone,
    linkUrl: ad.linkUrl,
    startAt: ad.startAt,
    endAt: ad.endAt,
    status: ad.status,
  }

  const legacySlot = !PUBLICITE_SLOT_VALUES.includes(ad.slot)
  const priceText =
    ad.priceLabel ??
    (ad.price !== null
      ? `${new Intl.NumberFormat("fr-FR").format(ad.price)} FCFA`
      : null)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Aperçu — {ad.title}</DialogTitle>
          <DialogDescription>
            Rendu de la bannière sur l&apos;accueil, aux deux emplacements
            disponibles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {legacySlot && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Cette publicité utilise l&apos;ancien emplacement «{" "}
              {publiciteSlotLabel(ad.slot)} » qui n&apos;est plus diffusé. Elle
              n&apos;apparaît donc plus sur le site.
            </p>
          )}

          {PUBLICITE_SLOTS.map((slot) => (
            <div key={slot.value} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{slot.label}</p>
                <span className="text-xs text-muted-foreground">{slot.hint}</span>
              </div>
              <PublicitePreview ad={banner} slot={slot.value} />
            </div>
          ))}

          <dl className="grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <Badge variant="outline">{statusLabel(ad.status)}</Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-4 shrink-0" />
              <span>
                {ad.startAt ? formatDateTime(ad.startAt) : "Dès que possible"}
                {" → "}
                {ad.endAt ? formatDateTime(ad.endAt) : "sans limite"}
              </span>
            </div>
            {priceText && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Tag className="size-4 shrink-0" />
                <span>{priceText}</span>
              </div>
            )}
            {ad.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4 shrink-0" />
                <span>{ad.location}</span>
              </div>
            )}
            {ad.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4 shrink-0" />
                <span>{ad.phone}</span>
              </div>
            )}
            {ad.linkUrl && (
              <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                <ExternalLink className="size-4 shrink-0" />
                <a
                  href={ad.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-primary hover:underline"
                >
                  {ad.linkUrl}
                </a>
              </div>
            )}
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  )
}
