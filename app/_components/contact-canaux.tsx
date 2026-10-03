import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react"

const canaux = [
  {
    icon: Mail,
    title: "Email",
    value: "[ADRESSE EMAIL DE CONTACT]",
    description:
      "Le canal principal. C’est ici que tu nous écrivez pour tout le reste.",
    note: "Réponse sous 48 h ouvrées.",
  },
  {
    icon: Phone,
    title: "Téléphone",
    value: "[NUMÉRO DE TÉLÉPHONE]",
    description:
      "Pour une question urgente sur un point de vente, sur une commande ou sur un accès.",
    note: "Du lundi au samedi, 8 h – 18 h.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    value: "[NUMÉRO WHATSAPP]",
    description:
      "Pour envoyer une photo de l’écran ou la photo d’un point de vente qui manque.",
    note: "Les photos sont traitées comme des signalements.",
  },
  {
    icon: MapPin,
    title: "Adresse",
    value: "[ADRESSE COMPLÈTE DU SIÈGE, AU CAMEROUN]",
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
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Nos coordonnées
          </p>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Quatre façons de{" "}
            <span className="text-primary">nous joindre</span>
          </h2>
        </div>

        <ul className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2">
          {canaux.map((canal) => (
            <li
              key={canal.title}
              className="flex flex-col rounded-xl border bg-card p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <canal.icon className="size-5" aria-hidden />
                </span>
                <h3 className="text-lg font-semibold text-foreground">
                  {canal.title}
                </h3>
              </div>

              <p className="mt-4 text-pretty font-medium text-foreground">
                {canal.value}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {canal.description}
              </p>

              <p className="mt-4 inline-flex items-center gap-1.5 border-t pt-3 text-xs text-muted-foreground">
                <Clock className="size-3.5 shrink-0" aria-hidden />
                {canal.note}
              </p>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted-foreground">
          Les coordonnées ci-dessus sont des espaces réservés, à compléter avant la
          mise en ligne du site.
        </p>
      </div>
    </section>
  )
}