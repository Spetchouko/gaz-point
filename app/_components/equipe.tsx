import Link from "next/link"
import { Mail } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
const petchImage = "/petch.png"
const henokImage = "/team/henok.png"
const fabiolaImage = "/team/Fabiola.png"

const equipe = [
  {
    role: "Fondation et direction",
    name: "PETCHOUKO Solomon",
    image: petchImage,
    description:
      "A lancé GazPoints après avoir constat le problème sur le terrain, quartier par quartier.",
  },
  {
    role: "Produit et développement",
    name: "TCHOFFO HENOK",
    image: henokImage,
    description:
      "Construit le service de recherche, la carte des points de vente et les espaces vendeurs.",
  },
  {
    role: "Relation points de vente",
    name: "DJUIKOUO FABIOLA",
    image: fabiolaImage,
    description:
      "Gère la communication et le support utilisateur sur la plateforme.",
  },
]

export function Equipe() {
  return (
    <section className="w-full py-16 md:py-24 bg-muted/50 border-y">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="secondary"
            className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]"
          >
            L'équipe
          </Badge>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Une petite équipe,{" "}
            <span className="text-primary">un grand territoire</span>
          </h2>

          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
            GazPoints est portée par une équipe locale, à Douala. Nous couvrons
            progressivement les quartiers où le service est le plus utile.
          </p>
        </div>

        <ul className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {equipe.map((membre) => (
            <li key={membre.role}>
              <Card className="transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
                <CardHeader className="text-center">
                  <Avatar className="mx-auto size-12 ring-1 ring-primary/20">
                    {membre.image ? (
                      <AvatarImage
                        src={membre.image}
                        alt={membre.name}
                        className={membre.role === "Fondation et direction" ? "bg-white" : ""}
                      />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                        {membre.name.replace(/[[\]]/g, "").charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <CardTitle className="mt-3 text-base">
                    {membre.name}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="mx-auto mt-1 w-fit font-medium uppercase tracking-[0.15em] text-muted-foreground"
                  >
                    {membre.role}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground text-center">
                    {membre.description}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
          <Mail className="size-4 shrink-0" aria-hidden />
          Tu es point de vente et tu veux apparaître sur GazPoints ?{" "}
          <Link
            href="/inscription"
            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
          >
            Crée ton espace vendeur
          </Link>
          , écris-nous à{" "}
          <a
            href="mailto:petchouko@gmail.com"
            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
          >
            petchouko@gmail.com
          </a>
          , ou passe par la{" "}
          <Link
            href="/contact"
            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
          >
            page de contact
          </Link>
          .
        </p>
      </div>
    </section>
  )
}