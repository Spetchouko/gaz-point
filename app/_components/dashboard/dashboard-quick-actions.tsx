"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { SettingsPopover } from "@/app/_components/settings-popover";
import { cn } from "@/lib/utils";

export function DashboardQuickActions({
  className,
  popoverPlacement = "bottom",
}: {
  className?: string;
  popoverPlacement?: "bottom" | "top";
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Link
        href="/"
        aria-label="Retour à l'accueil"
        title="Retour à l'accueil"
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Home className="size-5" aria-hidden />
      </Link>
      <SettingsPopover placement={popoverPlacement} />
    </div>
  );
}
