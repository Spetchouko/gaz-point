"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Menu, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthModal } from "@/lib/auth-context"
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
  { href: "/#trouver-du-gaz", label: "Trouver du gaz", isAction: true },
  { href: "/#faq", label: "FAQ" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, openAuthModal } = useAuthModal()
  const closeMenu = () => setMobileMenuOpen(false)

  const handleActionClick = (e: React.MouseEvent, href: string) => {
    if (!isAuthenticated) {
      e.preventDefault()
      closeMenu()
      openAuthModal("register")
    } else {
      closeMenu()
      router.push(href)
    }
  }

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
            <NavLink
              key={link.href}
              {...link}
              active={pathname === link.href}
              onClick={link.isAction ? (e) => handleActionClick(e, link.href) : undefined}
            />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:justify-self-end">
          <Button
            size="lg"
            className="h-9 gap-1.5 px-4 cursor-pointer"
            onClick={(e) => handleActionClick(e, "/#trouver-du-gaz")}
          >
            <Search className="size-4" />
            Trouver du gaz
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
                    onClick={link.isAction ? (e) => handleActionClick(e, link.href) : closeMenu}
                    aria-current={pathname === link.href ? "page" : undefined}
                    className="rounded-lg px-3 py-3 text-base text-foreground transition-colors hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <SheetFooter className="border-t p-4">
                <Button
                  size="lg"
                  className="h-11 w-full gap-1.5 cursor-pointer"
                  onClick={(e) => handleActionClick(e, "/#trouver-du-gaz")}
                >
                  <Search className="size-4" />
                  Trouver du gaz
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
  onClick,
}: {
  href: string
  label: string
  active?: boolean
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      data-active={active || undefined}
      className="relative py-1 text-sm text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:text-foreground hover:after:scale-x-100 data-active:text-foreground data-active:font-medium data-active:after:scale-x-100"
    >
      {label}
    </Link>
  )
}