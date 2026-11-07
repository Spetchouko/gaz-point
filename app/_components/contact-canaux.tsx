import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const canaux = [
  {
    icon: Mail,
    title: "Email",
    href: "mailto:gazpoints@gmail.com",
    value: "gazpoints@gmail.com",
    description:
      "Le canal principal. C'est ici que tu nous écris pour tout le reste.",
    note: "Réponse sous 48 h ouvrées.",
  },
  {
    icon: Phone,
    title: "Téléphone",
    href: "tel:+237672072550",
    value: "+237 672 07 25 50",
    description:
      "Pour une question urgente sur un point de vente, sur une commande ou sur un accès.",
    note: "Du lundi au samedi, 8 h – 18 h.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    href: "https://wa.me/237659169960",
    value: "+237 659 16 99 60",
    description:
      "Pour envoyer une photo de l'écran ou la photo d'un point de vente qui manque.",
    note: "Les photos sont traitées comme des signalements.",
  },
  {
    icon: MapPin,
    title: "Adresse",
    value: "Douala, Bonamoussadi — ISTAMA Sable",
    description:
      "Courrier, réclamation écrite, et pièces à conviction.",
    note: "Douala, Cameroun.",
  },
]

export function ContactCanaux() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="secondary"
            className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]"
          >
            Nos coordonnées
          </Badge>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Quatre façons de{" "}
            <span className="text-primary">nous joindre</span>
          </h2>
        </div>

        <ul className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2">
          {canaux.map((canal) => (
            <li key={canal.title}>
              <Card className="h-full transition-all hover:border-primary/40 hover:shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <canal.icon className="size-5" aria-hidden />
                    </span>
                    <CardTitle className="text-lg">{canal.title}</CardTitle>
                  </div>
                </CardHeader>

                <CardContent>
                  {canal.href ? (
                    <a
                      href={canal.href}
                      target={canal.href.startsWith("http") ? "_blank" : undefined}
                      rel={
                        canal.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="text-pretty font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                    >
                      {canal.value}
                    </a>
                  ) : (
                    <p className="text-pretty font-medium text-foreground">
                      {canal.value}
                    </p>
                  )}
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {canal.description}
                  </p>
                </CardContent>

                <CardFooter>
                  <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5 shrink-0" aria-hidden />
                    {canal.note}
                  </p>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
