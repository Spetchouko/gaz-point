"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ModernCard } from "@/app/_components/card-modern"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { BrandListInput } from "@/app/_components/brand-list-input"
import Link from "next/link"
import { PageLoading } from "@/app/_components/spinner"
import {
  Mail,
  Lock,
  Store,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  MapPin,
  LocateFixed,
} from "lucide-react"
import Image from "next/image"
import { validateVendorSignupPayload } from "@/lib/vendor-signup-validation"

// === Mode de confirmation email ===
const MODE_EMAIL = "email"

type FieldKey = "pointName" | "email" | "password" | "district" | "address" | "brands"

function InscriptionVendeurContent() {
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const searchRedirect = useSearchParams().get("redirect")
  const redirectTo = searchRedirect ?? "/dashboard/vendeur"

  useEffect(() => {
    if (session?.user) {
      router.push(redirectTo)
    }
  }, [session, router, redirectTo])

  // ---------- État du formulaire (création de compte + point de vente) ----------
  const [pointName, setPointName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [district, setDistrict] = useState("")
  const [address, setAddress] = useState("")
  const [brands, setBrands] = useState<string[]>(["", "", "", "", ""])

  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const clearFieldError = (field: FieldKey) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setError("")

    // Mêmes règles que le serveur (lib/vendor-onboarding) : le message
    // affiché est identique à celui renvoyé par l'API.
    const validation = validateVendorSignupPayload({
      name: pointName,
      email,
      password,
      district,
      address,
      brands,
    })

    if (!validation.ok) {
      if (validation.field) {
        setFieldErrors({ [validation.field]: validation.message } as Partial<Record<FieldKey, string>>)
      }
      setError(validation.message)
      return
    }

    setFieldErrors({})
    setLoading(true)

    const data = validation.data

    try {
      const res = await fetch("/api/vendor/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          district: data.district,
          address: data.address,
          brands: data.brands,
        }),
      })

      const payload = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: { message?: string; field?: string } }
        | null

      if (!res.ok || !payload?.ok) {
        const message =
          payload?.error?.message ?? "Impossible de créer le compte vendeur."
        const field = payload?.error?.field as FieldKey | undefined
        if (field) {
          setFieldErrors({ [field]: message })
        }
        setError(message)
        setLoading(false)
        return
      }
    } catch (err) {
      console.error("[signup-vendeur] erreur réseau:", err)
      setError("Une erreur réseau est survenue. Veuillez réessayer.")
      setLoading(false)
      return
    }

    // === Envoi du code de vérification (comportement OTP inchangé) ===
    // Le brouillon du point de vente est déjà enregistré côté serveur : il n'est
    // jamais perdu, même si l'envoi échoue ou si la page est rechargée.
    try {
      const res = await fetch("/api/auth/email-otp/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, resend: false }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        console.error(
          "[signup-vendeur] envoi du code échoué:",
          body?.error?.message ?? res.statusText
        )
        setError(
          body?.error?.message ??
            "L'envoi du code de vérification a échoué. Veuillez réessayer."
        )
        setLoading(false)
        return
      }
    } catch (sendErr) {
      console.error("[signup-vendeur] envoi du code échoué (exception):", sendErr)
      setError("L'envoi du code de vérification a échoué. Veuillez réessayer.")
      setLoading(false)
      return
    }

    router.push(
      `/validation-email?mode=${MODE_EMAIL}&email=${encodeURIComponent(
        data.email
      )}&redirect=${encodeURIComponent("/dashboard/vendeur")}&sent=1`
    )
    router.refresh()
  }

  const handleGoogle = async () => {
    document.cookie = `gazpoint_register_role=vendor; path=/; max-age=300`
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard/vendeur",
    })
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* ---------- Retour en arrière ---------- */}
        <div className="mb-6">
          <Button
            render={<Link href="/inscription" />}
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="justify-start gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Retour
          </Button>
        </div>

        <ModernCard className="shadow-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-success/10 text-success ring-1 ring-success/20">
              <Store className="size-6" />
            </div>
            <CardTitle className="text-xl font-bold">
              Créer un compte vendeur
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Renseignez votre point de vente pour commencer
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Nom du point de vente</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="businessName"
                    type="text"
                    autoComplete="organization"
                    placeholder="Ex: Point Gaz Bonamoussadi"
                    value={pointName}
                    onChange={(e) => {
                      setPointName(e.target.value)
                      clearFieldError("pointName")
                    }}
                    onBlur={() => setSubmitted(true)}
                    required
                    disabled={loading}
                    className="pl-9"
                    aria-invalid={submitted && !!fieldErrors.pointName}
                    aria-describedby={
                      submitted && fieldErrors.pointName ? "pointName-error" : undefined
                    }
                  />
                </div>
                {submitted && fieldErrors.pointName && (
                  <p id="pointName-error" className="text-sm text-destructive" role="alert">
                    {fieldErrors.pointName}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="district">Quartier</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="district"
                      type="text"
                      autoComplete="address-level3"
                      placeholder="Ex: Bonamoussadi"
                      value={district}
                      onChange={(e) => {
                        setDistrict(e.target.value)
                        clearFieldError("district")
                      }}
                      onBlur={() => setSubmitted(true)}
                      required
                      disabled={loading}
                      className="pl-9"
                      aria-invalid={submitted && !!fieldErrors.district}
                      aria-describedby={
                        submitted && fieldErrors.district ? "district-error" : undefined
                      }
                    />
                  </div>
                  {submitted && fieldErrors.district && (
                    <p id="district-error" className="text-sm text-destructive" role="alert">
                      {fieldErrors.district}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        clearFieldError("email")
                      }}
                      onBlur={() => setSubmitted(true)}
                      required
                      disabled={loading}
                      className="pl-9"
                      aria-invalid={submitted && !!fieldErrors.email}
                      aria-describedby={
                        submitted && fieldErrors.email ? "email-error" : undefined
                      }
                    />
                  </div>
                  {submitted && fieldErrors.email && (
                    <p id="email-error" className="text-sm text-destructive" role="alert">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse (rue et repères)</Label>
                <div className="relative">
                  <LocateFixed className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Textarea
                    id="address"
                    autoComplete="street-address"
                    placeholder="Ex: Rue principale, en face de la pharmacie du carrefour"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value)
                      clearFieldError("address")
                    }}
                    onBlur={() => setSubmitted(true)}
                    rows={2}
                    required
                    disabled={loading}
                    className="pl-9"
                    aria-invalid={submitted && !!fieldErrors.address}
                    aria-describedby={
                      submitted && fieldErrors.address ? "address-error" : undefined
                    }
                  />
                </div>
                {submitted && fieldErrors.address && (
                  <p id="address-error" className="text-sm text-destructive" role="alert">
                    {fieldErrors.address}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="6 caractères minimum"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      clearFieldError("password")
                    }}
                    onBlur={() => setSubmitted(true)}
                    required
                    minLength={6}
                    className="pl-9 pr-10"
                    disabled={loading}
                    aria-invalid={submitted && !!fieldErrors.password}
                    aria-describedby={
                      submitted && fieldErrors.password ? "password-error" : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={loading}
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {submitted && fieldErrors.password && (
                  <p id="password-error" className="text-sm text-destructive" role="alert">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <BrandListInput
                values={brands}
                onChange={(next) => {
                  setBrands(next)
                  clearFieldError("brands")
                }}
                disabled={loading}
                error={submitted ? fieldErrors.brands : undefined}
              />

              {error && (
                <div
                  className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2"
                  role="alert"
                >
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="mt-6 space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-wider">
                    <span className="bg-background px-2 text-muted-foreground">
                      Ou continuer avec
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full gap-2 h-11"
                  onClick={handleGoogle}
                  disabled={loading}
                >
                  <Image
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    width={16}
                    height={16}
                    className="size-4"
                  />
                  Continuer avec Google
                </Button>
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? "Création en cours..." : "Créer un compte vendeur"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Votre point de vente sera créé après la vérification de votre
                email.
              </p>
            </form>
          </CardContent>
        </ModernCard>
      </div>
    </div>
  )
}

export default function InscriptionVendeurPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <InscriptionVendeurContent />
    </Suspense>
  )
}
