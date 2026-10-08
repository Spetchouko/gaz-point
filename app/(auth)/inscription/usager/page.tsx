"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

// Liste des domaines d'emails temporaires courants
const TEMP_EMAIL_DOMAINS = [
  "10minutemail.com", "guerrillamail.com", "mailinator.com", "tempmail.com",
  "throwawaymail.com", "yopmail.com", "trashmail.com", "getnada.com",
  "maildrop.cc", "sharklasers.com", "grr.la", "spamgourmet.com",
  "temp-mail.org", "fakeinbox.com", "dispostable.com", "mintemail.com"
]

function validateEmail(email: string): string | null {
  if (!email.trim()) return "L'email est requis."
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return "Format d'email invalide."
  
  const domain = email.split("@")[1]?.toLowerCase()
  if (domain && TEMP_EMAIL_DOMAINS.includes(domain)) {
    return "Les emails temporaires ne sont pas autorisés."
  }
  return null
}

function validatePassword(password: string): string | null {
  if (!password) return "Le mot de passe est requis."
  if (password.length < 6) return "Le mot de passe doit contenir au moins 6 caractères."
  return null
}

function validatePhone(phone: string): string | null {
  if (!phone.trim()) return "Le numéro de téléphone est requis."
  // Vérifier que ça commence par +237 et contient 9 chiffres après
  const cleanPhone = phone.replace(/\s/g, "")
  if (!cleanPhone.startsWith("+237")) return "Le numéro doit commencer par +237"
  const digits = cleanPhone.slice(4) // Enlever +237
  if (!/^\d{9}$/.test(digits)) return "Le numéro doit contenir 9 chiffres après +237"
  return null
}

function validateName(name: string): string | null {
  if (!name.trim()) return "Le nom est requis."
  if (name.trim().length < 2) return "Le nom doit contenir au moins 2 caractères."
  return null
}

function InscriptionUsagerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = authClient.useSession()
  const role = "client"

  const searchRedirect = searchParams.get("redirect")
  const redirectTo = searchRedirect ?? "/dashboard"

  useEffect(() => {
    if (session?.user) {
      router.push(redirectTo)
    }
  }, [session, router, redirectTo])

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("+237 ")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    email?: string
    phoneNumber?: string
    password?: string
  }>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const validateForm = () => {
    const nameError = validateName(name)
    const emailError = validateEmail(email)
    const phoneError = validatePhone(phoneNumber)
    const passwordError = validatePassword(password)
    const errors: {
      name?: string
      email?: string
      phoneNumber?: string
      password?: string
    } = {}
    if (nameError) errors.name = nameError
    if (emailError) errors.email = emailError
    if (phoneError) errors.phoneNumber = phoneError
    if (passwordError) errors.password = passwordError
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)

    if (!validateForm()) {
      return
    }

    setError("")
    setLoading(true)

    try {
      // Nettoyer le numéro de téléphone : garder seulement + et les chiffres
      const cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, '')

      const { error: signUpError } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phoneNumber: cleanPhoneNumber,
        role,
      } as Parameters<typeof authClient.signUp.email>[0])

      if (signUpError) {
        console.error("[signup-usager] signUpError:", JSON.stringify(signUpError, null, 2))
        const errorMessage = signUpError.message ?? "Impossible de créer le compte."
        const lowerMsg = errorMessage.toLowerCase()
        if (lowerMsg.includes("email") || lowerMsg.includes("already") || lowerMsg.includes("déjà") || lowerMsg.includes("exist")) {
          setFieldErrors((prev) => ({ ...prev, email: "Cette adresse email est déjà utilisée. Essayez de vous connecter." }))
        } else if (lowerMsg.includes("phone") || lowerMsg.includes("téléphone")) {
          setFieldErrors((prev) => ({ ...prev, phoneNumber: errorMessage }))
        } else if (lowerMsg.includes("password") || lowerMsg.includes("mot de passe")) {
          setFieldErrors((prev) => ({ ...prev, password: errorMessage }))
        } else if (lowerMsg.includes("name") || lowerMsg.includes("nom")) {
          setFieldErrors((prev) => ({ ...prev, name: errorMessage }))
        } else {
          setError(errorMessage)
        }
        setLoading(false)
        return
      }

      router.push(redirectTo)
      router.refresh()
} catch (err) {
        console.error("[signup-usager] catch error:", err)
        setError("Une erreur inattendue est survenue. Veuillez réessayer.")
        setLoading(false)
      }
  }

  const handleInputChange = (
    field: "name" | "email" | "phoneNumber" | "password",
    value: string
  ) => {
    if (field === "name") setName(value)
    if (field === "email") setEmail(value)
    if (field === "phoneNumber") {
      // S'assurer que +237 reste au début
      if (!value.startsWith("+237")) {
        value = "+237 " + value.replace(/^\+237\s*/, "")
      }
      setPhoneNumber(value)
    }
    if (field === "password") setPassword(value)
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (error) setError("")
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
            Retour
          </Button>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600 ring-1 ring-sky-200">
              <User className="size-6" />
            </div>
            <CardTitle className="text-xl font-bold">Créer un compte usager</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Remplissez vos informations pour commencer
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Ex: Jean Dupont"
                    value={name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    onBlur={() => setSubmitted(true)}
                    required
                    className="pl-10 h-11"
                    disabled={loading}
                    aria-invalid={submitted && !!fieldErrors.name}
                    aria-describedby={submitted && fieldErrors.name ? "name-error" : undefined}
                  />
                </div>
                {submitted && fieldErrors.name && (
                  <p id="name-error" className="text-sm text-destructive" role="alert">
                    {fieldErrors.name}
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
                <Label htmlFor="phoneNumber">Numéro de téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+237 6XX XX XX XX"
                    value={phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    onBlur={() => setSubmitted(true)}
                    required
                    maxLength={14}
                    className="pl-10 h-11"
                    disabled={loading}
                    aria-invalid={submitted && !!fieldErrors.phoneNumber}
                    aria-describedby={submitted && fieldErrors.phoneNumber ? "phone-error" : undefined}
                  />
                </div>
                {submitted && fieldErrors.phoneNumber && (
                  <p id="phone-error" className="text-sm text-destructive" role="alert">
                    {fieldErrors.phoneNumber}
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

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  "Créer mon compte usager"
                )}
              </Button>
            </form>

            <div className="mt-8 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-background px-2 text-muted-foreground">Ou continuer avec</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2 h-11 mt-2"
                disabled={loading}
                onClick={() => authClient.signIn.social({ provider: "google", callbackURL: redirectTo })}
              >
                <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={16} height={16} className="size-4" />
                Continuer avec Google
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Déjà un compte ?{" "}
              <Link href={`/connexion?redirect=${encodeURIComponent(redirectTo)}`} className="text-sky-600 hover:underline font-medium">
                Se connecter
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function InscriptionUsager() {
  return (
    <Suspense>
      <InscriptionUsagerPage />
    </Suspense>
  )
}