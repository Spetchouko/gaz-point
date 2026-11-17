"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export function ScrollToDirection() {
  const t = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [nearBottom, setNearBottom] = useState(false);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToBottom = useCallback(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrollHeight = document.documentElement.scrollHeight;
          const clientHeight = document.documentElement.clientHeight;

          setScrolled(scrollTop > 200);
          setNearBottom(scrollTop + clientHeight >= scrollHeight - 50);

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Logique d'affichage de la flèche :
  // - En haut de page (scrolled = false) → flèche vers le bas (aller en bas)
  // - Proche du bas de page (nearBottom = true) → flèche vers le haut (retour en haut)
  // - Au milieu de page → flèche vers le bas par défaut (continuer vers le bas)
  const showArrowDown = !nearBottom;
  const showArrowUp = nearBottom;

  const icon = showArrowDown ? <ArrowDown className="size-5" /> : <ArrowUp className="size-5" />;
  const label = showArrowDown ? t("nav_scroll_bottom") : t("nav_scroll_top");
  const onClick = showArrowDown ? scrollToBottom : scrollToTop;

  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "fixed bottom-4 right-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground",
        "shadow-lg shadow-primary/25 transition-all duration-300 ease-in-out",
        "flex items-center justify-center",
        prefersReducedMotion ? "transition-none" : "",
        "pointer-events-auto cursor-pointer",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      )}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  );
}
