"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Link } from "next/link"
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2, Store } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") ?? "/dashboard"
  const { data: session } = authClient.useSession()

  useEffect(() => {
    if (session?.user) {
      router.push(redirectTo)
    }
  }, [session, router, redirectTo])

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<"client" | "vendor">("client")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { error: signUpError } = await authClient.signUp.email({
        name,
        email,
        password,
        phoneNumber,
        role,
      } as Parameters<typeof authClient.signUp.email>[0])

      if (signUpError) {
        setError(signUpError.message ?? "Impossible de créer le compte.")
        setLoading(false)
        return
      }

      router.push(redirectTo)
      router.refresh()
    } catch {
      setError("Une erreur inattendue est survenue.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Image
              src="/brand/logo.png"
              alt="GazPoint"
              width={26}
              height={26}
              className="h-6.5 w-6.5 object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Créer un compte</CardTitle>
          <p className="text-muted-foreground">Choisissez votre profil et commencez</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Type de profil
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("client")}
                className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-all cursor-pointer ${
                  role === "client"
                    ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <User className="size-5 mb-1" />
                <span className="text-sm">Usager</span>
                <span className="text-[10px] font-normal text-muted-foreground">Gratuit</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("vendor")}
                className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-all cursor-pointer ${
                  role === "vendor"
                    ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Store className="size-5 mb-1" />
                <span className="text-sm">Vendeur</span>
                <span className="text-[10px] font-normal text-muted-foreground">5 000 FCFA/mois</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{role === "vendor" ? "Nom du dépôt ou gérant" : "Nom complet"}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder={role === "vendor" ? "Ex: Dépôt Gaz Bonamoussadi" : "Ex: Jean Dupont"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="flex items-center justify-between">
                <span>Numéro de téléphone</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Phone className="size-2.5" /> Vérification mobile
                </span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Ex: +237 6XX XX XX XX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="8 caractères minimum"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="pl-10 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : role === "vendor" ? (
                "Créer mon compte Vendeur"
              ) : (
                "Créer mon compte Usager"
              )}
            </Button>
          </form>

          <Separator className="my-4">
            <span className="text-xs text-muted-foreground">Ou continuer avec</span>
          </Separator>

          <Button variant="outline" className="w-full gap-2" onClick={() => authClient.signIn.social({ provider: "google", callbackURL: redirectTo })}>
            <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="size-4" />
            Continuer avec Google
          </Button>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href={`/connexion?redirect=${encodeURIComponent(redirectTo)}`} className="text-primary hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}