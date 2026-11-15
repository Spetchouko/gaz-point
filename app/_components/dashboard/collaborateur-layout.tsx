"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  User,
  Search,
  Calendar,
  History,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Store,
  Package,
  Truck,
  Shield,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { useAuthModal } from "@/lib/auth-context";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { DashboardFooter } from "@/app/_components/dashboard/dashboard-footer";
import { ScrollToTop } from "@/app/_components/dashboard/scroll-to-top";
import { cn } from "@/lib/utils";

const COLLABORATEUR_MODULES = [
  {
    key: "utilisateurs",
    label: "Gestion des utilisateurs",
    href: "/dashboard/admin/utilisateurs",
    icon: Users,
  },
  {
    key: "clients",
    label: "Clients",
    href: "/dashboard/admin/utilisateurs?role=client",
    icon: Users,
  },
  {
    key: "vendeurs",
    label: "Gestion des vendeurs",
    href: "/dashboard/admin/vendeurs",
    icon: Store,
  },
  {
    key: "disponibilites",
    label: "Disponibilités",
    href: "/dashboard/admin/disponibilites",
    icon: Package,
  },
  {
    key: "reservations",
    label: "Gestion des réservations",
    href: "/dashboard/admin/reservations",
    icon: Calendar,
  },
  {
    key: "publicite",
    label: "Annonces & publicités",
    href: "/dashboard/admin/publicite",
    icon: Truck,
  },
  {
    key: "collaborateurs",
    label: "Gestion des collaborateurs",
    href: "/dashboard/admin/collaborateurs",
    icon: Shield,
  },
  {
    key: "marketing",
    label: "Marketing",
    href: "/dashboard/admin/analytics",
    icon: BarChart3,
  },
  {
    key: "avis",
    label: "Avis",
    href: "/dashboard/admin/utilisateurs?type=avis",
    icon: MessageSquare,
  },
  {
    key: "statistiques",
    label: "Statistiques",
    href: "/dashboard/admin/analytics",
    icon: BarChart3,
  },
] as const;

type CollaborateurModuleKey = (typeof COLLABORATEUR_MODULES)[number]["key"];

interface CollaborateurLayoutProps {
  children: React.ReactNode;
  permissions: Set<CollaborateurModuleKey>;
}

export function CollaborateurLayout({
  children,
  permissions,
}: CollaborateurLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, openAuthModal } = useAuthModal();
  const { data: session } = authClient.useSession();
  const user = session?.user as
    | { name?: string | null; email?: string | null; image?: string | null; role?: string | null }
    | undefined;
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(3);

  // Filter modules based on permissions
  const allowedModules = COLLABORATEUR_MODULES.filter((m) => permissions.has(m.key));

  const isActive = (href: string) =>
    href === "/dashboard/collaborateur"
      ? pathname === "/dashboard/collaborateur"
      : pathname.startsWith(href);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  const handleAuthClick = (mode: "login" | "register") => {
    if (!isAuthenticated) {
      openAuthModal(mode);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image valide.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5 Mo.");
      return;
    }
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
  };

  const getUserAvatar = () => {
    if (avatarUrl) return avatarUrl;
    if (user?.image) return user.image;
    return null;
  };

  const getUserInitials = () => {
    return user?.name
      ?.split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "C";
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop (positionnée à droite) */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-40 flex h-full flex-col bg-card border-l border-border transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-16" : "w-64",
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
        aria-label="Navigation du dashboard collaborateur"
      >
        {/* Header with logo */}
        <div
          className={cn(
            "flex h-16 items-center justify-between border-b border-border px-4",
            sidebarCollapsed && "justify-center px-0"
          )}
        >
          <Link
            href="/dashboard/collaborateur"
            className="flex items-center gap-2 font-bold text-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Image
                src="/brand/logo.png"
                alt="GazPoints"
                width={24}
                height={24}
                className="h-5 w-5 object-contain"
              />
            </span>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg tracking-tight">GazPoints</span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? "Étendre le menu" : "Réduire le menu"}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="size-4" aria-hidden />
            ) : (
              <ChevronLeft className="size-4" aria-hidden />
            )}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1" aria-label="Navigation principale">
          {/* Dashboard overview */}
          <Link
            href="/dashboard/collaborateur"
            onClick={() => setSidebarOpen(false)}
            aria-current={isActive("/dashboard/collaborateur") ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive("/dashboard/collaborateur")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              sidebarCollapsed && "justify-center px-2"
            )}
          >
            <LayoutDashboard className={cn("size-4 shrink-0", sidebarCollapsed && "mx-auto")} aria-hidden />
            {!sidebarCollapsed && <span>Vue d'ensemble</span>}
          </Link>

          {/* Allowed modules based on permissions */}
          {allowedModules.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  sidebarCollapsed && "justify-center px-2"
                )}
              >
                <Icon className={cn("size-4 shrink-0", sidebarCollapsed && "mx-auto")} aria-hidden />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          {/* Mon profil - always available */}
          <Link
            href="/dashboard/admin/profil"
            onClick={() => setSidebarOpen(false)}
            aria-current={pathname === "/dashboard/admin/profil" ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/dashboard/admin/profil"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              sidebarCollapsed && "justify-center px-2"
            )}
          >
            <User className={cn("size-4 shrink-0", sidebarCollapsed && "mx-auto")} aria-hidden />
            {!sidebarCollapsed && <span>Mon profil</span>}
          </Link>
        </nav>

        {/* Footer with user info and logout */}
        <div className={cn("border-t border-border p-3 space-y-2", sidebarCollapsed && "px-1")}>
          <div className={cn("flex items-center gap-3 rounded-lg px-3 py-2", sidebarCollapsed && "justify-center")}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {getUserAvatar() ? (
                <Image
                  src={getUserAvatar()!}
                  alt="Avatar utilisateur"
                  width={32}
                  height={32}
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold">{getUserInitials()}</span>
              )}
            </span>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.name || "Collaborateur"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email || "collaborateur@gazpoints.com"} — Collaborateur
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              sidebarCollapsed && "justify-center px-1"
            )}
            aria-label="Se déconnecter"
          >
            <LogOut className={cn("size-4 shrink-0", sidebarCollapsed && "mx-auto")} aria-hidden />
            {!sidebarCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-64">
        {/* Top bar - Mobile menu button */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 lg:hidden">
          <Link
            href="/dashboard/collaborateur"
            className="flex items-center gap-2 font-bold text-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Image
                src="/brand/logo.png"
                alt="GazPoints"
                width={24}
                height={24}
                className="h-5 w-5 object-contain"
              />
            </span>
            <span className="text-primary font-bold tracking-tight">GazPoints</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Menu className="size-5" aria-hidden />
            <span className="sr-only">Menu</span>
          </button>
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:sticky lg:top-0 lg:z-10 lg:flex lg:h-14 lg:items-center lg:justify-between lg:border-b lg:border-border lg:bg-card/80 lg:backdrop-blur-md lg:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">
              Espace Collaborateur
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2 bg-primary/10 text-primary text-sm font-medium">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                {getUserAvatar() ? (
                  <Image
                    src={getUserAvatar()!}
                    alt="Avatar utilisateur"
                    width={24}
                    height={24}
                    className="size-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold">{getUserInitials()}</span>
                )}
              </span>
              <span className="hidden sm:block font-medium">
                {user?.name || "Utilisateur"}
              </span>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => router.push("/dashboard/admin/notifications")}
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 size-2.5 rounded-full bg-destructive text-white text-[10px] leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* Footer public */}
        <DashboardFooter />

        {/* Bouton flottant retour en haut */}
        <ScrollToTop />
      </div>
    </div>
  );
}