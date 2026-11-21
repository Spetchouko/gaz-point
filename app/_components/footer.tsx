"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { FOOTER_COPYRIGHT, FOOTER_TAGLINE } from "@/lib/footer-text";

export function Footer() {
  const shortcutsMobileTablet = [
    { label: "Accueil", href: "/" },
    { label: "Trouver mon gaz", href: "/?#recherche-gaz" },
    { label: "Comment ça marche ?", href: "/#comment-ca-marche" },
    { label: "À propos", href: "/a-propos" },
  ];

  const shortcutsDesktop = [
    { label: "Accueil", href: "/" },
    { label: "Trouver du gaz", href: "/?#recherche-gaz" },
    { label: "Comment ça marche", href: "/#comment-ca-marche" },
    { label: "À propos", href: "/a-propos" },
    { label: "Contact", href: "/contact" },
  ];

  const contactLinks = [{ label: "Contact", href: "/contact" }];

  const legalLinks = [
    { label: "Mentions légales", href: "/mentions-legales" },
    { label: "CGU", href: "/cgu" },
    { label: "Politique de confidentialité", href: "/politique-confidentialite" },
    { label: "Conditions générales de vente", href: "/cgv" },
    { label: "Politique de cookies", href: "/politique-cookies" },
  ];

  const accountLinks = [
    { label: "Créer un compte", href: "/inscription" },
    { label: "Se connecter", href: "/connexion" },
  ];

  const hSepMobile = "h-px w-24 border-primary/40 bg-primary/40 sm:w-32 md:w-40 lg:hidden";
  const vSepDesktop = "hidden lg:block lg:self-stretch lg:w-px lg:h-auto border-primary/40 bg-primary/40";

  return (
    <footer className="border-t border-border bg-mint">
      <div className="container mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-14 lg:max-w-7xl lg:px-8">
        {/* Mobile & tablette (inchangés) */}
        <div className="flex flex-col items-center gap-6 text-center md:gap-8 lg:hidden">
          {/* 1. Bloc GazPoints */}
          <section className="w-full space-y-3">
            <Link href="/" className="inline-flex items-center justify-center gap-2">
              <Image
                src="/brand/logo.png"
                alt="GazPoints"
                width={28}
                height={28}
                className="h-6 w-6 shrink-0 object-contain"
                style={{ width: "auto", height: "auto" }}
              />
              <span className="font-heading text-lg font-bold tracking-tight text-foreground">GazPoints</span>
            </Link>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
              GazPoints est une plateforme permettant de rechercher et de vérifier la disponibilité des bouteilles de gaz auprès des points de vente.
            </p>
          </section>

          {/* 2. Premier trait de séparation */}
          <Separator className="h-px w-24 border-primary/40 bg-primary/40 sm:w-32 md:w-40" />

          {/* 3. Bloc Raccourcis */}
          <section className="w-full space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Raccourcis</h2>
            <ul className="space-y-2">
              {shortcutsMobileTablet.map((item) => (
                <li key={`${item.label}-${item.href}`}>
                  <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 4. Deuxième trait de séparation */}
          <Separator className="h-px w-24 border-primary/40 bg-primary/40 sm:w-32 md:w-40" />

          {/* 5. Bloc Contact */}
          <section className="w-full space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Contact</h2>
            <ul className="space-y-2">
              {contactLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 6. Troisième trait de séparation */}
          <Separator className="h-px w-24 border-primary/40 bg-primary/40 sm:w-32 md:w-40" />

          {/* 7. Bloc Pages légales */}
          <section className="w-full space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Pages légales</h2>
            <ul className="space-y-2">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 8. Quatrième trait de séparation */}
          <Separator className="h-px w-24 border-primary/40 bg-primary/40 sm:w-32 md:w-40" />

          {/* 9. Bloc Se connecter */}
          <section className="w-full space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Se connecter</h2>
            <ul className="space-y-2">
              {accountLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Desktop uniquement */}
        <div className="hidden lg:flex lg:flex-row lg:items-start lg:justify-between lg:gap-6 lg:text-left">
          {/* Bloc 1 — Logo GazPoints */}
          <section className="flex-1 min-w-0 space-y-3">
            <Link href="/" className="inline-flex items-center justify-start gap-2">
              <Image
                src="/brand/logo.png"
                alt="GazPoints"
                width={28}
                height={28}
                className="h-6 w-6 shrink-0 object-contain"
                style={{ width: "auto", height: "auto" }}
              />
              <span className="font-heading text-lg font-bold tracking-tight text-foreground">GazPoints</span>
            </Link>
            <p className="max-w-none text-left text-sm leading-relaxed text-muted-foreground">
              GazPoints est une plateforme permettant de rechercher et de vérifier la disponibilité des bouteilles de gaz auprès des points de vente.
            </p>
          </section>

          {/* 1er séparateur */}
          <Separator orientation="vertical" className={vSepDesktop} />

          {/* Bloc 2 — Raccourcis */}
          <section className="flex-1 min-w-0 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Raccourcis</h2>
            <ul className="space-y-2">
              {shortcutsDesktop.map((item) => (
                <li key={`${item.label}-${item.href}`}>
                  <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 2e séparateur */}
          <Separator orientation="vertical" className={vSepDesktop} />

          {/* Bloc 3 — Pages légales */}
          <section className="flex-1 min-w-0 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Pages légales</h2>
            <ul className="space-y-2">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 3e séparateur */}
          <Separator orientation="vertical" className={vSepDesktop} />

          {/* Bloc 4 — Se connecter */}
          <section className="flex-1 min-w-0 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Se connecter</h2>
            <ul className="space-y-2">
              {accountLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="space-y-3 pt-1">
              <a
                href="mailto:gazpoints@gmail.com"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="size-4 shrink-0 text-primary" aria-hidden />
                <span>gazpoints@gmail.com</span>
              </a>
              <div>
                <Button
                  render={<Link href="/connexion" />}
                  nativeButton={false}
                  size="sm"
                  className="w-fit"
                >
                  Se connecter
                </Button>
              </div>
            </div>
          </section>
        </div>

        {/* 4e séparateur (horizontal, sous la rangée / sections) */}
        <div className="mt-6 flex justify-center md:mt-8">
          <Separator className="h-px w-24 border-primary/40 bg-primary/40 sm:w-32 md:w-40 lg:w-full" />
        </div>

        {/* Copyright et signature (centrés) */}
        <div className="w-full pt-6 text-center md:pt-8">
          <p className="text-xs text-muted-foreground">{FOOTER_COPYRIGHT}</p>
          <p className="mt-1 text-xs text-muted-foreground">{FOOTER_TAGLINE}</p>
        </div>
      </div>
    </footer>
  );
}
