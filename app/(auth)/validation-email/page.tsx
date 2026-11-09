"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Loader2, Clock, Mail } from "lucide-react"

const CODE_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

function ValidationEmailContent() {
  const params = useSearchParams()
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const emailParam = (params.get("email") ?? "").trim().toLowerCase()
  const email = emailParam || (session?.user?.email ?? "").toLowerCase()
  const linkVerified = params.get("verified") === "1"
  const emailSentFromUrl = params.get("sent") === "1"

  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState(emailSentFromUrl ? "Un code de verification a ete envoye a votre adresse email." : "")
  const [success, setSuccess] = useState(linkVerified)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const codeRef = useRef<HTMLInputElement[]>([])

  useEffect(() => {
    if (session?.user?.emailVerified) {
      router.push(`/connexion?email=${encodeURIComponent(session.user.email ?? "")}`)
    }
  }, [router, session])

  useEffect(() => {
    if (linkVerified && email) {
      setSuccess(true)
      setNotice("")
      setError("")
      setCode("")
      const timer = setTimeout(() => {
        // Check if vendor by making a quick API call or use session
        // For now, redirect to a page that will determine the right destination
        router.push(`/connexion?email=${encodeURIComponent(email)}&redirect=auto`)
        router.refresh()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [linkVerified, email, router])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleInputChange = (index: number, value: string) => {
    const val = value.replace(/\D/g, "").slice(0, 1)
    setCode((prev) => {
      const chars = prev.split("")
      chars[index] = val
      return chars.join("")
    })
    if (val && index < CODE_LENGTH - 1) {
      const next = codeRef.current[index + 1]
      if (next) next.focus()
    }
    if (error) setError("")
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (!codeRef.current[index].value && index > 0) {
        codeRef.current[index - 1].focus()
        setCode((prev) => {
          const chars = prev.split("")
          chars[index - 1] = ""
          return chars.join("")
        })
      } else {
        setCode((prev) => {
          const chars = prev.split("")
          chars[index] = ""
          return chars.join("")
        })
      }
    }
    if (e.key === "ArrowLeft" && index > 0) {
      codeRef.current[index - 1].focus()
    }
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      codeRef.current[index + 1].focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text")
    const digits = pasted.replace(/\D/g, "").slice(0, CODE_LENGTH)
    if (digits.length === 0) return
    setCode(digits)
    setTimeout(() => {
      digits.split("").forEach((d, i) => {
        const el = codeRef.current[i]
        if (el) el.value = d
      })
      const lastFilled = Math.min(digits.length - 1, CODE_LENGTH - 1)
      codeRef.current[lastFilled]?.focus()
      if (digits.length === CODE_LENGTH) {
        verifier(digits)
      }
    }, 0)
  }

  const getCodeValue = (index: number) => code[index] || ""

  const verifier = useCallback(async (value: string) => {
    const otp = value.trim()
    if (loading || success) return
    if (!email) {
      setError("Session expiree. Veuillez recommencer la verification.")
      return
    }
    if (otp.length !== CODE_LENGTH) {
      setError("Le code doit contenir 6 chiffres.")
      return
    }
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/email-otp/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })
      const data = (await res.json().catch(() => null)) as
        | { message?: string; error?: { message?: string } }
        | null
      if (!res.ok || data?.error) {
        const msg = data?.error?.message ?? data?.message ?? "Code invalide ou expiré."
        setError(msg)
        setLoading(false)
        return
      }
      setSuccess(true)
      setError("")
      setNotice("")
      await new Promise((r) => setTimeout(r, 800))
      router.push(`/connexion?email=${encodeURIComponent(email)}`)
      router.refresh()
    } catch {
      setError("Une erreur inattendue est survenue. Veuillez reessayer.")
      setLoading(false)
    }
  }, [loading, success, email, router])

  const renvoyerCode = async () => {
    if (resending || resendCooldown > 0) return
    if (!email) {
      setError("Session expiree. Veuillez recommencer la verification.")
      return
    }
    setResending(true)
    setError("")
    setNotice("")
    setNotice("Preparation de votre email de verification...")
    try {
      const res = await fetch("/api/auth/email-otp/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = (await res.json().catch(() => null)) as
        | { error?: { message?: string; retryAfter?: number } }
        | null
      if (!res.ok || data?.error) {
        setError(
          data?.error?.message ??
            "Impossible de renvoyer le code. Reessayez dans un instant."
        )
        const retryAfter = Number(data?.error?.retryAfter)
        if (Number.isFinite(retryAfter) && retryAfter > 0) {
          setResendCooldown(retryAfter)
        }
        setResending(false)
        setNotice("Code de verification envoye a votre adresse email.")
        return
      }
      setNotice("Un nouveau code de verification a ete envoye a votre adresse e-mail.")
      setCode("")
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      setNotice("Code de verification envoye a votre adresse email.")
    } catch {
      setError("Une erreur inattendue est survenue. Veuillez reessayer.")
    }
    setResending(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Card className="p-8 md:p-10">
            <CardHeader className="mb-6 text-center">
              <CheckCircle className="size-8 text-primary mx-auto mb-3" />
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Email verifie
              </h2>
              <p className="mt-1 text-sm text-muted-foreground text-center">
                Votre adresse email a ete confirmee avec succes.
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Redirection vers la connexion…
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card className="p-8 md:p-10">
          <CardHeader className="mb-6 text-center">
            <Mail className="size-8 text-primary mx-auto mb-3" />
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Confirmation email
            </h2>
            <p className="mt-1 text-sm text-muted-foreground text-center">
              Verifiez votre adresse email{" "}
              {email && <span className="font-medium">{email}</span>}
            </p>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {notice}
              </p>

              {error && (
                <div
                  className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                  role="alert"
                >
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-2 justify-center mb-2">
                {[...Array(CODE_LENGTH)].map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={getCodeValue(i)}
                    onChange={(e) => handleInputChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    ref={(el) => {
                      if (el) codeRef.current[i] = el
                    }}
                    disabled={loading || !email}
                    className="w-10 h-12 rounded-lg border border-border text-center text-2xl font-bold text-foreground focus:border-primary focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                    aria-label={`Chiffre ${i + 1} du code de verification`}
                  />
                ))}
              </div>

              <Button
                onClick={() => verifier(code)}
                className="w-full"
                disabled={loading || !email || code.length !== CODE_LENGTH}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Verification en cours…
                  </>
                ) : (
                  "Confirmer le code email"
                )}
              </Button>

              <div className="text-center min-h-6">
                {resending ? (
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    Envoi…
                  </span>
                ) : resendCooldown > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3.5" aria-hidden />
                    Renvoyer possible dans{" "}
                    <span className="font-mono">{formatTime(resendCooldown)}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={renvoyerCode}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Vous n&apos;avez pas reçu le code ? Renvoyer un code
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ValidationEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Chargement…
        </div>
      }
    >
      <ValidationEmailContent />
    </Suspense>
  )
}
