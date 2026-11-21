const PAYMENT_CHECKOUT_ERROR =
  "L’adresse de paiement reçue est invalide. Réessayez."

/**
 * Valide l’URL de checkout avant toute redirection navigateur.
 *
 * Le prestataire fournit une URL externe. Seuls HTTPS et une URL sans
 * identifiants embarqués sont acceptés afin d’éviter une redirection vers un
 * protocole dangereux ou une adresse manipulatee.
 */
export function validatePaymentCheckoutUrl(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error(PAYMENT_CHECKOUT_ERROR)
  }

  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(PAYMENT_CHECKOUT_ERROR)
  }

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    throw new Error(PAYMENT_CHECKOUT_ERROR)
  }

  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error(PAYMENT_CHECKOUT_ERROR)
  }

  return url.toString()
}
