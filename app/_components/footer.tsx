import Image from "next/image"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"

const navigation = [
  { label: "Comment ça marche", href: "/#comment-ca-marche" },
  { label: "Trouver du gaz", href: "/#trouver-du-gaz" },
  { label: "FAQ", href: "/#faq" },
]

const gazpoint = [
  { label: "À propos", href: "/a-propos" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
  { label: "Accueil", href: "/" },
]

const legal = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Conditions d'utilisation", href: "/cgu" },
  { label: "Politique de confidentialité", href: "/politique-confidentialite" },
  { label: "Politique cookies", href: "/politique-cookies" },
  { label: "Conditions de vente", href: "/cgv" },
]

function FooterNav({
  title,
  items,
}: {
  title: string
  items: { label: string; href: string }[]
}) {
  return (
    <nav aria-label={title}>
      <h2 className="font-heading text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground/60">
        {title}
      </h2>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function Footer() {
  return (
    <footer className="w-full bg-gradient-to-br from-navy to-navy-strong text-primary-foreground">
      <div className="container mx-auto px-4 py-12 pb-20 md:py-14 md:pb-20">
        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr_1fr_1fr] md:gap-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-lg font-bold tracking-tight"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary">
                <Image
                  src="/brand/logo.png"
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
              </span>
              GazPoints
            </Link>

            <p className="mt-4 max-w-xs text-pretty text-sm text-primary-foreground/70">
              Vérifie où il y en a avant de te déplacer.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:contents">
            <FooterNav title="Navigation" items={navigation} />
            <FooterNav title="GazPoints" items={gazpoint} />
            <FooterNav title="Informations légales" items={legal} />
          </div>
        </div>

        <div className="mt-10">
          <Separator className="bg-primary-foreground/15" />
          <div className="flex flex-col gap-2 pt-6 text-xs text-primary-foreground/60 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} GazPoints. Tous droits réservés.</p>
            <p>Fait à Douala, Cameroun.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
