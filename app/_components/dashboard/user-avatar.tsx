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
}

const SIZE_CONFIG: Record<string, { container: string; icon: string; image: string }> = {
  sm: { container: "size-8", icon: "size-4", image: "size-8" },
  md: { container: "size-10", icon: "size-5", image: "size-10" },
  lg: { container: "size-16", icon: "size-6", image: "size-16" },
};

/**
 * Avatar utilisateur réutilisable sur les trois dashboards.
 * - Affiche la photo réelle si l'utilisateur en a téléversé une.
 * - Sinon, affiche une icône de profil sobre (remplace les initiales).
 * - Cliquable : redirige vers `href` (sa section « Mon profil »).
 */
export function UserAvatar({
  user,
  href,
  size = "sm",
  className,
}: UserAvatarProps) {
  const dims = SIZE_CONFIG[size] ?? SIZE_CONFIG.sm;
  const hasImage = Boolean(user?.image);

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
