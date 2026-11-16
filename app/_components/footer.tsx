"use client";

import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";

export function Footer() {
  const t = useTranslation();

  return (
    <footer className="bg-mint border-t border-border">
      <div className="container mx-auto max-w-7xl px-4 py-6 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-10 lg:grid-cols-4 lg:gap-10">
          {/* Section 1: GAZPOINTS */}
          <section className="space-y-2 text-center md:text-left">
            <Link href="/" className="inline-flex items-center gap-2 justify-center md:justify-start">
              <Image
                src="/brand/logo.png"
                alt="GazPoints"
                width={28}
                height={28}
                className="h-6 w-6 object-contain shrink-0"
              />
              <span className="font-heading text-lg font-bold tracking-tight text-foreground">
                GazPoints
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              GazPoints est une plateforme permettant de rechercher et de vérifier la disponibilité des bouteilles de gaz auprès des points de vente.
            </p>
          </section>

          <Separator className="my-1 block md:hidden border-primary w-full max-w-xs mx-auto" />

          {/* Section 2: RACCOURCIS */}
          <section className="text-center md:text-left">
            <h2 className="font-semibold text-sm text-muted-foreground mb-2 text-center md:text-left">
              Raccourcis
            </h2>
            <ul className="space-y-1 text-center md:text-left">
              {[
                { label: "Accueil", href: "/" },
                { label: "Trouver mon gaz", href: "/?#recherche-gaz" },
                { label: "Comment ça marche ?", href: "/#comment-ca-marche" },
                { label: "À propos", href: "/a-propos" },
                { label: "Contact", href: "/contact" },
              ].map((item) => (
                <li key={`${item.label}-${item.href}`}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <Separator className="my-1 block md:hidden border-primary w-full max-w-xs mx-auto" />

          {/* Section 3: PAGES LEGALES */}
          <section className="text-center md:text-left">
            <h2 className="font-semibold text-sm text-muted-foreground mb-2 text-center md:text-left">
              Pages légales
            </h2>
            <ul className="space-y-1 text-center md:text-left">
              {[
                { label: "Mentions légales", href: "/mentions-legales" },
                { label: "Politique de confidentialité", href: "/politique-confidentialite" },
                { label: "Conditions générales d’utilisation", href: "/cgu" },
                { label: "Conditions générales de vente", href: "/cgv" },
                { label: "Politique de cookies", href: "/politique-cookies" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <Separator className="my-1 block md:hidden border-primary w-full max-w-xs mx-auto" />

          {/* Section 4: Espace Utilisateur (liens comptes) */}
          <section className="text-center md:text-left">
            <h2 className="font-semibold text-sm text-muted-foreground mb-2 text-center md:text-left">
              Espace Utilisateur
            </h2>
            <ul className="space-y-1 text-center md:text-left">
              {[
                { label: "Créer un compte", href: "/inscription" },
                { label: "Se connecter", href: "/connexion" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Séparation avant le bas de page */}
        <div className="mt-6 md:mt-20">
          <Separator orientation="horizontal" className="my-1" />
        </div>

        {/* Bas de page : copyright */}
        <div className="container mx-auto max-w-7xl px-4 py-2 md:px-6 lg:px-8 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} GazPoints. Tous droits réservés.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Fait pour faciliter l’accès au gaz au Cameroun.
          </p>
        </div>
      </div>
    </footer>
  );
}
