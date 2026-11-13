"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, Plus, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"

const DEFAULT_FORMATS = ["6 kg", "12,5 kg", "15 kg"] as const

type BrandOption = { value: string; label: string }

const BRAND_OPTIONS: BrandOption[] = [
  { value: "Total", label: "Total" },
  { value: "Tradex", label: "Tradex" },
  { value: "Bocom", label: "Bocom" },
  { value: "SCTM", label: "SCTM" },
  { value: "Gaz du Cameroun", label: "Gaz du Cameroun" },
]

export default function DepotPage() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const user = session?.user

  const [name, setName] = useState("")
  const [district, setDistrict] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedFormats, setSelectedFormats] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [hasDepot, setHasDepot] = useState(false)

  useEffect(() => {
    if (success) {
      router.push("/dashboard/vendeur")
      router.refresh()
    }
  }, [success, router])

  useEffect(() => {
    let cancelled = false
    async function checkDepot() {
      try {
        const res = await fetch("/api/depot/mine", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled && data.point) {
            setHasDepot(true)
          }
        }
      } catch {
        // ignore
      }
    }
    checkDepot()
    return () => { cancelled = true }
  }, [])

  if (hasDepot) {
    return (
      <Card className="border border-border rounded-xl shadow-sm">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="size-6 text-success mx-auto mb-3" />
          <CardTitle>Un dépôt est déjà configuré</CardTitle>
          <CardDescription>
            Votre point de dépôt existe déjà. Vous pouvez gérer ses disponibilités
            et ses services depuis le tableau de bord vendeur.
          </CardDescription>
          <CardFooter className="pt-6">
            <Button asChild className="w-full">
              <Link href="/dashboard/vendeur">
                <Plus className="size-4 mr-2" /> Aller au tableau de bord
              </Link>
            </Button>
          </CardFooter>
        </CardContent>
      </Card>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/depot/create", {
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

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création du dépôt")
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      setLoading(false)
    }
  }

  const toggleBrand = (value: string) => {
    setSelectedBrands((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  const toggleFormat = (value: string) => {
    setSelectedFormats((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  const isFormValid = Boolean(
    name.trim() && district.trim() && address.trim() && selectedBrands.length > 0 && selectedFormats.length > 0
  )

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Créer votre dépôt</h1>
        <Link href="/dashboard/vendeur">
          <Button variant="outline">
            <Save className="size-4 mr-2" /> Annuler
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Informations du point de dépôt</CardTitle>
          <CardDescription>
            Renseignez les informations de votre dépôt pour que les clients puissent
            vous trouver.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="depot-name">Nom du dépôt</Label>
                <Input
                  id="depot-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Total Bonamoussadi"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depot-district">Quartier / Ville</Label>
                <Input
                  id="depot-district"
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Ex: Bonamoussadi"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="depot-address">Adresse précise</Label>
              <Input
                id="depot-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Rond-point Bonamoussadi, face à la station"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depot-phone">Téléphone du dépôt</Label>
              <Input
                id="depot-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: +237 6 99 00 00 00"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-foreground">
                  Marques commercialisées
                </Label>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
                {BRAND_OPTIONS.map((brand) => (
                  <button
                    key={brand.value}
                    type="button"
                    onClick={() => toggleBrand(brand.value)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-sm font-medium transition-colors",
                      selectedBrands.includes(brand.value)
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-input bg-background text-foreground hover:border-primary/50"
                    )}
                  >
                    <span className="text-[10px] uppercase tracking-wider opacity-70">
                      {brand.label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Sélectionnez au moins une marque
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-foreground">
                  Formats de bouteilles
                </Label>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {DEFAULT_FORMATS.map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => toggleFormat(format)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-sm font-medium transition-colors",
                      selectedFormats.includes(format)
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-input bg-background text-foreground hover:border-primary/50"
                    )}
                  >
                    <span className="text-[10px] uppercase tracking-wider opacity-70">
                      {format}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Sélectionnez au moins un format
              </p>
            </div>

            <CardFooter>
              <Button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full h-12 text-lg font-semibold shadow-sm shadow-primary/20 transition hover:shadow-primary/40"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Save className="size-4 animate-spin" />
                    Enregistrement…
                  </span>
                ) : (
                  <span>
                    Créer le dépôt
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
