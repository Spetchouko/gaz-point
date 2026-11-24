"use client"

import { useCallback, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  LocateFixed,
  MapPin,
  Package,
  Save,
  Store,
  Truck,
  Plus,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { BrandListInput } from "@/app/_components/brand-list-input"
import { FormatListInput } from "@/app/_components/format-list-input"
import {
  VendorErrorState,
  VendorNotice,
  VendorPageHeader,
  VendorSectionCard,
  VendorStatusBadge,
} from "@/app/_components/vendor/vendor-ui"
import { requestJson } from "@/lib/client-request"
import { cn } from "@/lib/utils"
import type {
  VendorDepotDto,
  VendorOnboardingDto,
} from "@/lib/vendor-dashboard"

type DepotFormState = {
  name: string
  district: string
  address: string
  phone: string
  brands: string[]
  formats: string[]
  deliveryEnabled: boolean
  deliveryFee: string
  exchangeEnabled: boolean
  exchangeFee: string
  exchangeBrands: string[]
  exchangeFormats: string[]
  gasSaleEnabled: boolean
  gasSaleFee: string
  gasSaleBrands: string[]
  gasSaleFormats: string[]
}

// Étapes du formulaire multiétapes
const STEPS = [
  { id: 1, title: "Informations du dépôt", description: "Nom, localisation et contact" },
  { id: 2, title: "Marques et formats", description: "Sélectionnez les bouteilles proposées" },
  { id: 3, title: "Services proposés", description: "Livraison, échange et vente de gaz" },
  { id: 4, title: "Vérification", description: "Récapitulatif avant connexion" },
] as const

function initialFormState(depot: VendorDepotDto | null, onboarding: VendorOnboardingDto | null): DepotFormState {
  return {
    name: depot?.name ?? onboarding?.pointName ?? "",
    district: depot?.district ?? onboarding?.district ?? "",
    address: depot?.address ?? onboarding?.address ?? "",
    phone: depot?.phone ?? onboarding?.phone ?? "",
    brands: depot?.brands ?? onboarding?.brands ?? [],
    formats: depot?.formats ?? [],
    deliveryEnabled: depot?.deliveryEnabled ?? false,
    deliveryFee: depot?.deliveryFee?.toString() ?? "",
    exchangeEnabled: depot?.exchangeEnabled ?? false,
    exchangeFee: depot?.exchangeFee != null ? depot.exchangeFee.toString() : "",
    exchangeBrands: depot?.exchangeBrands ?? [],
    exchangeFormats: depot?.exchangeFormats ?? [],
    gasSaleEnabled: depot?.gasSaleEnabled ?? false,
    gasSaleFee: depot?.gasSaleFee != null ? depot.gasSaleFee.toString() : "",
    gasSaleBrands: depot?.gasSaleBrands ?? [],
    gasSaleFormats: depot?.gasSaleFormats ?? [],
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

  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState<DepotFormState>(() =>
    initialFormState(initialDepot, onboarding)
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  // Resync quand les props serveur changent (après router.refresh)
  const [syncedSource, setSyncedSource] = useState({
    depot: initialDepot,
    onboarding,
  })
  if (syncedSource.depot !== initialDepot || syncedSource.onboarding !== onboarding) {
    setSyncedSource({ depot: initialDepot, onboarding })
    setForm(initialFormState(initialDepot, onboarding))
    setCurrentStep(1)
    setError(null)
    setSuccess(null)
  }

  const isCreation = !initialDepot
  const depotId = initialDepot?.id

  // ---------- Validation par étape ----------
  // Fonction PURE : elle retourne le message d'erreur (ou null) sans jamais
  // appeler un setter. Elle est appelée pendant le rendu (barre de progression,
  // bouton « Continuer ») : un setError ici provoquerait une boucle de rendu
  // infinie (« Too many re-renders »).
  const validateStep = (step: number): string | null => {
    switch (step) {
      case 1:
        if (!form.name.trim()) return "Le nom du dépôt est obligatoire."
        if (!form.district.trim()) return "Le quartier ou la ville est obligatoire."
        if (!form.address.trim()) return "L'adresse complète est obligatoire."
        return null
      case 2:
        if (form.brands.length === 0) {
          return "Sélectionnez au moins une marque de bouteilles."
        }
        if (form.formats.length === 0) {
          return "Sélectionnez au moins un grammage de bouteilles."
        }
        return null
      case 3:
        if (form.deliveryEnabled && !form.deliveryFee.trim()) {
          return "Les frais de livraison sont obligatoires quand la livraison est activée."
        }
        if (form.deliveryEnabled && isNaN(Number(form.deliveryFee))) {
          return "Les frais de livraison doivent être un nombre valide."
        }
        if (form.exchangeEnabled && form.exchangeFee.trim() && (!Number.isInteger(Number(form.exchangeFee)) || Number(form.exchangeFee) < 0)) {
          return "Le prix du service d'échange doit être un nombre entier valide."
        }
        if (form.gasSaleEnabled && form.gasSaleFee.trim() && (!Number.isInteger(Number(form.gasSaleFee)) || Number(form.gasSaleFee) < 0)) {
          return "Le prix du service de vente de gaz doit être un nombre entier valide."
        }
        return null
      case 4:
        return null
      default:
        return null
    }
  }

  const canGoTo = (step: number): boolean => {
    // On ne peut accéder qu'à l'étape actuelle ou aux étapes précédentes déjà validées
    return step <= currentStep
  }

  const goToStep = (step: number) => {
    if (!canGoTo(step)) return
    setError(null)
    setSuccess(null)
    setCurrentStep(step)
  }

  const nextStep = () => {
    const stepError = validateStep(currentStep)
    if (stepError) {
      setError(stepError)
      return
    }
    setError(null)
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError(null)
      setSuccess(null)
    }
  }

  // ---------- Gestion de la géolocalisation (optionnelle, pas dans l'interface form) ----------
  const useCurrentPosition = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur cet appareil.")
      return
    }
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocating(false)
        toast.success("Position détectée (utilisée pour l'affichage sur la carte).")
      },
      () => {
        setLocating(false)
        setError("Impossible d'obtenir votre position. Vous pouvez continuer sans géolocalisation.")
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // ---------- Soumission ----------
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    const stepError = validateStep(4)
    if (stepError) {
      setError(stepError)
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const body = {
        name: form.name.trim(),
        district: form.district.trim(),
        address: form.address.trim(),
        phone: form.phone.trim() || null,
        brands: form.brands,
        formats: form.formats,
        deliveryEnabled: form.deliveryEnabled,
        deliveryFee: form.deliveryEnabled && form.deliveryFee.trim()
          ? Number(form.deliveryFee)
          : 0,
        exchangeEnabled: form.exchangeEnabled,
        exchangeFee: form.exchangeEnabled && form.exchangeFee.trim()
          ? Number(form.exchangeFee)
          : null,
        exchangeBrands: form.exchangeEnabled ? form.exchangeBrands : [],
        exchangeFormats: form.exchangeEnabled ? form.exchangeFormats : [],
        gasSaleEnabled: form.gasSaleEnabled,
        gasSaleFee: form.gasSaleEnabled && form.gasSaleFee.trim()
          ? Number(form.gasSaleFee)
          : null,
        gasSaleBrands: form.gasSaleEnabled ? form.gasSaleBrands : [],
        gasSaleFormats: form.gasSaleEnabled ? form.gasSaleFormats : [],
      }

      await requestJson(
        depotId ? `/api/depot/${depotId}` : "/api/depot/create",
        {
          method: depotId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )

      setSuccess(depotId ? "Dépôt mis à jour avec succès." : "Dépôt créé avec succès.")
      toast.success(depotId ? "Dépôt mis à jour" : "Dépôt créé avec succès")
      router.refresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Impossible d'enregistrer le dépôt. Réessayez."
      )
    } finally {
      setSaving(false)
    }
  }, [form, depotId, router, saving])

  const currentStepConfig = STEPS.find((s) => s.id === currentStep)!

  const isStepComplete = (stepId: number): boolean => {
    if (stepId < currentStep) return true
    if (stepId === currentStep) {
      try {
        return validateStep(stepId) === null
      } catch {
        return false
      }
    }
    return false
  }

  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100

  // ---------- Rendu ----------
  return (
    <div className="space-y-4">
      {/* Header */}
      <VendorPageHeader
        title={isCreation ? "Créer mon dépôt" : "Modifier mon dépôt"}
        description={
          isCreation
            ? "Configurez votre point de vente en 4 étapes simples."
            : "Modifiez les informations de votre dépôt GazPoints."
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/vendeur")}
              disabled={saving}
            >
              <ArrowLeft className="size-4 mr-2" aria-hidden />
              Retour
            </Button>
          </>
        }
      />

      {/* Barre de progression */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Progression de la configuration
          </span>
          <span className="text-xs font-medium text-foreground">
            Étape {currentStep} sur {STEPS.length}
          </span>
        </div>
        <div className="flex gap-2">
          {STEPS.map((step) => {
            const completed = isStepComplete(step.id)
            const active = step.id === currentStep
            return (
              <div
                key={step.id}
                className="flex-1 relative flex flex-col items-center"
              >
                {/* Ligne de connexion entre les étapes */}
                <div
                  className={cn(
                    "absolute -top-2 left-1/2 -right-1/2 h-1",
                    !active && step.id > 1 ? "hidden" : "",
                    completed || active ? "bg-primary" : "bg-border"
                  )}
                />
                {/* Cercle d'étape */}
                <div
                  className={cn(
                    "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                    completed
                      ? "bg-primary text-primary-foreground border-primary"
                      : active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border"
                  )}
                >
                  {completed ? (
                    <CheckCircle2 className="size-5" aria-hidden />
                  ) : (
                    <span className="text-xs font-medium">{step.id}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-1.5 text-xs font-medium text-center max-w-[80px]",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {step.title.split(" ")[0]}
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Erreur globale */}
      {error && (
        <VendorErrorState
          message={error}
          onRetry={() => formRef.current?.requestSubmit()}
        />
      )}

      {/* Succès */}
      {success && currentStep === STEPS.length && (
        <VendorNotice tone="success">
          {success}
        </VendorNotice>
      )}

      {/* Formulaire multiétapes */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {/* ÉTAPE 1 — Informations du dépôt */}
        {currentStep === 1 && (
          <VendorSectionCard
            title="Informations du dépôt"
            description="Nom, ville ou quartier, adresse complète et numéro de téléphone de votre point de vente."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="depot-name">Nom du dépôt</Label>
                <Input
                  id="depot-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Point Gaz Bonamoussadi"
                  maxLength={100}
                  disabled={saving}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depot-district">Quartier / Ville</Label>
                <Input
                  id="depot-district"
                  value={form.district}
                  onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value }))}
                  placeholder="Ex: Bonamoussadi"
                  maxLength={100}
                  disabled={saving}
                  required
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="depot-address">Adresse complète</Label>
              <Textarea
                id="depot-address"
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Ex: Rond-point Bonamoussadi, face à la station Total"
                maxLength={200}
                rows={2}
                disabled={saving}
                required
                className="h-24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depot-phone">Numéro de téléphone</Label>
              <Input
                id="depot-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Ex: +237 6 99 00 00 00"
                maxLength={30}
                disabled={saving}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Utilisé par les clients pour vous contacter directement.
              </p>
            </div>
          </VendorSectionCard>
        )}

        {/* ÉTAPE 2 — Marques et formats */}
        {currentStep === 2 && (
          <VendorSectionCard
            title="Marques et formats de bouteilles"
            description="Sélectionnez toutes les marques de gaz et les formats de bouteilles proposés dans votre dépôt."
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <BrandListInput
                values={form.brands}
                onChange={(values) => setForm((prev) => ({ ...prev, brands: values }))}
                disabled={saving}
                label="Marques de gaz"
                hint="Sélectionnez une ou plusieurs marques commercialisées au Cameroun."
              />
              <FormatListInput
                values={form.formats}
                onChange={(values) => setForm((prev) => ({ ...prev, formats: values }))}
                disabled={saving}
                label="Formats de bouteilles"
              />
            </div>
          </VendorSectionCard>
        )}

        {/* ÉTAPE 3 — Services proposés */}
        {currentStep === 3 && (
          <VendorSectionCard
            title="Services proposés"
            description="Activez ou désactivez les services offerts par votre dépôt. Certains services débloquent des options supplémentaires."
          >
            <div className="space-y-5">
              {/* Livraison */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Truck className="size-5" aria-hidden />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Livraison à domicile</p>
                      <p className="text-xs text-muted-foreground">
                        Proposez la livraison des bouteilles chez vos clients
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={form.deliveryEnabled}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, deliveryEnabled: checked }))
                    }
                    disabled={saving}
                  />
                </div>
                {form.deliveryEnabled && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="depot-delivery-fee">Frais de livraison (FCFA)</Label>
                        <Input
                          id="depot-delivery-fee"
                          type="number"
                          min={0}
                          value={form.deliveryFee}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, deliveryFee: e.target.value }))
                          }
                          placeholder="Ex: 1000"
                          disabled={saving}
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Échange */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                      <Package className="size-5" aria-hidden />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Échange de bouteilles</p>
                      <p className="text-xs text-muted-foreground">
                        Permet au client qui ne trouve pas sa marque habituelle de bouteille de gaz chargée de choisir une autre marque de bouteille chargée proposée par le dépôt.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={form.exchangeEnabled}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, exchangeEnabled: checked }))
                    }
                    disabled={saving}
                  />
                </div>
                {form.exchangeEnabled && (
                  <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="depot-exchange-fee">Prix du service d&apos;échange (FCFA)</Label>
                        <Input
                          id="depot-exchange-fee"
                          type="number"
                          min={0}
                          value={form.exchangeFee}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, exchangeFee: e.target.value }))
                          }
                          placeholder="Ex: 500"
                          disabled={saving}
                          className="h-11"
                        />
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Marques et formats acceptés pour l&apos;échange
                    </p>
                    <div className="grid gap-5 lg:grid-cols-2">
                      <BrandListInput
                        values={form.exchangeBrands}
                        onChange={(values) =>
                          setForm((prev) => ({ ...prev, exchangeBrands: values }))
                        }
                        disabled={saving}
                        label="Marques acceptées"
                        hint="Marques que vous acceptez en échange."
                        options={form.brands.length > 0 ? form.brands : undefined}
                      />
                      <FormatListInput
                        values={form.exchangeFormats}
                        onChange={(values) =>
                          setForm((prev) => ({ ...prev, exchangeFormats: values }))
                        }
                        disabled={saving}
                        label="Formats acceptés"
                        hint="Formats que vous acceptez en échange."
                        options={form.formats.length > 0 ? form.formats : undefined}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Vente de gaz */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                      <Plus className="size-5" aria-hidden />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Vente de gaz / Achat complet d&apos;une bouteille</p>
                      <p className="text-xs text-muted-foreground">
                        Permet au client d&apos;acheter une bouteille de gaz déjà chargée lorsqu&apos;il ne possède pas de bouteille ou ne dispose pas de bouteille à échanger.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={form.gasSaleEnabled}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, gasSaleEnabled: checked }))
                    }
                    disabled={saving}
                  />
                </div>
                {form.gasSaleEnabled && (
                  <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="depot-gas-sale-fee">Prix du service (FCFA)</Label>
                        <Input
                          id="depot-gas-sale-fee"
                          type="number"
                          min={0}
                          value={form.gasSaleFee}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, gasSaleFee: e.target.value }))
                          }
                          placeholder="Ex: 5000"
                          disabled={saving}
                          className="h-11"
                        />
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Marques et formats commercialisés
                    </p>
                    <div className="grid gap-5 lg:grid-cols-2">
                      <BrandListInput
                        values={form.gasSaleBrands}
                        onChange={(values) =>
                          setForm((prev) => ({ ...prev, gasSaleBrands: values }))
                        }
                        disabled={saving}
                        label="Marques vendues"
                        hint="Marques de gaz que vous commercialisez."
                        options={form.brands.length > 0 ? form.brands : undefined}
                      />
                      <FormatListInput
                        values={form.gasSaleFormats}
                        onChange={(values) =>
                          setForm((prev) => ({ ...prev, gasSaleFormats: values }))
                        }
                        disabled={saving}
                        label="Formats vendus"
                        hint="Formats de bouteilles de gaz."
                        options={form.formats.length > 0 ? form.formats : undefined}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </VendorSectionCard>
        )}

        {/* ÉTAPE 4 — Vérification */}
        {currentStep === 4 && (
          <VendorSectionCard
            title="Vérification avant connexion"
            description="Vérifiez les informations de votre dépôt avant de l'enregistrer définitivement."
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Nom du dépôt
                  </p>
                  <p className="text-sm text-foreground">{form.name || "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Quartier / Ville
                  </p>
                  <p className="text-sm text-foreground">{form.district || "—"}</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Adresse complète
                  </p>
                  <p className="text-sm text-foreground">{form.address || "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Téléphone
                  </p>
                  <p className="text-sm text-foreground">
                    {form.phone || "Non renseigné"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Marques sélectionnées
                </p>
                <div className="flex flex-wrap gap-2">
                  {form.brands.map((brand) => (
                    <span
                      key={brand}
                      className="rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium"
                    >
                      {brand}
                    </span>
                  ))}
                  {form.brands.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">
                      Aucune marque sélectionnée
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Formats sélectionnés
                </p>
                <div className="flex flex-wrap gap-2">
                  {form.formats.map((format) => (
                    <span
                      key={format}
                      className="rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium"
                    >
                      {format}
                    </span>
                  ))}
                  {form.formats.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">
                      Aucun format sélectionné
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[...[
                  { label: "Livraison", active: form.deliveryEnabled, icon: Truck },
                  { label: "Échange", active: form.exchangeEnabled, icon: Store },
                  { label: "Vente de gaz", active: form.gasSaleEnabled, icon: Package },
                ] as const].map((service) => {
                  const Icon = service.icon
                  return (
                    <div
                      key={service.label}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg",
                          service.active
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {service.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {service.active ? "Activé" : "Désactivé"}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {form.deliveryEnabled && form.deliveryFee.trim() && (
                <div className="flex items-center justify-between py-2 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">Frais de livraison</span>
                  <span className="text-sm font-medium text-foreground">
                    {form.deliveryFee} FCFA
                  </span>
                </div>
              )}
              {form.exchangeEnabled && form.exchangeFee.trim() && (
                <div className="flex items-center justify-between py-2 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">Prix du service d&apos;échange</span>
                  <span className="text-sm font-medium text-foreground">
                    {form.exchangeFee} FCFA
                  </span>
                </div>
              )}
              {form.gasSaleEnabled && form.gasSaleFee.trim() && (
                <div className="flex items-center justify-between py-2 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">Prix du service (achat complet)</span>
                  <span className="text-sm font-medium text-foreground">
                    {form.gasSaleFee} FCFA
                  </span>
                </div>
              )}
            </div>
          </VendorSectionCard>
        )}

        {/* Pied de formulaire — navigation et action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-5">
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={saving}
              >
                <ArrowLeft className="size-4 mr-2" aria-hidden />
                Précédent
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep < STEPS.length ? (
              <Button
                type="button"
                variant="default"
                onClick={nextStep}
                disabled={saving || validateStep(currentStep) !== null}
              >
                Continuer <ArrowRight className="size-4 ml-2" aria-hidden />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="default"
                size="lg"
                disabled={saving}
                className="flex-1 gap-2 h-11 text-lg font-extrabold tracking-tight shadow-xl shadow-primary/20 transition hover:shadow-2xl hover:scale-[1.01]"
              >
                <Save className="size-5" aria-hidden />
                {saving ? "Enregistrement…" : "Connecter le dépôt"}
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Aide contextuelle en bas */}
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground flex items-start gap-2">
          <MapPin className="size-3.5 shrink-0 mt-0.5" aria-hidden />
          <span>
            La localisation GPS de votre dépôt peut être ajoutée ultérieurement
            depuis la page de gestion des services.
          </span>
        </p>
      </div>
    </div>
  )
}
