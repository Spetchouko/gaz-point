"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

const MAX_VISITES_BEFORE_PROMPT = 3;

export function usePwaInstallation() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [alreadyPrompted, setAlreadyPrompted] = useState(false);
  const visitCountRef = useRef<number>(0);

  // Compter les visites depuis le LocalStorage (clé anonyme)
  useEffect(() => {
    const stored = localStorage.getItem("pwa_visit_count");
    if (stored !== null) {
      visitCountRef.current = parseInt(stored, 10) || 0;
    }
    visitCountRef.current += 1;
    localStorage.setItem("pwa_visit_count", visitCountRef.current.toString());

    // Déclencher le prompt après le N-ème visite (1, 2 ou 3)
    if (visitCountRef.current >= MAX_VISITES_BEFORE_PROMPT && !alreadyPrompted) {
      setShowPrompt(true);
    }
  }, []);

  // Écouter l'événement d'installation du browser
  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      // beforeinstallprompt is a non-standard event
      const customEvent = event as BeforeInstallPromptEvent
      customEvent.preventDefault()
      setIsInstallable(true)
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);

    // Écoute de l'installation réussie
    const handleAppInstalled = () => {
      setAlreadyPrompted(true);
      visitCountRef.current = 0; // Reset counter after successful install
      localStorage.setItem("pwa_visit_count", "0");
      setShowPrompt(false);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [showPrompt, alreadyPrompted]);

  const handleInstall = async () => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      // Déclencher l'installation via le SW
      // Sur Android, window.navigator.serviceWorker.ready.then(...)
      // Sur iOS, on affiche les instructions natives
      setShowPrompt(false);
    }
  };

  const handleLater = () => {
    // Ne pas réafficher pendant cette visite, mais permettre une nouvelle invitation later
    setShowPrompt(false);
  };

  const handleNever = () => {
    setAlreadyPrompted(true);
    setShowPrompt(false);
    // On peut stocker un flag pour ne plus jamais afficher pendant cette session
    // Mais par défaut, on permet une nouvelle invitation lors d'une visite ultérieure
  };

  return {
    showPrompt,
    isInstallable,
    alreadyPrompted,
    handleInstall,
    handleLater,
    handleNever,
  };
}

export function PwaInstallationBanner() {
  const {
    showPrompt,
    isInstallable,
    alreadyPrompted,
    handleInstall,
    handleLater,
    handleNever,
  } = usePwaInstallation();

  if (alreadyPrompted) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 z-50 px-4 py-3 animate-in slide-up-from-bottom medium-zoom-transitions">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Loader2 className="size-4 animate-spin opacity-70" />
          <span className="font-medium text-foreground">
            Installer GazPoints sur votre &eacute;cran d&apos;accueil
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleInstall}
            disabled={!isInstallable}
            className="flex-1"
          >
            Installer
          </Button>
          <Button
            onClick={handleLater}
            variant="ghost"
            className="flex-1"
          >
            Plus tard
          </Button>
          <Button
            onClick={handleNever}
            variant="ghost"
            size="sm"
            className="text-sm text-muted-foreground"
          >
            Ne plus afficher
          </Button>
        </div>
      </div>
    </div>
  );
}