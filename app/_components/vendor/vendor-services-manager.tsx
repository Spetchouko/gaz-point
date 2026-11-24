"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bike,
  Mail,
  MapPin,
  Package,
  Phone,
  RotateCcw,
  Save,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { BrandListInput } from "@/app/_components/brand-list-input"
import { FormatListInput } from "@/app/_components/format-list-input"
import {
  VendorEmptyState,
  VendorErrorState,
  VendorNotice,
  VendorPageHeader,
  VendorSectionCard,
} from "@/app/_components/vendor/vendor-ui"
import { requestJson } from "@/lib/client-request"
import { formatPrice } from "@/lib/gaz"
import type { VendorDepotDto } from "@/lib/vendor-dashboard"

export function VendorServicesManager({ depot }: { depot: VendorDepotDto | null }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement | null>(null)
  const [deliveryEnabled, setDeliveryEnabled] = useState(depot?.deliveryEnabled ?? false)
  const [deliveryFee, setDeliveryFee] = useState(String(depot?.deliveryFee ?? 0))
  const [exchangeEnabled, setExchangeEnabled] = useState(depot?.exchangeEnabled ?? false)
  const [exchangeFee, setExchangeFee] = useState(depot?.exchangeFee != null ? String(depot.exchangeFee) : "")
  const [gasSaleEnabled, setGasSaleEnabled] = useState(depot?.gasSaleEnabled ?? false)
  const [gasSaleFee, setGasSaleFee] = useState(depot?.gasSaleFee != null ? String(depot.gasSaleFee) : "")
  const [exchangeBrands, setExchangeBrands] = useState<string[]>(depot?.exchangeBrands ?? [])
  const [exchangeFormats, setExchangeFormats] = useState<string[]>(depot?.exchangeFormats ?? [])
  const [gasSaleBrands, setGasSaleBrands] = useState<string[]>(depot?.gasSaleBrands ?? [])
  const [gasSaleFormats, setGasSaleFormats] = useState<string[]>(depot?.gasSaleFormats ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Les services enregistrés restent la source de vérité après un refresh du
  // routeur. On resynchronise pendant le rendu, pas dans un effet.
  const [syncedDepot, setSyncedDepot] = useState(depot)
  if (syncedDepot !== depot) {
    setSyncedDepot(depot)
    setDeliveryEnabled(depot?.deliveryEnabled ?? false)
    setDeliveryFee(String(depot?.deliveryFee ?? 0))
    setExchangeEnabled(depot?.exchangeEnabled ?? false)
    setExchangeFee(depot?.exchangeFee != null ? String(depot.exchangeFee) : "")
    setGasSaleEnabled(depot?.gasSaleEnabled ?? false)
    setGasSaleFee(depot?.gasSaleFee != null ? String(depot.gasSaleFee) : "")
    setExchangeBrands(depot?.exchangeBrands ?? [])
    setExchangeFormats(depot?.exchangeFormats ?? [])
    setGasSaleBrands(depot?.gasSaleBrands ?? [])
    setGasSaleFormats(depot?.gasSaleFormats ?? [])
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!depot) return
    setError(null)

    const fee = Number(deliveryFee)
    if (!Number.isInteger(fee) || fee < 0) {
      setError("Les frais de livraison doivent être un montant entier positif.")
      return
    }
    const parsedExchangeFee = exchangeFee.trim() === "" ? null : Number(exchangeFee)
    if (exchangeEnabled && parsedExchangeFee !== null && (!Number.isInteger(parsedExchangeFee) || parsedExchangeFee < 0)) {
      setError("Le prix du service d'échange doit être un nombre entier valide.")
      return
    }
    const parsedGasSaleFee = gasSaleFee.trim() === "" ? null : Number(gasSaleFee)
    if (gasSaleEnabled && parsedGasSaleFee !== null && (!Number.isInteger(parsedGasSaleFee) || parsedGasSaleFee < 0)) {
      setError("Le prix du service de vente de gaz doit être un nombre entier valide.")
      return
    }

    void (async () => {
      setSaving(true)
      try {
        await requestJson(`/api/depot/${depot.id}/services`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliveryEnabled,
            deliveryFee: fee,
            exchangeEnabled,
            exchangeFee: exchangeEnabled ? parsedExchangeFee : null,
            gasSaleEnabled,
            gasSaleFee: gasSaleEnabled ? parsedGasSaleFee : null,
            exchangeBrands,
            exchangeFormats,
            gasSaleBrands,
            gasSaleFormats,
          }),
        })
        toast.success("Services mis à jour")
        router.refresh()
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Impossible d'enregistrer les services. Réessayez."
        )
      } finally {
        setSaving(false)
      }
    })()
  }

  if (!depot) {
    return (
      <div className="space-y-4">
        <VendorPageHeader
          title="Mes services"
          description="Configurez les services proposés par votre point de vente."
        />
        <VendorSectionCard title="Aucun dépôt configuré">
          <VendorEmptyState
            icon={Package}
            title="Services indisponibles"
            description="Créez d'abord votre point de vente pour activer vos services."
            actions={
              <Button
                size="sm"
                render={<Link prefetch={false} href="/dashboard/depot">Créer mon dépôt</Link>}
              />
            }
          />
        </VendorSectionCard>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <VendorPageHeader
        title="Mes services"
        description={`Services proposés par ${depot.name}`}
        actions={
          <Button
            variant="outline"
            size="sm"
            render={<Link prefetch={false} href="/dashboard/depot">Modifier le dépôt</Link>}
          />
        }
      />

      <VendorNotice>
        La livraison et le service coursier utilisent la même configuration. Les
        prix sont confirmés avec le client au moment de la commande.
      </VendorNotice>

      {error && (
        <VendorErrorState
          message={error}
          onRetry={() => formRef.current?.requestSubmit()}
        />
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <VendorSectionCard
          title="Livraison et coursier"
          description="Proposez la livraison de bouteilles à domicile."
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bike className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Activer la livraison / coursier
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Le service apparaîtra sur votre fiche publique.
                  </p>
                </div>
              </div>
              <Switch
                checked={deliveryEnabled}
                onCheckedChange={setDeliveryEnabled}
                disabled={saving}
                aria-label="Activer la livraison"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-[220px_1fr] sm:items-center">
              <div className="space-y-1.5">
                <Label htmlFor="delivery-fee">Frais de livraison (FCFA)</Label>
                <Input
                  id="delivery-fee"
                  type="number"
                  min={0}
                  step={1}
                  value={deliveryFee}
                  onChange={(event) => setDeliveryFee(event.target.value)}
                  disabled={saving || !deliveryEnabled}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Montant indicatif actuel : {formatPrice(depot.deliveryFee)}. Il
                peut être ajusté avec chaque client.
              </p>
            </div>
          </div>
        </VendorSectionCard>

        <VendorSectionCard
          title="Échange de bouteilles"
          description="Marques et grammages acceptés en échange."
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <RotateCcw className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Activer l&apos;échange
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Permet au client qui ne trouve pas sa marque habituelle de bouteille de gaz chargée de choisir une autre marque de bouteille chargée proposée par le dépôt.
                  </p>
                </div>
              </div>
              <Switch
                checked={exchangeEnabled}
                onCheckedChange={setExchangeEnabled}
                disabled={saving}
                aria-label="Activer l'échange"
              />
            </div>
            {exchangeEnabled && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[220px_1fr] sm:items-center">
                  <div className="space-y-1.5">
                    <Label htmlFor="exchange-fee">Prix du service d&apos;échange (FCFA)</Label>
                    <Input
                      id="exchange-fee"
                      type="number"
                      min={0}
                      step={1}
                      value={exchangeFee}
                      onChange={(event) => setExchangeFee(event.target.value)}
                      disabled={saving}
                      placeholder="Ex: 500"
                    />
                  </div>
                </div>
                <div className="grid gap-5 xl:grid-cols-2">
                  <BrandListInput
                    values={exchangeBrands}
                    onChange={setExchangeBrands}
                    disabled={saving}
                    label="Marques acceptées"
                  />
                  <FormatListInput
                    values={exchangeFormats}
                    onChange={setExchangeFormats}
                    disabled={saving}
                    label="Grammages acceptés"
                  />
                </div>
              </div>
            )}
          </div>
        </VendorSectionCard>

        <VendorSectionCard
          title="Vente de gaz / Achat complet d'une bouteille"
          description="Permet au client d'acheter une bouteille de gaz déjà chargée lorsqu'il ne possède pas de bouteille ou ne dispose pas de bouteille à échanger."
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Package className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Activer la vente de bouteilles avec gaz
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vente de bouteilles déjà chargées, sans bouteille à échanger.
                  </p>
                </div>
              </div>
              <Switch
                checked={gasSaleEnabled}
                onCheckedChange={setGasSaleEnabled}
                disabled={saving}
                aria-label="Activer la vente de gaz"
              />
            </div>
            {gasSaleEnabled && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[220px_1fr] sm:items-center">
                  <div className="space-y-1.5">
                    <Label htmlFor="gas-sale-fee">Prix du service (FCFA)</Label>
                    <Input
                      id="gas-sale-fee"
                      type="number"
                      min={0}
                      step={1}
                      value={gasSaleFee}
                      onChange={(event) => setGasSaleFee(event.target.value)}
                      disabled={saving}
                      placeholder="Ex: 5000"
                    />
                  </div>
                </div>
                <div className="grid gap-5 xl:grid-cols-2">
                  <BrandListInput
                    values={gasSaleBrands}
                    onChange={setGasSaleBrands}
                    disabled={saving}
                    label="Marques vendues"
                  />
                  <FormatListInput
                    values={gasSaleFormats}
                    onChange={setGasSaleFormats}
                    disabled={saving}
                    label="Formats vendus"
                  />
                </div>
              </div>
            )}
          </div>
        </VendorSectionCard>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
          <p className="text-xs text-muted-foreground">
            Enregistrez pour rendre les services visibles sur votre fiche publique.
          </p>
          <Button type="submit" size="sm" disabled={saving}>
            <Save className="size-4" aria-hidden />
            {saving ? "Enregistrement…" : "Enregistrer les services"}
          </Button>
        </div>
      </form>

      <VendorSectionCard
        title="Contact du dépôt"
        description="Ces informations sont affichées aux clients."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-2 rounded-lg border border-border p-3">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Adresse</p>
              <p className="truncate text-sm text-foreground">{depot.address}</p>
              <p className="text-xs text-muted-foreground">{depot.district}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-border p-3">
            <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Téléphone</p>
              <p className="truncate text-sm text-foreground">{depot.phone ?? "Non renseigné"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-border p-3">
            <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Dépôt</p>
              <p className="truncate text-sm text-foreground">{depot.name}</p>
            </div>
          </div>
        </div>
      </VendorSectionCard>
    </div>
  )
}
