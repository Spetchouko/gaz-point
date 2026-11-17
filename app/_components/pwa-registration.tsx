"use client";

import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        }).then((registration) => {
          console.log("SW inscrit :", registration.scope);
        }).catch((err) => {
          console.error("Erreur d'enregistrement SW :", err);
        });
      });
    }
  }, []);

  return null;
}