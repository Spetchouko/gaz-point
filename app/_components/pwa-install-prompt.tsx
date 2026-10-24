"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Download, Share2 } from "lucide-react";
import Image from "next/image";

export function PwaInstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Détecter installation existante
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Détecter iOS
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(ua as string).includes("MSStream");
    setIsIOS(ios);

    // Vérifier si "Plus tard" a déjà été choisi
    const later = localStorage.getItem("gaz-pwa-later");
    if (later) {
      const ts = parseInt(later, 10);
      const delayMs = 7 * 24 * 60 * 60 * 1000; // 7 jours
      if (Date.now() - ts < delayMs) {
        return;
      }
    }

    // Ne pas afficher si déjà installé
    if (standalone) return;

    // Événement beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as any);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  // Afficher pour iOS après un court délai (si pas de beforeinstallprompt)
  useEffect(() => {
    if (isIOS && !isStandalone) {
      const timer = setTimeout(() => {
        const later = localStorage.getItem("gaz-pwa-later");
        if (!later || Date.now() - parseInt(later, 10) > 7 * 24 * 60 * 60 * 1000) {
          setShow(true);
        }
      }, 3000); // 3 secondes après chargement
      return () => clearTimeout(timer);
    }
  }, [isIOS, isStandalone]);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        setShow(false);
      }
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleLater = useCallback(() => {
    localStorage.setItem("gaz-pwa-later", Date.now().toString());
    setShow(false);
  }, []);

  const handleClose = useCallback(() => {
    setShow(false);
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-border bg-card/95 p-5 shadow-xl backdrop-blur-md sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
      role="dialog"
      aria-label="Installer GazPoints"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm ring-1 ring-primary/15">
          <Image
            src="/brand/logo.png"
            alt="GazPoints"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
            Installez GazPoints sur votre téléphone
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Retrouvez rapidement les points de vente de gaz depuis votre écran d&apos;accueil.
          </p>

          {isIOS ? (
            <div className="mt-3 rounded-xl bg-muted/40 border border-border p-3 text-xs text-muted-foreground space-y-1.5">
              <p className="font-medium text-foreground">Instructions pour iPhone / iPad :</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Appuyez sur le bouton <Share2 className="inline size-3 mx-0.5" aria-hidden /> <strong>Partager</strong> de Safari.</li>
                <li>Faites défiler et sélectionnez <strong>« Sur l&apos;écran d&apos;accueil »</strong>.</li>
                <li>Appuyez sur <strong>« Ajouter »</strong>.</li>
              </ol>
            </div>
          ) : deferredPrompt ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={handleInstall}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:translate-y-px"
              >
                <Download className="size-4" aria-hidden />
                Installer l&apos;application
              </button>
              <button
                onClick={handleLater}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:translate-y-px"
              >
                Plus tard
              </button>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={handleLater}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:translate-y-px"
              >
                Plus tard
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleClose}
          className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label="Fermer"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
