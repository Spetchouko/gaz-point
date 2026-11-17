"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2, Loader2, Save, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BrandListInput } from "@/app/_components/brand-list-input"
import { FormatListInput } from "@/app/_components/format-list-input"
import { VendorAvailabilityForm } from "@/app/_components/vendor-availability-form"

interface Depot {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  brands: string[]
  formats: string[]
}

interface Onboarding {
  pointName: string
  district: string
  address: string
  phone: string | null
  brands: string[]
}

export function VendorDepotForm() {
  const [point, setPoint] = useState<Depot | null>(null)
  const [name, setName] = useState("")
  const [district, setDistrict] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedFormats, setSelectedFormats] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [depotResponse, onboardingResponse] = await Promise.all([
          fetch("/api/depot/mine", {
            headers: { Accept: "application/json" },
            cache: "no-store",
          }),
          fetch("/api/vendor/onboarding", {
            headers: { Accept: "application/json" },
            cache: "no-store",
          }),
        ])

        if (depotResponse.ok) {
          const payload = (await depotResponse.json()) as { point?: Depot | null }
          if (!cancelled && payload.point) {
            setPoint(payload.point)
          }
        }

        if (onboardingResponse.ok) {
          const payload = (await onboardingResponse.json()) as {
            onboarding?: Onboarding | null
          }
          if (!cancelled && payload.onboarding) {
            setName(payload.onboarding.pointName)
            setDistrict(payload.onboarding.district)
            setAddress(payload.onboarding.address)
            setPhone(payload.onboarding.phone ?? "")
            setSelectedBrands(payload.onboarding.brands ?? [])
          }
        }
      } catch {
        if (!cancelled) {
          setError("Impossible de charger les informations de votre dépôt.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!name.trim() || !district.trim() || !address.trim()) {
      setError("Le nom, le quartier et l'adresse sont obligatoires.")
      return
    }
    if (selectedBrands.length === 0 || selectedFormats.length === 0) {
      setError("Sélectionnez au moins une marque et un grammage.")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/depot/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          district,
          address,
          phone,
          brands: selectedBrands,
          formats: selectedFormats,
        }),
      })
      const payload = (await response.json().catch(() => null)) as {
        point?: Depot
        error?: string | { message?: string }
      } | null

      if (!response.ok || !payload?.point) {
        const message =
          typeof payload?.error === "string"
            ? payload.error
            : payload?.error?.message
        throw new Error(message ?? "Erreur lors de la création du dépôt")
      }

      setPoint(payload.point)
      setCreated(true)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Une erreur est survenue"
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" aria-label="Chargement" />
      </div>
    )
  }

  if (point && !created) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <Card className="border-success/30 shadow-sm">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 size-7 text-success" />
            <CardTitle>Votre dépôt est déjà configuré</CardTitle>
            <CardDescription className="mt-2">
              Vous pouvez gérer vos disponibilités et vos services depuis votre
              espace vendeur.
            </CardDescription>
            <CardFooter className="justify-center pt-6">
              <Button
                render={
                  <Link href="/dashboard/vendeur">Ouvrir mon tableau de bord</Link>
                }
              />
            </CardFooter>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (created && point) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="border-success/30 shadow-sm">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 size-8 text-success" />
            <CardTitle>Point de dépôt créé avec succès</CardTitle>
            <CardDescription className="mt-2">
              {point.name} est maintenant associé à votre compte vendeur.
            </CardDescription>
            <CardFooter className="justify-center gap-3 pt-6">
              <Button
                variant="outline"
                render={
                  <Link href="/dashboard/vendeur">Aller au tableau de bord</Link>
                }
              />
              <Button
                render={
                  <Link href="/dashboard/depot/disponibilites">
                    Gérer mes disponibilités
                  </Link>
                }
              />
            </CardFooter>
          </CardContent>
        </Card>

        <VendorAvailabilityForm
          pointId={point.id}
          brands={point.brands ?? []}
          formats={point.formats ?? []}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Créer votre dépôt</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Les informations de votre inscription sont déjà préremplies.
          </p>
        </div>
        <Button
          variant="outline"
          render={<Link href="/dashboard/vendeur">Annuler</Link>}
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Store className="size-5" aria-hidden />
          </div>
          <CardTitle>Informations du point de dépôt</CardTitle>
          <CardDescription>
            Vérifiez les informations préremplies, complétez les champs manquants
            puis enregistrez votre dépôt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
              >
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="depot-name">Nom du dépôt</Label>
                <Input
                  id="depot-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex: Point Gaz Bonamoussadi"
                  required
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depot-district">Quartier / Ville</Label>
                <Input
                  id="depot-district"
                  type="text"
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                  placeholder="Ex: Bonamoussadi"
                  required
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="depot-address">Adresse précise</Label>
              <Textarea
                id="depot-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Ex: Rond-point Bonamoussadi, face à la station"
                required
                rows={3}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="depot-phone">Téléphone du dépôt</Label>
              <Input
                id="depot-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Ex: +237 6 99 00 00 00"
                disabled={saving}
              />
            </div>

            <BrandListInput
              values={selectedBrands}
              onChange={setSelectedBrands}
              disabled={saving}
            />

            <FormatListInput
              values={selectedFormats}
              onChange={setSelectedFormats}
              disabled={saving}
            />

            <CardFooter className="px-0">
              <Button
                type="submit"
                disabled={saving}
                className="h-12 w-full text-lg font-semibold"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Enregistrement…
                  </>
                ) : (
                  <>
                    <Save className="size-4" /> Créer le dépôt
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
