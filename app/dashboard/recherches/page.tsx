"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { RechercheGaz } from "@/app/_components/recherche-gaz";

export default function RecherchePage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground shadow-sm">
          Chargement de la recherche…
        </div>
      }
    >
      <RechercheGaz redirectToResults />
    </Suspense>
  );
}
