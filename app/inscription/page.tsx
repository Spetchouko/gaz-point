"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Phone, Store, User } from "lucide-react"

export default function Inscription() {
  const router = useRouter()
  const [role, setRole] = useState<"client" | "vendor">("client")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phoneNumber = formData.get("phoneNumber") as string
    const password = formData.get("password") as string

    const { data, error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
      phoneNumber,
      role,
    } as Parameters<typeof authClient.signUp.email>[0])

    setLoading(false)

    if (signUpError || !data) {
      setError(signUpError?.message || "Une erreur est survenue lors de l'inscription.")
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Créer un compte
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Inscris-toi pour accéder à GazPoint.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3.5">
          {/* Sélection du rôle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Type de profil
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("client")}
                className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center transition-all cursor-pointer ${
                  role === "client"
                    ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <User className="size-4 mb-1" />
                <span className="text-xs">Usager / Client</span>
                <span className="text-[10px] text-muted-foreground">0 FCFA</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("vendor")}
                className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center transition-all cursor-pointer ${
                  role === "vendor"
                    ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Store className="size-4 mb-1" />
                <span className="text-xs">Vendeur / Dépôt</span>
                <span className="text-[10px] text-muted-foreground">5 000 FCFA/m</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              {role === "vendor" ? "Nom du dépôt ou gérant" : "Nom complet"}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 block w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
              placeholder={role === "vendor" ? "Ex: Dépôt Gaz Bonamoussadi" : "Ton nom complet"}
            />
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="ton@email.com"
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="text-sm font-medium text-foreground flex items-center justify-between">
              <span>Numéro de téléphone</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="size-3" /> Vérification mobile
              </span>
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              required
              className="mt-1 block w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="Ex: +237 6XX XX XX XX"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 block w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="Au moins 8 caractères"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive rounded-md bg-destructive/10 p-2" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="mt-2 h-11 w-full font-semibold cursor-pointer">
            {loading ? "Inscription..." : role === "vendor" ? "Créer mon compte Vendeur" : "Créer mon compte Usager"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="text-primary underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  )
}
