"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Cylinder, LogOut } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import {
  getAdminNavItems,
  type StaffNavRole,
} from "@/app/_components/admin-nav-items"

export function AdminNav({
  role,
  permissions,
}: {
  role: StaffNavRole
  permissions: string[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const user = session?.user as
    | { name?: string | null; email?: string | null; role?: string | null }
    | undefined
  const roleLabel = role === "collaborateur" ? "Collaborateur" : "Administrateur"
  const initial = user?.name?.charAt(0).toUpperCase() ?? "A"
  const navItems = getAdminNavItems(role, permissions)

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <nav
      aria-label="Navigation administration"
      className="flex h-full flex-col"
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link
          href="/admin"
          className="flex items-center gap-2 font-bold text-lg"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cylinder className="size-5" />
          </span>
          <span>GAZ POINT Admin</span>
        </Link>
      </div>

      <ul className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="border-t p-4 space-y-2">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.name ?? "Administrateur"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden />
          Déconnexion
        </button>
      </div>
    </nav>
  )
}