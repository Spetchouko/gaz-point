"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckCircle } from "lucide-react"
import { useState } from "react"

function ValidationEmailContent() {
  const params = useSearchParams()
  const redirectParam = params.get("redirect") || "/dashboard"
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (session?.user?.emailVerified) {
      router.push(redirectParam ?? "/dashboard")
    }
  }, [redirectParam, router, session])

  const verifier = async () => {
    setError("")
    if (!code.trim()) {
      setError("Veuillez entrer le code de vérification.")
      return
    }
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
        setError(data.error?.message ?? "Code invalide ou expiré.")
        return
      }
    } catch (err) {
      console.error("[validation] catch error:", err)
      setError("Une erreur inattendue est survenue. Veuillez réessayer.")
      return
    }

    setSuccess(true)
    await new Promise((r) => setTimeout(r, 800))
    router.push(redirectParam ?? "/dashboard")
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
              Entrez le code reçu par email.
            </p>
          </CardHeader>

          <CardContent>
            {success && (
              <div className="mb-4 text-center">
                <CheckCircle className="size-6 text-primary mx-auto mb-2" />
                <p className="text-sm text-foreground">Votre compte est maintenant vérifié.</p>
              </div>
            )}

            {error && (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            )}

            {!success && !error && (
              <div className="space-y-4">
                <Input
                  id="verification-code"
                  type="text"
                  autoComplete="verification-code"
                  placeholder="Code email à 6 chiffres"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  className="w-full h-11 rounded-md border border-border placeholder:text-muted-foreground focus:border-primary"
                />
                <Button
                  onClick={verifier}
                  className="w-full"
                >
                  Confirmer le code email
                </Button>
                <p className="text-xs text-muted-foreground">
                  Le code expire dans quelques minutes. Si vous ne l&apos;avez pas re&ccedil;u,
                  vous pouvez en demander un nouveau.
                </p>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <ValidationEmailContent />
    </Suspense>
  )
}