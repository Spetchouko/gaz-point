"use client"

import { useState } from "react"
import { Loader2, Mail, Send } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const sujets = [
  {
    objet: "Question générale",
    description:
      "Comprendre le service, savoir si GazPoints couvre ton quartier, ou demander une précision.",
  },
  {
    objet: "Signalement",
    description:
      "Un point de vente qui n'existe plus, une disponibilité fausse, une adresse erronée. On corrige la carte.",
  },
  {
    objet: "Problème technique",
    description:
      "Une page qui ne s'affiche pas, une recherche qui ne trouve rien, une erreur d'interface.",
  },
  {
    objet: "Données personnelles",
    description:
      "Accès, rectification ou suppression de tes données. Objet à utiliser en priorité.",
  },
  {
    objet: "Facturation",
    description:
      "Une question sur l'abonnement Vendeur (5 000 FCFA/mois), un paiement, un remboursement ou une facture déjà réglée.",
  },
  {
    objet: "Partenariat ou presse",
    description:
      "Un article sur GazPoints, une interview, ou une collaboration institutionnelle.",
  },
]

type Statut = "idle" | "envoi" | "succes" | "erreur"

export function ContactForm() {
  const [nom, setNom] = useState("")
  const [email, setEmail] = useState("")
  const [objet, setObjet] = useState<string | null>(null)
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
        body: JSON.stringify({ nom, email, objet: objet ?? "", message }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setStatut("erreur")
        setErreur(data?.error ?? "L'envoi a échoué. Réessaie plus tard.")
        return
      }

      setStatut("succes")
      setNom("")
      setEmail("")
      setObjet(null)
      setMessage("")
    } catch {
      setStatut("erreur")
      setErreur("Impossible d'envoyer le message. Vérifie ta connexion.")
    }
  }

  return (
    <section
      id="ecrire"
      className="w-full scroll-mt-16 border-y bg-muted/50 py-16 md:py-24"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]">
            <Send className="size-3.5" />
            Avant d&apos;écrire
          </Badge>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Envoie-nous{" "}
            <span className="text-primary">ta demande</span>
          </h2>

          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            Un objet clair, c&apos;est une réponse en quelques heures au lieu de
            plusieurs jours. Tu n&apos;as aucun compte à créer.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-[1.25fr_1fr]">
          <Card className="transition-all hover:shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Le formulaire</CardTitle>
              <CardDescription>
                Ta demande arrive directement dans notre boîte email. Réponse sous
                48 h ouvrées.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {statut === "succes" ? (
                <Alert className="border-success/20 bg-success/5 text-success *:data-[slot=alert-description]:text-success">
                  <AlertTitle>Message envoyé</AlertTitle>
                  <AlertDescription>
                    Merci ! Ta demande est bien reçue, nous te répondons par
                    email sous 48 h ouvrées.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-nom">Nom</Label>
                      <Input
                        id="contact-nom"
                        name="nom"
                        required
                        autoComplete="name"
                        value={nom}
                        onChange={(event) => setNom(event.target.value)}
                        placeholder="Ton nom complet"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="ton@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contact-objet">Objet</Label>
                    <Select
                      value={objet}
                      onValueChange={(value) => setObjet(value ?? "")}
                    >
                      <SelectTrigger id="contact-objet" className="w-full">
                        <SelectValue placeholder="Choisis un objet" />
                      </SelectTrigger>
                      <SelectContent>
                        {sujets.map((sujet) => (
                          <SelectItem key={sujet.objet} value={sujet.objet}>
                            {sujet.objet}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      placeholder="Décris ta demande en quelques lignes…"
                    />
                  </div>

                  {statut === "erreur" && erreur && (
                    <Alert variant="destructive">
                      <AlertTitle>Échec de l&apos;envoi</AlertTitle>
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

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl">Les objets possibles</CardTitle>
              <CardDescription>
                Aucun objet n&apos;est obligatoire, mais voici les plus courants.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {sujets.map((sujet) => (
                <div key={sujet.objet} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <p className="text-sm font-medium text-foreground">
                    {sujet.objet}
                  </p>
                  <p className="mt-1 text-pretty text-sm text-muted-foreground">
                    {sujet.description}
                  </p>
                </div>
              ))}

              <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
                <Mail className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                Tu préfères ton propre client email ? Écris directement à{" "}
                <a
                  href="mailto:petchouko@gmail.com"
                  className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                >
                  petchouko@gmail.com
                </a>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
