/**
 * Calcul de distance géodésique entre deux points GPS (formule de haversine).
 *
 * Retourne la distance en kilomètres, arrondie à 1 décimale.
 *
 * @param lat1 - Latitude du point 1 (degrés)
 * @param lng1 - Longitude du point 1 (degrés)
 * @param lat2 - Latitude du point 2 (degrés)
 * @param lng2 - Longitude du point 2 (degrés)
 * @returns Distance en kilomètres, ou null si des coordonnées sont invalides
 */
export function calculateDistanceKm(
  lat1: number | null | undefined,
  lng1: number | null | undefined,
  lat2: number | null | undefined,
  lng2: number | null | undefined,
): number | null {
  if (
    lat1 == null ||
    lng1 == null ||
    lat2 == null ||
    lng2 == null ||
    Number.isNaN(lat1) ||
    Number.isNaN(lng1) ||
    Number.isNaN(lat2) ||
    Number.isNaN(lng2)
  ) {
    return null;
  }

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // rayon de la Terre en km

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10;
}

/**
 * Formate une distance pour l'affichage utilisateur.
 */
export function formatDistanceKm(distanceKm: number | null): string {
  if (distanceKm == null) return "Distance non disponible";
  if (distanceKm < 1) return "< 1 km";
  return `${distanceKm} km`;
}
