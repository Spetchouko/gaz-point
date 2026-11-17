"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, User, Calendar, Bell, Settings, Shield, Store, Truck, Package, Home, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuthModal } from "@/lib/auth-context";
import type { DashboardUser } from "@/lib/auth-session";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { DashboardFooter } from "@/app/_components/dashboard/dashboard-footer";
import { ScrollToTop } from "@/app/_components/dashboard/scroll-to-top";
import { cn } from "@/lib/utils";
import { useNotificationUnreadCount } from "@/lib/use-notification-unread-count";

const VENDOR_NAV_ITEMS = [
  {
    key: "depot",
    href: "/dashboard/depot",
    label: "Mon dépôt",
    icon: Store,
    requiredPermission: null,
  },
  {
    key: "disponibilites",
    href: "/dashboard/depot/disponibilites",
    label: "Disponibilités",
    icon: Package,
    requiredPermission: null,
  },
  {
    key: "reservations",
    href: "/dashboard/depot/reservations",
    label: "Réservations",
    icon: Calendar,
    requiredPermission: null,
  },
  {
    key: "historique",
    href: "/dashboard/historique",
    label: "Historique",
    icon: Clock,
    requiredPermission: null,
  },
  {
    key: "parametres",
    href: "/dashboard/parametres",
    label: "Paramètres",
    icon: Settings,
    requiredPermission: null,
  },
  {
    key: "abonnement",
    href: "/dashboard/abonnement",
    label: "Abonnement",
    icon: Shield,
    requiredPermission: null,
  },
  {
    key: "profil",
    href: "/dashboard/vendeur/profil",
    label: "Mon profil",
    icon: User,
    requiredPermission: null,
  },
] as const;

interface VendorVendorLayoutProps {
  children: React.ReactNode;
  permissions: Set<string>;
  session?: DashboardUser | null;
  status?: "loading" | "authenticated" | "unauthenticated";
}

export function VendorVendorLayout({
  children,
  permissions,
  session: sessionProp,
  status: statusProp,
}: VendorVendorLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { openAuthModal, closeAuthModal } = useAuthModal();
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const user = sessionProp ?? undefined;
  const status = statusProp;
  const isAuthenticated = Boolean(user);
  const { unreadCount } = useNotificationUnreadCount(isAuthenticated);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const notificationsHref = "/dashboard/vendor/notifications";

  useEffect(() => {
    setButtonDisabled(status === "loading");
  }, [status]);

  const isActive = (href: string) =>
    href === "/dashboard/vendor" ? pathname === "/dashboard/vendor" : pathname.startsWith(href);

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
      .join("") || "V";
  };

  const handleProfileClick = () => {
    router.push("/dashboard/vendeur/profil");
  };

  const handleNotificationsClick = () => {
    router.push(notificationsHref);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <header
        className={cn(
          "flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-6 sm:px-8 lg:px-8",
          "shadow-sm"
        )}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/vendor"
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
            <span className="font-bold text-lg tracking-tight">GazPoints</span>
          </Link>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              "sidebarCollapsed && justify-center px-1"
            )}
            aria-label="Notifications"
          >
            <Bell className={cn("size-4")} aria-hidden />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 min-w-4 h-4 rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-white text-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
            {unreadCount > 0 && <span>Notifications</span>}
          </button>
          {unreadCount > 0 && (
            <div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
          {unreadCount > 0 && (
            <div
              className="fixed right-0 top-64 lg:right-0 lg:w-64 lg:bg-card lg:border-lg lg:border-border lg:shadow-lg max-h-[calc(100vh-128px)] overflow-y-auto"
            >
              <div className="p-4 space-y-2 text-sm">
                {unreadCount > 99 ? (
                  <p className="text-gray-500">99+ messages non lus</p>
                ) : (
                  <p className="text-gray-500">{unreadCount} message non lu</p>
                )}
                <Button
                  type="button"
                  className="w-full py-2 px-3 rounded-md hover:bg-muted transition-colors text-sm"
                  onClick={() => {
                    // TODO: Mark notifications as read
                  }}
                >
                  Marquer comme lues
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
            <span className="sr-only">Menu</span>
          </button>
          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openAuthModal("login")}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Se connecter"
            >
              <LogOut className="size-4" aria-hidden />
              <span>Se connecter</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Retour dashboard client"
            >
              <ArrowLeft className="size-4" />
              <span>Client</span>
            </Button>
          </div>
        </div>
      </header>

      <aside
        id="vendor-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-full flex-col bg-card border-r border-border transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-16" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "aria-label='Navigation du dashboard vendeur'"
        )}
        aria-label="Navigation du dashboard vendeur"
      >
        <div
          className={cn(
            "flex h-14 items-center justify-between border-b border-border px-4",
            sidebarCollapsed && "justify-center px-0"
          )}
        >
          <Link
            href="/dashboard/vendor"
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

        <nav className="flex-1 overflow-y-auto p-2 space-y-1" aria-label="Navigation principale">
          {allowedNavItems.map((item) => {
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
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  sidebarCollapsed && "justify-center px-2"
                )}
              >
                <Icon className={cn("size-4 shrink-0", sidebarCollapsed && "mx-auto")} aria-hidden />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-border">
          <Search
            placeholder="Rechercher..."
            className="w-full px-3 py-2 rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-0",
          sidebarOpen ? "lg:ml-64" : "lg:ml-0"
        )}
      >
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        <DashboardFooter />

        <ScrollToTop />
      </div>
    </div>
  );
}