"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckCircle, AlertCircle, Loader2, Clock } from "lucide-react"

const CODE_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

function ValidationEmailContent() {
  const params = useSearchParams()
  const redirectParam = params.get("redirect") || "/dashboard"
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(600) // 10 minutes en secondes
  const [resendCooldown, setResendCooldown] = useState(0)
  const [codeExpired, setCodeExpired] = useState(false)

  // Vérifier si déjà connecté et email vérifié
  useEffect(() => {
    if (session?.user?.emailVerified) {
      router.push(redirectParam ?? "/dashboard")
    }
  }, [redirectParam, router, session])

  // Compte à rebours principal (10 minutes)
  useEffect(() => {
    if (countdown <= 0) {
      setCodeExpired(true)
      setError("Votre code a expiré. Veuillez demander un nouveau code.")
      return
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCodeExpired(true)
          setError("Votre code a expiré. Veuillez demander un nouveau code.")
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // Cooldown pour le renvoi
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

  const verifier = async () => {
    setError("")
    if (!code.trim()) {
      setError("Veuillez entrer le code de vérification.")
      return
    }
    if (code.length !== CODE_LENGTH) {
      setError("Le code doit contenir 6 chiffres.")
      return
    }
    if (codeExpired) {
      setError("Votre code a expiré. Veuillez demander un nouveau code.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/email-otp/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          email: session?.user?.email ?? "",
        }),
      })
      const data = await res.json()
      if (data.error || !res.ok) {
        const msg = data.error?.message ?? "Code invalide ou expiré."
        if (msg.toLowerCase().includes("expire") || msg.toLowerCase().includes("invalid")) {
          setError("Le code saisi est incorrect. Veuillez entrer le code reçu par email.")
        } else {
          setError(msg)
        }
        setLoading(false)
        return
      }
    } catch (err) {
      console.error("[validation] catch error:", err)
      setError("Une erreur inattendue est survenue. Veuillez réessayer.")
      setLoading(false)
      return
    }

    setSuccess(true)
    setError("")
    await new Promise((r) => setTimeout(r, 1000))
    router.push(redirectParam ?? "/dashboard")
    router.refresh()
  }

  const renvoyerCode = async () => {
    if (resendCooldown > 0) return
    if (!session?.user?.email) {
      setError("Session expirée. Veuillez recommencer l'inscription.")
      return
    }

    setResending(true)
    setError("")
    try {
      const res = await fetch("/api/auth/email-otp/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      })
      const data = await res.json()
      if (data.error || !res.ok) {
        setError(data.error?.message ?? "Impossible de renvoyer le code. Réessayez dans un instant.")
        setResending(false)
        return
      }
      // Succès : réinitialiser le compte à rebours principal et le cooldown
      setCountdown(600)
      setCodeExpired(false)
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      setCode("")
    } catch (err) {
      console.error("[resend] catch error:", err)
      setError("Une erreur inattendue est survenue. Veuillez réessayer.")
    }
    setResending(false)
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card className="p-8 md:p-10">
          <CardHeader className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Confirmation email
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Entrez le code à 6 chiffres reçu par email.
            </p>
          </CardHeader>

          <CardContent>
            {success && (
              <div className="mb-6 text-center">
                <CheckCircle className="size-8 text-primary mx-auto mb-3" />
                <p className="text-base text-foreground font-medium">Félicitations ! Votre compte a été créé avec succès.</p>
                <p className="mt-1 text-sm text-muted-foreground">Redirection vers votre espace…</p>
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!success && !error && (
              <div className="space-y-4">
                {/* Compte à rebours */}
                <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/50 p-3">
                  <Clock className="size-5 text-muted-foreground" aria-hidden />
                  <span className="text-sm font-mono font-medium text-foreground" aria-live="polite">
                    Code valide encore : {formatTime(countdown)}
                  </span>
                </div>

                <Input
                  id="verification-code"
                  type="text"
                  autoComplete="verification-code"
                  placeholder="Code email à 6 chiffres"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH)
                    setCode(val)
                    if (val.length === CODE_LENGTH && !codeExpired) {
                      verifier()
                    }
                  }}
                  maxLength={CODE_LENGTH}
                  className="w-full h-11 rounded-md border border-border placeholder:text-muted-foreground focus:border-primary text-center text-lg tracking-widest"
                  disabled={loading || codeExpired}
                  aria-label="Code de vérification à 6 chiffres"
                />

                <Button
                  onClick={verifier}
                  className="w-full"
                  disabled={loading || code.length !== CODE_LENGTH || codeExpired}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Vérification…
                    </>
                  ) : (
                    "Confirmer le code email"
                  )}
                </Button>

                <div className="text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Le code expire à <span className="font-mono">{formatTime(countdown)}</span>.
                    {codeExpired && <span className="text-destructive"> (expiré)</span>}
                  </p>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={renvoyerCode}
                    disabled={resending || resendCooldown > 0 || codeExpired === false && countdown > 540}
                    className="w-full"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Envoi…
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        <Clock className="size-4 mr-2" />
                        Renvoyer dans {resendCooldown}s
                      </>
                    ) : (
                      "Renvoyer le code"
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Vous n'avez pas reçu l'email ? Vérifiez vos spams ou
                    <span className="text-primary font-medium"> demandez un nouveau code </span>
                    ci-dessus.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ValidationEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement…</div>}>
      <ValidationEmailContent />
    </Suspense>
  )
}