"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LayoutDashboard, LogOut, User } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface UserMenuProps {
  isMobile?: boolean
}

export function UserMenu({ isMobile = false }: UserMenuProps) {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const user = session?.user
  const role = (user as { role?: string } | undefined)?.role
  const isStaff = role === "admin" || role === "collaborateur"
  const espaceHref = isStaff ? "/admin" : role === "vendor" ? "/dashboard/pro" : "/dashboard"
  const espaceLabel = isStaff ? "Administration" : "Mon espace"

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  if (!user) return null

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const avatarSize = isMobile ? "lg" : "default"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn("gap-2 h-9 px-3", isMobile && "w-full justify-start py-2.5 text-left")}
        >
          <Avatar className="size-8" data-size={avatarSize}>
            {user.image ? (
              <AvatarImage src={user.image} alt={user.name ?? "Avatar"} />
            ) : (
              <AvatarFallback>{initials ?? "?"}</AvatarFallback>
            )}
          </Avatar>
          {!isMobile && <span className="hidden sm:inline">{user.name}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 border-b">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={espaceHref} className="flex items-center gap-2">
            <LayoutDashboard className="size-4" />
            {espaceLabel}
          </Link>
        </DropdownMenuItem>
        {!isStaff && (
          <DropdownMenuItem asChild>
            <Link href="/profil" className="flex items-center gap-2">
              <User className="size-4" />
              Mon profil
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}