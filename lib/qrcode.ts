import QRCode from "qrcode"
import { isValidReservationCode as validateReservationCode } from "@/lib/reservation-code"

/**
 * Génère un QR Code au format Data URL (base64 PNG) à partir du code de réservation.
 * Le QR Code contient uniquement le code de réservation (12 caractères alphanumériques).
 */
export async function generateReservationQRCode(
  reservationCode: string
): Promise<string> {
  return QRCode.toDataURL(reservationCode, {
    width: 256,
    margin: 2,
    color: {
      dark: "#111827", // gray-900
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  })
}

/**
 * Génère un QR Code au format SVG string.
 */
export async function generateReservationQRCodeSVG(
  reservationCode: string
): Promise<string> {
  return QRCode.toString(reservationCode, {
    type: "svg",
    width: 256,
    margin: 2,
    color: {
      dark: "#111827",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  })
}

/**
 * Valide qu'une chaîne correspond au format de code de réservation (12 chars alphanum sans 0,1,O,I,L,S).
 */
export function isValidReservationCode(code: string): boolean {
  return validateReservationCode(code)
}