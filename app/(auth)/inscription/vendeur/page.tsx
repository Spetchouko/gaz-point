"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Mail, Lock, Store, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

// === Mode de confirmation email ===
const MODE_EMAIL = "email"

/** Message d'erreur de l'adresse du dépôt (vide si valide). */
function getBusinessAddressError(address: string): string | null {
  return address.trim() ? null : "L'adresse du dépôt est requise."
}

function validateEmail(email: string): string | null {
  if (!email.trim()) return "L'email est requis."
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return "Format d'email invalide."

  const domain = email.split("@")[1]?.toLowerCase()
  if (
    domain &&
    [
      "10minutemail.com",
      "guerrillamail.com",
      "mailinator.com",
      "tempmail.com",
      "throwawaymail.com",
      "yopmail.com",
      "trashmail.com",
      "getnada.com",
      "maildrop.cc",
      "sharklasers.com",
      "grr.la",
      "spamgourmet.com",
      "temp-mail.org",
      "fakeinbox.com",
      "dispostable.com",
      "mintemail.com",
    ].includes(domain)
  ) {
    return "Les emails temporaires ne sont pas autorisés."
  }
  return null
}

function validatePassword(password: string): string | null {
  if (!password) return "Le mot de passe est requis."
  if (password.length < 6) return "Le mot de passe doit contenir au moins 6 caractères."
  return null
}

function validateBusinessName(name: string): string | null {
  if (!name.trim()) return "Le nom du dépôt est requis."
  if (name.trim().length < 2) return "Le nom du dépôt doit contenir au moins 2 caractères."
  if (name.trim().length > 100) return "Le nom du dépôt ne doit pas dépasser 100 caractères."
  return null
}

// -------------------------------------------------------------------
// Page d'inscription vendeur — mode email uniquement
// -------------------------------------------------------------------
function InscriptionVendeurContent() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const role = "vendor"

  const searchRedirect = useSearchParams().get("redirect")
  const redirectTo = searchRedirect ?? "/dashboard/pro"

  useEffect(() => {
    if (session?.user) {
      router.push(redirectTo)
    }
  }, [session, router, redirectTo])

  // ---------- État du formulaire (phase 1 : création de compte) ----------
  const [businessName, setBusinessName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{
    businessName?: string
    email?: string
    password?: string
  }>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // ---------- Validation ----------
  const validateForm = () => {
    const businessNameError = validateBusinessName(businessName)
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    const errors: {
      businessName?: string
      email?: string
      password?: string
    } = {}
    if (businessNameError) errors.businessName = businessNameError
    if (emailError) errors.email = emailError
    if (passwordError) errors.password = passwordError
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ---------- Submission ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)

    if (!validateForm()) {
      return
    }

    setError("")
    setLoading(true)

    try {
      // Nettoyer le numéro de téléphone (non utilisé en mode email)
      const cleanPhoneNumber = ""

      // Inscription mode email
      const { error: signUpError } = await authClient.signUp.email({
        name: businessName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phoneNumber: cleanPhoneNumber,
        role,
      } as Parameters<typeof authClient.signUp.email>[0])

      if (signUpError) {
        console.error("[signup-vendeur] signUpError:", JSON.stringify(signUpError, null, 2))
        const errorMessage =
          signUpError.message ?? "Impossible de créer le compte."
        if (
          errorMessage.toLowerCase().includes("email") ||
          errorMessage.toLowerCase().includes("already") ||
          errorMessage.toLowerCase().includes("déjà") ||
          errorMessage.toLowerCase().includes("exist")
        ) {
          setFieldErrors((prev) => ({ ...prev, email: "Cette adresse email est déjà utilisée. Essayez de vous connecter." }))
        } else if (
          errorMessage.toLowerCase().includes("password") ||
          errorMessage.toLowerCase().includes("mot de passe")
        ) {
          setFieldErrors((prev) => ({ ...prev, password: errorMessage }))
        } else if (
          errorMessage.toLowerCase().includes("name") ||
          errorMessage.toLowerCase().includes("nom")
        ) {
          setFieldErrors((prev) => ({ ...prev, businessName: errorMessage }))
        } else {
          setError(errorMessage)
        }
        setLoading(false)
        return
      }

      // === PHASE 2 : Rediriger vers la configuration du profil ===
      // Le compte est créé. On envoie le code de vérification et on
      // redirige vers la page de configuration où le vendeur pourra ajouter
      // son adresse, téléphone, description, etc.
      const normalizedEmail = email.trim().toLowerCase()
      let sendOk = true
      try {
        const res = await fetch("/api/auth/email-otp/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, resend: false }),
        })
        sendOk = res.ok
        if (!sendOk) {
          const data = await res.json().catch(() => null)
          console.error("[signup-vendeur] envoi du code refusé:", data?.error?.message)
        }
      } catch (sendErr) {
        console.error("[signup-vendeur] envoi du code échoué:", sendErr)
        sendOk = false
      }

      const flags = sendOk ? "&sent=1" : "&sendError=1"
      router.push(
        `/validation-email?mode=${MODE_EMAIL}&email=${encodeURIComponent(normalizedEmail)}&redirect=${encodeURIComponent(
          "/inscription/vendeur/configuration"
        )}${flags}`
      )
      router.refresh()
    } catch (err) {
      console.error("[signup-vendeur] catch error:", err)
      setError("Une erreur inattendue est survenue. Veuillez réessayer.")
      setLoading(false)
    }
  }

  // ---------- Gestion des changements d'entrée ----------
  const handleInputChange = (
    field: "businessName" | "email" | "password",
    value: string
  ) => {
    if (field === "businessName") setBusinessName(value)
    if (field === "email") setEmail(value)
    if (field === "password") setPassword(value)
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (error) setError("")
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* ---------- Retourn en arrière ---------- */}
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

        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-success/10 text-success ring-1 ring-success/20">
              <Store className="size-6" />
            </div>
            <CardTitle className="text-xl font-bold">Créer un compte vendeur</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Remplissez vos informations pour commencer
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Nom du dépôt</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="businessName"
                    type="text"
                    autoComplete="businessName"
                    placeholder="Ex: Point Gaz Bonamoussadi"
                    value={businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                    onBlur={() => setSubmitted(true)}
                    required
                    className="pl-10 h-11"
                    disabled={loading}
                    aria-invalid={submitted && !!fieldErrors.businessName}
                    aria-describedby={
                      submitted && fieldErrors.businessName ? "businessName-error" : undefined
                    }
                  />
                </div>
                {submitted && fieldErrors.businessName && (
                  <p
                    id="businessName-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {fieldErrors.businessName}
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
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onBlur={() => setSubmitted(true)}
                    required
                    className="pl-10 h-11"
                    disabled={loading}
                    aria-invalid={submitted && !!fieldErrors.email}
                    aria-describedby={
                      submitted && fieldErrors.email ? "email-error" : undefined
                    }
                  />
                </div>
                {submitted && fieldErrors.email && (
                  <p
                    id="email-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {fieldErrors.email}
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
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    onBlur={() => setSubmitted(true)}
                    required
                    minLength={6}
                    className="pl-10 pr-10 h-11"
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
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {submitted && fieldErrors.password && (
                  <p
                    id="password-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {fieldErrors.password}
                  </p>
                )}
              </div>

            {error && (
              <div
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2"
                role="alert"
              >
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading
                ? "Création en cours..."
                : "Créer un compte vendeur"}
            </Button>
          </form>
        </CardContent>
        </Card>
      </div>
    </div>
  )
}

// -------------------------------------------------------------------
// Page de configuration du profil vendeur (phase 2)
// -------------------------------------------------------------------
function ConfigurationProfilVendeur() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") || "email"
  const emailParam = searchParams.get("email") || ""
  const redirectFrom = searchParams.get("redirect") || "/inscription/vendeur"

  // Pré-remplir l'email dans le formulaire
  const [email, setEmail] = useState(emailParam)

  useEffect(() => {
    // Si un compte existe déjà, on redirige
    const { data: session } = authClient.useSession()
    if (session?.user) {
      router.push("/dashboard/pro")
    }
  }, [email])

  // ---------- État du formulaire ----------
  const [businessAddress, setBusinessAddress] = useState("")
  const [businessPhone, setBusinessPhone] = useState("")
  const [businessDescription, setBusinessDescription] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // ---------- Validation ----------
  const validateConfigForm = () => {
    const businessAddressError = getBusinessAddressError(businessAddress)
    const businessPhoneError =
      businessPhone.trim() && /^[\d\s\+\-\(\)]+$/.test(businessPhone)
        ? null
        : "Le numéro de téléphone semble invalide."
    const errors: { businessAddress?: string; businessPhone?: string } = {}
    if (businessAddressError) errors.businessAddress = businessAddressError
    if (businessPhoneError) errors.businessPhone = businessPhoneError
    return errors
  }

  // ---------- Submission ----------
  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const configErrors = validateConfigForm()
    if (Object.keys(configErrors).length > 0) {
      setError(
        Object.values(configErrors)
          .filter((e) => e)
          .join(" <br> ")
      )
      setLoading(false)
      return
    }

    try {
      // Ici, on pourrait sauvegarder la configuration dans une API
      // pour l'instant, on se contente de rediriger vers le dashboard
      router.push("/dashboard/pro")
    } catch (err) {
      console.error("[config-profil] error:", err)
      setError("Une erreur est survenue. Veuillez réessayer.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-success/10 text-success ring-1 ring-success/20">
              <Store className="size-6" />
            </div>
            <CardTitle className="text-xl font-bold">Configuration du profil vendeur</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Complétez vos informations de boutique
            </p>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleConfigSubmit} className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="businessAddress">Adresse du dépôt</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="businessAddress"
                    type="text"
                    autoComplete="streetAddress"
                    placeholder="Ex: Rue principale, Bonamoussadi"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    required
                    className="pl-10 h-11"
                    disabled={loading}
                  />
                </div>
                {error && getBusinessAddressError(businessAddress) && (
                  <p className="text-sm text-destructive" role="alert">
                    {getBusinessAddressError(businessAddress)}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="businessPhone">Téléphone</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="businessPhone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+237 6 99 00 00 00"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    required
                    className="pl-10 h-11"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="businessDescription">Description</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Textarea
                    id="businessDescription"
                    placeholder="Décrivez votre point de vente (horaires, spécialités...)"
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    rows={3}
                    className="pl-10 h-24 resize-y"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? "Enregistrement en cours..." : "Enregistrer la configuration"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// -------------------------------------------------------------------
// Pages principales
// -------------------------------------------------------------------
export default function InscriptionVendeurPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <InscriptionVendeurContent />
    </Suspense>
  )
}

// Exportation de la page de configuration pour usage dans validation-email
export { ConfigurationProfilVendeur }