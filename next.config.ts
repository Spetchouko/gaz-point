import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Les publicités acceptent des images jusqu'à 5 Mo (limite vérifiée côté
    // serveur dans lib/publicite-config.ts). Le formulaire transmet l'image
    // sous forme de data-URL base64, soit ~6,7 Mo pour une image de 5 Mo.
    // On relève donc la limite du corps des Server Actions (1 Mo par défaut)
    // afin que la validation serveur renvoie un message explicite.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
