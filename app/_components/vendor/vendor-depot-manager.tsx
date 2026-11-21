"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  LocateFixed,
  MapPin,
  Package,
  Save,
  Store,
  Truck,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BrandListInput } from "@/app/_components/brand-list-input"
import { FormatListInput } from "@/app/_components/format-list-input"
import {
  VendorErrorState,
  VendorNotice,
  VendorPageHeader,
  VendorSectionCard,
  VendorStatusBadge,
} from "@/app/_components/vendor/vendor-ui"
import { formatDateTime } from "@/lib/gaz"
import type {
  VendorDepotDto,
  VendorOnboardingDto,
} from "@/lib/vendor-dashboard"

type DepotPayload = VendorDepotDto

function toPayload(value: unknown): DepotPayload | null {
  if (!value || typeof value !== "object") return null
  const row = value as Partial<DepotPayload>
  if (!row.id || !row.name) return null
  return {
    id: row.id,
    name: row.name,
    district: row.district ?? "",
    address: row.address ?? "",
    phone: row.phone ?? null,
    brands: row.brands ?? [],
    formats: row.formats ?? [],
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    deliveryEnabled: Boolean(row.deliveryEnabled),
    deliveryFee: row.deliveryFee ?? 0,
    exchangeEnabled: Boolean(row.exchangeEnabled),
    exchangeBrands: row.exchangeBrands ?? [],
    exchangeFormats: row.exchangeFormats ?? [],
    gasSaleEnabled: Boolean(row.gasSaleEnabled),
    isActive: row.isActive ?? true,
    createdAt: row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updatedAt ?? new Date().toISOString(),
  }
}

export function VendorDepotManager({
  depot: initialDepot,
  onboarding,
}: {
  depot: VendorDepotDto | null
  onboarding: VendorOnboardingDto | null
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement | null>(null)
  const [depot, setDepot] = useState(initialDepot)

  const [name, setName] = useState(initialDepot?.name ?? onboarding?.pointName ?? "")
  const [district, setDistrict] = useState(initialDepot?.district ?? onboarding?.district ?? "")
  const [address, setAddress] = useState(initialDepot?.address ?? onboarding?.address ?? "")
  const [phone, setPhone] = useState(initialDepot?.phone ?? onboarding?.phone ?? "")
  const [latitude, setLatitude] = useState(initialDepot?.latitude ?? "")
  const [longitude, setLongitude] = useState(initialDepot?.longitude ?? "")
  const [brands, setBrands] = useState<string[]>(
    initialDepot?.brands ?? onboarding?.brands ?? []
  )
  const [formats, setFormats] = useState<string[]>(initialDepot?.formats ?? [])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  // Les props serveur restent la source de vérité après router.refresh().
  // La resynchronisation a lieu pendant le rendu, sans setState dans un effet.
  const [syncedSource, setSyncedSource] = useState({
    depot: initialDepot,
    onboarding,
  })
  if (syncedSource.depot !== initialDepot || syncedSource.onboarding !== onboarding) {
    setSyncedSource({ depot: initialDepot, onboarding })
    setDepot(initialDepot)
    setName(initialDepot?.name ?? onboarding?.pointName ?? "")
    setDistrict(initialDepot?.district ?? onboarding?.district ?? "")
    setAddress(initialDepot?.address ?? onboarding?.address ?? "")
    setPhone(initialDepot?.phone ?? onboarding?.phone ?? "")
    setLatitude(initialDepot?.latitude ?? "")
    setLongitude(initialDepot?.longitude ?? "")
    setBrands(initialDepot?.brands ?? onboarding?.brands ?? [])
    setFormats(initialDepot?.formats ?? [])
  }

  const useCurrentPosition = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur cet appareil.")
      return
    }
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6))
        setLongitude(position.coords.longitude.toFixed(6))
        setLocating(false)
        toast.success("Position du dépôt renseignée")
      },
      () => {
        setError("Impossible d'obtenir votre position. Vérifiez les autorisations du navigateur.")
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!name.trim() || !district.trim() || !address.trim()) {
      setError("Le nom, le quartier et l'adresse sont obligatoires.")
      return
    }
    if (brands.length === 0 || formats.length === 0) {
      setError("Sélectionnez au moins une marque et un grammage.")
      return
    }
    if (
      (latitude.trim() && !longitude.trim()) ||
      (!latitude.trim() && longitude.trim())
    ) {
      setError("Renseignez la latitude et la longitude, ou laissez les deux vides.")
      return
    }

    setSaving(true)
    try {
      const body = {
        name: name.trim(),
        district: district.trim(),
        address: address.trim(),
        phone: phone.trim() || null,
        latitude: latitude.trim() || null,
        longitude: longitude.trim() || null,
        brands,
        formats,
      }

      const response = await fetch(
        depot ? `/api/depot/${depot.id}` : "/api/depot/create",
        {
          method: depot ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )
      const payload = (await response.json().catch(() => null)) as {
        point?: unknown
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Impossible d'enregistrer le dépôt")
      }

      const saved = toPayload(payload?.point)
      if (saved) setDepot(saved)
      toast.success(depot ? "Dépôt mis à jour" : "Dépôt créé avec succès")
      router.refresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Une erreur est survenue lors de l'enregistrement."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <VendorPageHeader
        title="Mes points de vente"
        description={
          depot
            ? "Modifiez les informations, la localisation et le catalogue de votre dépôt."
            : "Créez votre unique point de vente GazPoints."
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/dashboard/vendeur">Retour</Link>}
            />
            {depot && (
              <Button
                size="sm"
                render={
                  <Link href="/dashboard/depot/disponibilites">
                    <Package className="size-4" aria-hidden />
                    Disponibilités
                  </Link>
                }
              />
            )}
          </>
        }
      />

      {depot && (
        <VendorNotice>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-medium text-foreground">{depot.name}</span>
            <VendorStatusBadge
              status={depot.isActive ? "disponible" : "indisponible"}
              label={depot.isActive ? "Actif" : "Inactif"}
            />
            <span className="text-muted-foreground">
              Dernière mise à jour : {formatDateTime(depot.updatedAt)}
            </span>
          </div>
        </VendorNotice>
      )}

      {error && (
        <VendorErrorState
          message={error}
          onRetry={() => formRef.current?.requestSubmit()}
        />
      )}

      <VendorSectionCard
        title={depot ? "Informations du dépôt" : "Créer mon dépôt"}
        description={
          depot
            ? "Les modifications sont enregistrées immédiatement."
            : "Les informations de votre inscription sont préremplies."
        }
      >
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="depot-name">Nom du dépôt</Label>
              <Input
                id="depot-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex: Point Gaz Bonamoussadi"
                maxLength={100}
                disabled={saving}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="depot-district">Quartier / Ville</Label>
              <Input
                id="depot-district"
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                placeholder="Ex: Bonamoussadi"
                maxLength={100}
                disabled={saving}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="depot-address">Adresse précise</Label>
            <Textarea
              id="depot-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Ex: Rond-point Bonamoussadi, face à la station"
              maxLength={200}
              rows={2}
              disabled={saving}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="depot-phone">Téléphone du dépôt</Label>
              <Input
                id="depot-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Ex: +237 6 99 00 00 00"
                maxLength={30}
                disabled={saving}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={useCurrentPosition}
              disabled={saving || locating}
              className="sm:mb-0"
            >
              <LocateFixed className="size-4" aria-hidden />
              {locating ? "Localisation…" : "Utiliser ma position"}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="depot-latitude">Latitude</Label>
              <Input
                id="depot-latitude"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                placeholder="Ex: 4.0511"
                inputMode="decimal"
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="depot-longitude">Longitude</Label>
              <Input
                id="depot-longitude"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                placeholder="Ex: 9.7679"
                inputMode="decimal"
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <BrandListInput
              values={brands}
              onChange={setBrands}
              disabled={saving}
            />
            <FormatListInput
              values={formats}
              onChange={setFormats}
              disabled={saving}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden />
              La localisation permet aux clients de trouver votre dépôt.
            </p>
            <div className="flex gap-2">
              {depot && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  render={
                    <Link href="/dashboard/depot/services">
                      <Truck className="size-4" aria-hidden />
                      Gérer les services
                    </Link>
                  }
                />
              )}
              <Button type="submit" size="sm" disabled={saving}>
                <Save className="size-4" aria-hidden />
                {saving
                  ? "Enregistrement…"
                  : depot
                    ? "Enregistrer les modifications"
                    : "Créer le dépôt"}
              </Button>
            </div>
          </div>
        </form>
      </VendorSectionCard>

      {depot && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "Livraison",
              active: depot.deliveryEnabled,
              icon: Truck,
            },
            {
              label: "Échange",
              active: depot.exchangeEnabled,
              icon: Store,
            },
            {
              label: "Vente de gaz",
              active: depot.gasSaleEnabled,
              icon: Package,
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="size-4" aria-hidden />
                  {item.label}
                </span>
                <VendorStatusBadge
                  status={item.active ? "disponible" : "indisponible"}
                  label={item.active ? "Activé" : "Désactivé"}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
