import { Clock, MapPin, Mail, MessageCircle } from "lucide-react"
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
      "Le canal principal. C'est ici que vous nous écrivez pour tout le reste.",
    note: "Réponse sous 48 h ouvrées.",
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
            <span className="text-primary">Nos coordonnées</span> pour rester en contact
          </h2>
        </div>

        <div className="mx-auto mt-8 flex flex-wrap justify-center items-center gap-3 sm:gap-4">
          {canaux.map((canal) => (
            <Card
              key={canal.title}
              className="flex-1 min-w-[280px] max-w-sm w-full flex-col border border-border rounded-lg overflow-hidden hover:shadow-sm transition-shadow"
            >
              <CardHeader className="p-4 border-b border-border flex-1">
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
                  >
                    <canal.icon className="size-4" aria-hidden />
                  </span>
                  <CardTitle className="text-lg">{canal.title}</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="p-4 flex-1 min-w-0">
                {canal.href ? (
                  <a
                    href={canal.href}
                    target={canal.href.startsWith("http") ? "_blank" : undefined}
                    rel={canal.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="text-pretty break-words font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                  >
                    {canal.value}
                  </a>
                ) : (
                  <p className="text-pretty break-words font-medium text-foreground">
                    {canal.value}
                  </p>
                )}
                <p className="mt-1.5 text-sm text-muted-foreground break-words">
                  {canal.description}
                </p>
              </CardContent>

              <CardFooter className="p-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground min-w-0">
                <p className="inline-flex items-center gap-1.5 break-words">
                  <Clock className="size-3.5 shrink-0" aria-hidden />
                  {canal.note}
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}