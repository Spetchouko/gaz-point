import { NextResponse } from "next/server";

/**
 * Retourne la liste des providers d'authentification sociale configurés.
 * Permet au client de décider d'afficher ou non les boutons de connexion sociale
 * (ex: Google) selon que les credentials sont présents côté serveur.
 * Aucune donnée sensible n'est exposée.
 */
export const GET = async () => {
  const googleConfigured = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return NextResponse.json({
    providers: {
      google: googleConfigured,
    },
  });
};
