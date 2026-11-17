"use client";

import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
  href: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  isLoading?: boolean;
}

const SIZE_CONFIG: Record<string, { container: string; icon: string; image: string }> = {
  sm: { container: "size-8", icon: "size-4", image: "size-8" },
  md: { container: "size-10", icon: "size-5", image: "size-10" },
  lg: { container: "size-16", icon: "size-6", image: "size-16" },
};

/**
 * Avatar utilisateur réutilisable sur les trois dashboards.
 * - Affiche la photo réelle si l'utilisateur en a téléversée.
 * - Sinon, affiche une icône de profil sobre (remplace les initiales).
 * - Pendant le chargement de la session, affiche un squelette neutre
 *   pour éviter d'afficher un avatar générique par défaut.
 * - Cliquable : redirige vers `href` (sa section « Mon profil »).
 */
export function UserAvatar({
  user,
  href,
  size = "sm",
  className,
  isLoading = false,
}: UserAvatarProps) {
  const dims = SIZE_CONFIG[size] ?? SIZE_CONFIG.sm;
  const hasImage = Boolean(user?.image);

  if (isLoading) {
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center justify-center rounded-full bg-muted shrink-0",
          dims.container,
          className,
        )}
        aria-label="Chargement du profil…"
      >
        <div className={cn("flex items-center justify-center", dims.container)}>
          <div className="animate-pulse rounded-full bg-muted" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 overflow-hidden border border-primary/20 transition-colors hover:bg-primary/20 cursor-pointer",
        dims.container,
        className,
      )}
      aria-label={`Profil de ${user?.name || "l'utilisateur"}`}
    >
      {hasImage ? (
        <Image
          src={user.image!}
          alt="Photo de profil"
          width={32}
          height={32}
          className={cn("object-cover", dims.image)}
        />
      ) : (
        <div className="flex items-center justify-center">
          <User className={dims.icon} />
        </div>
      )}
    </Link>
  );
}
