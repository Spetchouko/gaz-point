"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // L'erreur reste visible dans la console : elle n'est pas masquée.
    console.error("[admin] erreur de rendu:", error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-destructive/25 bg-card p-6 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
        <div className="min-w-0">
          <h2 className="font-semibold text-foreground">
            Impossible d&apos;afficher cette section administrative
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Une erreur est survenue pendant le chargement. Réessayez ; si le problème persiste,
            vérifiez les journaux serveur.
          </p>
          {error.digest ? (
            <p className="mt-2 text-xs text-muted-foreground">Référence : {error.digest}</p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={reset} className="gap-2">
          <RotateCcw className="size-4" aria-hidden />
          Réessayer
        </Button>
      </div>
    </div>
  );
}
