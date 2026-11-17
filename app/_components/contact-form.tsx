"use client"

import { useState } from "react"
import { Loader2, Mail, Send } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Statut = "idle" | "envoi" | "succès" | "erreur"

export function ContactForm() {
  const [nom, setNom] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [statut, setStatut] = useState<Statut>("idle")
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatut("envoi")
    setErreur(null)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, message }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setStatut("erreur")
        setErreur(data?.error ?? "L'envoi a échoué. Réessayez plus tard.")
        return
      }

      setStatut("succès")
      setNom("")
      setEmail("")
      setMessage("")
    } catch {
      setStatut("erreur")
      setErreur("Impossible d'envoyer le message. Vérifiez votre connexion.")
    }
  }

  return (
    <section
      id="ecrire"
      className="w-full scroll-mt-16 border-t border-border bg-muted/50 py-16 md:py-24"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]">
            <Send className="size-3.5" /> Avant d’écrire
          </Badge>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Envoie-nous{" "}<span className="text-primary">ta demande</span>
          </h2>

          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            Un objet clair, c'est une réponse en quelques heures au lieu de plusieurs jours. Vous n'avez aucun compte à créer.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-2xl">
          <Card className="transition-all hover:shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Le formulaire</CardTitle>
              <CardDescription>
                Ta demande arrive directement dans notre boîte email. Réponse sous
                48 h ouvrées.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {statut === "succès" ? (
                <Alert className="border-success/20 bg-success/5 text-success *:data-[slot=alert-description]:text-success">
                  <AlertTitle>Message envoyé</AlertTitle>
                  <AlertDescription>
                    Merci ! Votre demande est bien reçue, nous vous répondrons par
                    email sous 48 h ouvrées.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="contact-nom">Nom</Label>
                      <Input
                        id="contact-nom"
                        name="nom"
                        required
                        autoComplete="name"
                        value={nom}
                        onChange={(event) => setNom(event.target.value)}
                        placeholder="Votre nom complet"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="votre@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-message">Message</Label>
                    <Textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={6}
                      maxLength={5000}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="Décrivez votre demande en quelques lignes…"
                    />
                  </div>

                  {statut === "erreur" && erreur && (
                    <Alert variant="destructive">
                      <AlertTitle>Échec de l’envoi</AlertTitle>
                      <AlertDescription>{erreur}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={statut === "envoi"}
                    className="h-11 w-full gap-2 font-semibold cursor-pointer"
                  >
                    {statut === "envoi" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Envoi en cours…
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        Envoyer ma demande
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}