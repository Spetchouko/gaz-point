"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Mail, Lock, Store, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react"
import { useState } from "react"
import { Turnstile } from "@/components/ui/turnstile"

// === Mode de confirmation email ===
const MODE_EMAIL = "email"

function validateEmail(email: string): string | null {
  if (!email.trim()) return "L'email est requis."
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return "Format d'email invalide."
  
  const domain = email.split("@")[1]?.toLowerCase()
  if (domain && ["10minutemail.com", "guerrillamail.com", "mailinator.com", "tempmail.com",
    "throwawaymail.com", "yopmail.com", "trashmail.com", "getnada.com",
    "maildrop.cc", "sharklasers.com", "grr.la", "spamgourmet.com",
    "temp-mail.org", "fakeinbox.com", "dispostable.com", "mintemail.com"].includes(domain)) {
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

  // ---------- État du formulaire ----------
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
  const [captchaToken, setCaptchaToken] = useState("")

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

    if (!captchaToken) {
      setError("Veuillez valider le CAPTCHA.")
      setLoading(false)
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
        captchaToken,
      } as Parameters<typeof authClient.signUp.email>[0])

      if (signUpError) {
        console.error("[signup-vendeur] signUpError:", JSON.stringify(signUpError, null, 2))
        const errorMessage = signUpError.message ?? "Impossible de créer le compte."
        if (errorMessage.toLowerCase().includes("email") || errorMessage.toLowerCase().includes("already") || errorMessage.toLowerCase().includes("déjà") || errorMessage.toLowerCase().includes("exist")) {
          setFieldErrors((prev) => ({ ...prev, email: "Cette adresse email est déjà utilisée. Essayez de vous connecter." }))
        } else if (errorMessage.toLowerCase().includes("phone") || errorMessage.toLowerCase().includes("téléphone")) {
          setFieldErrors((prev) => ({ ...prev, phoneNumber: errorMessage }))
        } else if (errorMessage.toLowerCase().includes("password") || errorMessage.toLowerCase().includes("mot de passe")) {
          setFieldErrors((prev) => ({ ...prev, password: errorMessage }))
        } else if (errorMessage.toLowerCase().includes("name") || errorMessage.toLowerCase().includes("nom")) {
          setFieldErrors((prev) => ({ ...prev, businessName: errorMessage }))
        } else {
          setError(errorMessage)
        }
        setLoading(false)
        return
      }

      // Inscription réussie — rediriger vers la page de validation
      router.push(`/validation-email?mode=${MODE_EMAIL}&redirect=${encodeURIComponent(redirectTo)}`)
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
        {/* ---------- Choix du mode (simplifié à email) ---------- */}
        <div className="mb-6">
          <Card className="p-4 md:p-6 text-sm">
            <CardHeader className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-foreground">
                Confirmation par email
              </h3>
            </CardHeader>
            <p className="text-xs text-muted-foreground">
              Un code vous sera envoyé sur votre adresse email.
            </p>
          </Card>
        </div>

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
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200">
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
                    aria-describedby={submitted && fieldErrors.businessName ? "businessName-error" : undefined}
                  />
                </div>
                {submitted && fieldErrors.businessName && (
                  <p id="businessName-error" className="text-sm text-destructive" role="alert">
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
                    aria-describedby={submitted && fieldErrors.email ? "email-error" : undefined}
                  />
                </div>
                {submitted && fieldErrors.email && (
                  <p id="email-error" className="text-sm text-destructive" role="alert">
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
                    aria-describedby={submitted && fieldErrors.password ? "password-error" : undefined}
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
                  <p id="password-error" className="text-sm text-destructive" role="alert">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2" role="alert">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* CAPTCHA Turnstile */}
              <div className="pt-2">
                <Turnstile
                  action="inscription"
                  onVerify={setCaptchaToken}
                  onExpire={() => setCaptchaToken("")}
                  onError={() => setCaptchaToken("")}
                />
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                Créer un compte vendeur
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function InscriptionVendeurPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <InscriptionVendeurContent />
    </Suspense>
  )
}