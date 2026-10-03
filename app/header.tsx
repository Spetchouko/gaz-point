"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/#comment-ca-marche", label: "Comment ça marche" },
  { href: "/#trouver-du-gaz", label: "Trouver du gaz" },
  { href: "/#faq", label: "FAQ" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
]

const cta = { href: "/#trouver-du-gaz", label: "Trouver du gaz" }

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/65">
      <div className="container mx-auto flex h-16 items-center gap-3 px-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
        <Link
          href="/"
          onClick={closeMenu}
          className="flex items-center gap-2 transition-opacity hover:opacity-80 lg:justify-self-start"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F2] ring-1 ring-black/5">
            <Image
              src="/brand/logo.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </span>
          <span className="font-heading text-lg font-bold tracking-tight text-foreground">
            GazPoint
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {navLinks.map((link) => (
            <NavLink key={link.href} {...link} active={pathname === link.href} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:justify-self-end">
          <Button
            render={<Link href={cta.href} />}
            nativeButton={false}
            size="lg"
            className="h-9 gap-1.5 px-4"
          >
            <Search className="size-4" />
            {cta.label}
          </Button>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  className="inline-flex size-9 items-center justify-center rounded-lg text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden"
                >
                  <Menu className="size-5" />
                  <span className="sr-only">Ouvrir le menu</span>
                </button>
              }
            />
            <SheetContent side="right" className="w-[85vw] max-w-sm gap-0 p-0">
              <SheetHeader className="border-b p-4">
                <SheetTitle>Menu</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Trouve du gaz près de chez toi.
                </p>
              </SheetHeader>

              <nav className="flex flex-col gap-1 p-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    aria-current={pathname === link.href ? "page" : undefined}
                    className="rounded-lg px-3 py-3 text-base text-foreground transition-colors hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <SheetFooter className="border-t p-4">
                <Button
                  render={<Link href={cta.href} />}
                  nativeButton={false}
                  size="lg"
                  className="h-11 w-full gap-1.5"
                  onClick={closeMenu}
                >
                  <Search className="size-4" />
                  {cta.label}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active?: boolean
}) {
  return (
    <Link
      href={href}
      data-active={active || undefined}
      className="relative py-1 text-sm text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:text-foreground hover:after:scale-x-100 data-active:text-foreground data-active:font-medium data-active:after:scale-x-100"
    >
      {label}
    </Link>
  )
}